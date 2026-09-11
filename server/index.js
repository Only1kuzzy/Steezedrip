import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDb, hasDbUrl } from "./db.js";
import productsRouter from "./routes/products.js";
import paymentsRouter from "./routes/payments.js";
import adminRouter from "./routes/admin.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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
