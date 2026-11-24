import fs from "fs";
import { generateProductsCsv, backupProductsToCsv } from "./utils/csvBackup.js";

async function run() {
  console.log("Fetching live products from backend...");
  let products = [];
  try {
    const res = await fetch("https://steezedrip.onrender.com/api/products?admin=true");
    const data = await res.json();
    if (data.products && data.products.length > 0) {
      products = data.products;
    }
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }

  if (products.length === 0) {
    if (fs.existsSync("./scratch_products.json")) {
      products = JSON.parse(fs.readFileSync("./scratch_products.json", "utf8"));
    }
  }

  // Also include "Not Average Tee" if not already present
  const hasNotAverage = products.some((p) => p.name.toLowerCase().includes("not average tee"));
  if (!hasNotAverage) {
    products.push({
      id: "not-average-tee",
      name: "Not Average Tee",
      cat: "Graphic Tee",
      category: "bestseller",
      tag: "BESTSELLER",
      priceNGN: 60000,
      priceUSD: 45,
      desc: "Boxy, heavyweight cotton tee with an embroidered red patch that says exactly what it means.",
      colors: [
        { name: "White", hex: "#f5f2ea" },
        { name: "Black", hex: "#161513" },
        { name: "Red", hex: "#8a2b23" },
        { name: "Yellow", hex: "#d9b23c" }
      ],
      sizes: ["S", "M", "L", "XL"],
      img: "https://i.imgur.com/YiEDcaS.jpeg",
      images: [
        { src: "https://i.imgur.com/YiEDcaS.jpeg", label: "Front" }
      ],
      active: true
    });
  }

  console.log(`Writing ${products.length} products to products-template.csv and products-backup.csv...`);
  const result = backupProductsToCsv(products);
  console.log("Result:", result);
}

run();
