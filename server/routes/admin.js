import express from "express";
import jwt from "jsonwebtoken";
import { pool, hasDbUrl } from "../db.js";

const router = express.Router();

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || "steezedrip2025";
const JWT_SECRET = process.env.JWT_SECRET || "steeze_super_secret_jwt_key_99";

// POST /api/admin/login
router.post("/login", (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ success: false, error: "Password is required" });
  }

  if (password.trim() === ADMIN_SECRET.trim()) {
    const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ success: true, token });
  }

  return res.status(401).json({ success: false, error: "Incorrect admin password" });
});

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    if (hasDbUrl && pool) {
      const prodCount = await pool.query("SELECT COUNT(*) FROM products");
      const orderStats = await pool.query(
        "SELECT COUNT(*) as total_orders, COALESCE(SUM(amount_ngn), 0) as total_revenue_ngn FROM orders WHERE status = 'paid'"
      );

      return res.json({
        success: true,
        totalProducts: parseInt(prodCount.rows[0].count, 10),
        totalOrders: parseInt(orderStats.rows[0].total_orders, 10),
        totalRevenueNGN: parseFloat(orderStats.rows[0].total_revenue_ngn),
      });
    }

    return res.json({
      success: true,
      totalProducts: 3,
      totalOrders: 0,
      totalRevenueNGN: 0,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
