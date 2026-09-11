import express from "express";
import axios from "axios";
import crypto from "crypto";
import { pool, hasDbUrl } from "../db.js";

const router = express.Router();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";
const hasPaystack = Boolean(PAYSTACK_SECRET && PAYSTACK_SECRET.startsWith("sk_"));

// In-memory fallback for orders when PostgreSQL is not configured
let fallbackOrders = [];

// POST /api/payments/initialize
router.post("/initialize", async (req, res) => {
  try {
    const { name, email, phone, address, cart, amountNGN, amountUSD } = req.body;

    if (!email || !amountNGN || !cart || cart.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: email, amountNGN, or cart items.",
      });
    }

    const reference = `STEEZE-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Create pending order in DB or fallback
    if (hasDbUrl && pool) {
      await pool.query(
        `INSERT INTO orders (reference, customer_name, customer_email, customer_phone, delivery_address, items, amount_ngn, amount_usd, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')`,
        [
          reference,
          name || "Customer",
          email,
          phone || "",
          address || "",
          JSON.stringify(cart),
          amountNGN,
          amountUSD || 0,
        ]
      );
    } else {
      fallbackOrders.unshift({
        reference,
        customer_name: name || "Customer",
        customer_email: email,
        customer_phone: phone || "",
        delivery_address: address || "",
        items: cart,
        amount_ngn: amountNGN,
        amount_usd: amountUSD || 0,
        status: "pending",
        created_at: new Date().toISOString(),
      });
    }

    // Call Paystack API to initialize transaction
    if (hasPaystack) {
      const response = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email,
          amount: Math.round(Number(amountNGN) * 100), // Paystack expects kobo
          reference,
          metadata: {
            customer_name: name,
            customer_phone: phone,
            delivery_address: address,
            cart,
          },
          channels: ["card", "bank", "ussd", "bank_transfer"],
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
            "Content-Type": "application/json",
          },
        }
      );

      return res.json({
        success: true,
        authorization_url: response.data.data.authorization_url,
        access_code: response.data.data.access_code,
        reference,
      });
    }

    // Demo/Development mode response when PAYSTACK_SECRET_KEY is not yet added
    return res.json({
      success: true,
      demoMode: true,
      reference,
      message: "Paystack Secret Key not provided in .env yet. Running in Test/Demo Mode.",
    });
  } catch (err) {
    console.error("Paystack Initialize Error:", err.response?.data || err.message);
    res.status(500).json({
      success: false,
      error: err.response?.data?.message || err.message,
    });
  }
});

// GET /api/payments/verify/:reference
router.get("/verify/:reference", async (req, res) => {
  const { reference } = req.params;
  try {
    if (hasPaystack) {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
          },
        }
      );

      const data = response.data.data;
      if (data.status === "success") {
        if (hasDbUrl && pool) {
          await pool.query(
            `UPDATE orders 
             SET status = 'paid', paystack_channel = $1, paid_at = CURRENT_TIMESTAMP 
             WHERE reference = $2`,
            [data.channel, reference]
          );
        } else {
          const ord = fallbackOrders.find((o) => o.reference === reference);
          if (ord) ord.status = "paid";
        }
        return res.json({ success: true, verified: true, data });
      }

      return res.json({ success: false, verified: false, status: data.status });
    }

    // Mock verify for demo mode
    if (hasDbUrl && pool) {
      await pool.query("UPDATE orders SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE reference = $1", [reference]);
    } else {
      const ord = fallbackOrders.find((o) => o.reference === reference);
      if (ord) ord.status = "paid";
    }

    return res.json({ success: true, verified: true, demoMode: true, reference });
  } catch (err) {
    console.error("Paystack Verify Error:", err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/payments/webhook - Secure Webhook from Paystack
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    if (!hasPaystack) return res.sendStatus(200);

    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET)
      .update(req.body)
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(400).send("Invalid signature");
    }

    const event = JSON.parse(req.body.toString());
    if (event.event === "charge.success") {
      const ref = event.data.reference;
      console.log(`💰 Paystack Webhook: Payment confirmed for order ${ref}`);

      if (hasDbUrl && pool) {
        await pool.query(
          `UPDATE orders SET status = 'paid', paystack_channel = $1, paid_at = CURRENT_TIMESTAMP WHERE reference = $2`,
          [event.data.channel, ref]
        );
      } else {
        const ord = fallbackOrders.find((o) => o.reference === ref);
        if (ord) ord.status = "paid";
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook processing error:", err);
    res.sendStatus(500);
  }
});

// GET /api/payments/orders - (Used by Admin orders tab)
router.get("/orders", async (req, res) => {
  try {
    if (hasDbUrl && pool) {
      const result = await pool.query(
        "SELECT * FROM orders ORDER BY created_at DESC LIMIT 100"
      );
      return res.json({ success: true, orders: result.rows });
    }

    return res.json({ success: true, orders: fallbackOrders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
