import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { initDb, hasDbUrl } from "./db.js";
import productsRouter from "./routes/products.js";
import paymentsRouter from "./routes/payments.js";
import adminRouter from "./routes/admin.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security: Helmet HTTP security headers
app.use(
  helmet({
    crossOriginResourcePolicy: false, // Allow cross-origin images (Cloudinary)
    crossOriginEmbedderPolicy: false,
  })
);

// General API Rate Limiting: 150 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests. Please try again in a few minutes." },
});
app.use("/api/", generalLimiter);

// Strict Rate Limiting on Admin Login to prevent brute-force attacks: 10 attempts per 15 mins
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: "Too many failed login attempts. Account temporarily locked for 15 minutes." },
});
app.use("/api/admin/login", loginLimiter);

// Payment Checkout Rate Limiting: 25 payment initializations per 15 mins
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: { success: false, error: "Payment attempt threshold reached. Please wait a moment." },
});
app.use("/api/payments/initialize", paymentLimiter);

// Enable CORS for frontend
app.use(cors());

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    postgresConnected: hasDbUrl,
    paystackConfigured: Boolean(process.env.PAYSTACK_SECRET_KEY),
    cloudinaryConfigured: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
  });
});

// Mount Routes
app.use("/api/products", productsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/admin", adminRouter);

// Start server and initialize PostgreSQL tables
app.listen(PORT, async () => {
  console.log(`🚀 SteezeDrip Backend running on http://localhost:${PORT}`);
  try {
    await initDb();
  } catch (err) {
    console.warn("DB Init notice:", err.message);
  }
});
