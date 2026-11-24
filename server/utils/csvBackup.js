import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to products-template.csv and backup CSV in workspace root
const WORKSPACE_ROOT = path.resolve(__dirname, "../../");
const TEMPLATE_CSV_PATH = path.join(WORKSPACE_ROOT, "products-template.csv");
const BACKUP_CSV_PATH = path.join(WORKSPACE_ROOT, "products-backup.csv");

/**
 * Escape CSV fields according to RFC 4180
 */
export function escapeCsvField(val) {
  if (val === undefined || val === null) return "";
  const str = String(val);
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const CSV_HEADERS = [
  "name",
  "category",
  "filter",
  "badge",
  "price_ngn",
  "price_usd",
  "description",
  "colors",
  "sizes",
  "image_url",
  "image_label",
  "image2_url",
  "image2_label",
  "image3_url",
  "image3_label",
  "image4_url",
  "image4_label",
  "active",
];

/**
 * Convert an array of products to CSV text
 */
export function generateProductsCsv(products) {
  const rows = [CSV_HEADERS.join(",")];

  for (const p of products) {
    const colorsList = Array.isArray(p.colors)
      ? p.colors
          .map((c) => (typeof c === "string" ? c : c?.name || ""))
          .filter(Boolean)
          .join(",")
      : "";

    const sizesList = Array.isArray(p.sizes) ? p.sizes.join(",") : "";

    const images = Array.isArray(p.images) ? [...p.images] : [];
    if (images.length === 0 && p.img) {
      images.push({ src: p.img, label: "Front" });
    }

    const row = [
      escapeCsvField(p.name || ""),
      escapeCsvField(p.cat || "Graphic Tee"),
      escapeCsvField(p.category || "latest"),
      escapeCsvField(p.tag || ""),
      escapeCsvField(p.priceNGN || p.price_ngn || 60000),
      escapeCsvField(p.priceUSD || p.price_usd || 45),
      escapeCsvField(p.desc || p.description || ""),
      escapeCsvField(colorsList),
      escapeCsvField(sizesList),
      escapeCsvField(images[0]?.src || p.img || ""),
      escapeCsvField(images[0]?.label || "Front"),
      escapeCsvField(images[1]?.src || ""),
      escapeCsvField(images[1]?.label || (images[1]?.src ? "Back" : "")),
      escapeCsvField(images[2]?.src || ""),
      escapeCsvField(images[2]?.label || (images[2]?.src ? "Side Angle" : "")),
      escapeCsvField(images[3]?.src || ""),
      escapeCsvField(images[3]?.label || (images[3]?.src ? "Detail Shot" : "")),
      escapeCsvField(p.active !== false ? "TRUE" : "FALSE"),
    ];

    rows.push(row.join(","));
  }

  return rows.join("\r\n") + "\r\n";
}

/**
 * Save products to products-template.csv and products-backup.csv
 */
export function backupProductsToCsv(products) {
  try {
    const csvContent = generateProductsCsv(products);
    fs.writeFileSync(TEMPLATE_CSV_PATH, csvContent, "utf8");
    fs.writeFileSync(BACKUP_CSV_PATH, csvContent, "utf8");
    console.log(`💾 Successfully backed up ${products.length} products to sheet CSV files.`);
    return { success: true, count: products.length, path: TEMPLATE_CSV_PATH };
  } catch (err) {
    console.error("❌ Failed to backup products to CSV:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Optional: Sync to Google Sheets Webhook (if GOOGLE_SHEET_WEBHOOK_URL is configured)
 */
export async function syncToGoogleSheetWebhook(productOrList, action = "upsert") {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        timestamp: new Date().toISOString(),
        data: productOrList,
      }),
    });
    console.log(`📡 Google Sheet Webhook notified: HTTP ${response.status}`);
  } catch (err) {
    console.warn("⚠️ Google Sheet Webhook notice:", err.message);
  }
}
