import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

export const hasDbUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim());

export const pool = hasDbUrl
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("localhost")
        ? false
        : { rejectUnauthorized: false },
    })
  : null;

// Initialize PostgreSQL tables
export async function initDb() {
  if (!pool) {
    console.log("ℹ️  DATABASE_URL not detected. Running with local fallback store until PostgreSQL is connected.");
    return;
  }

  const client = await pool.connect();
  try {
    console.log("🔌 Connected to PostgreSQL database. Initializing schemas...");

    // Products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        cat VARCHAR(100) NOT NULL,
        price_ngn NUMERIC NOT NULL,
        price_usd NUMERIC NOT NULL,
        tag VARCHAR(50) DEFAULT '',
        category VARCHAR(50) DEFAULT 'all',
        img TEXT NOT NULL,
        pos VARCHAR(50) DEFAULT 'center 20%',
        description TEXT,
        images JSONB DEFAULT '[]'::jsonb,
        colors JSONB DEFAULT '[]'::jsonb,
        sizes JSONB DEFAULT '[]'::jsonb,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Orders table for Paystack payments
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        reference VARCHAR(150) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50),
        delivery_address TEXT,
        items JSONB NOT NULL,
        amount_ngn NUMERIC NOT NULL,
        amount_usd NUMERIC NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        paystack_channel VARCHAR(50),
        paid_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Admin settings / auth table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ PostgreSQL tables ready: products, orders, admin_settings");
  } catch (err) {
    console.error("❌ Error initializing PostgreSQL tables:", err.message);
  } finally {
    client.release();
  }
}
