import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { pool, hasDbUrl } from "../db.js";

const router = express.Router();

// Configure multer for in-memory file handling
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max per photo
});

// Configure Cloudinary if credentials are provided
const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// In-memory fallback if PostgreSQL is not yet connected
let fallbackProducts = [
  {
    id: "not-average-tee",
    name: "Not Average Tee",
    cat: "Graphic Tee",
    priceNGN: 60000,
    priceUSD: 45,
    tag: "BESTSELLER",
    category: "bestseller",
    img: "https://i.imgur.com/m3hnO9M.jpeg",
    pos: "center 20%",
    description: "Boxy, heavyweight cotton tee with an embroidered red patch.",
    images: [
      { src: "https://i.imgur.com/m3hnO9M.jpeg", label: "Front Detail" },
      { src: "https://i.imgur.com/Y0yAOPh.jpeg", label: "Worn" },
    ],
    colors: [
      { name: "White", hex: "#f5f2ea" },
      { name: "Black", hex: "#161513" },
      { name: "Red", hex: "#8a2b23" },
      { name: "Yellow", hex: "#d9b23c" },
    ],
    sizes: ["S", "M", "L", "XL"],
    active: true,
  },
  {
    id: "steeze-tee",
    name: "Steeze. Tee",
    cat: "Back-Print Tee",
    priceNGN: 60000,
    priceUSD: 45,
    tag: "NEW",
    category: "latest",
    img: "https://i.imgur.com/YiEDcaS.jpeg",
    pos: "78% 22%",
    description: "The one that started it. Oversized black tee with a full back print.",
    images: [
      { src: "https://i.imgur.com/YiEDcaS.jpeg", label: "Back" },
      { src: "https://i.imgur.com/HNY9ASh.jpeg", label: "Back Detail" },
    ],
    colors: [
      { name: "White", hex: "#f5f2ea" },
      { name: "Black", hex: "#161513" },
      { name: "Red", hex: "#8a2b23" },
      { name: "Yellow", hex: "#d9b23c" },
    ],
    sizes: ["S", "M", "L", "XL"],
    active: true,
  },
  {
    id: "steeze-varsity-09",
    name: "Steeze Varsity 09",
    cat: "Long Sleeve",
    priceNGN: 60000,
    priceUSD: 45,
    tag: "LIMITED",
    category: "latest",
    img: "https://i.imgur.com/CPXLwr1.jpeg",
    pos: "center 15%",
    description: "Cropped, boxy long sleeve with a chenille-style 09 varsity patch.",
    images: [
      { src: "https://i.imgur.com/CPXLwr1.jpeg", label: "Front" },
      { src: "https://i.imgur.com/5f5I9SQ.jpeg", label: "Patch Detail" },
    ],
    colors: [
      { name: "White", hex: "#f5f2ea" },
      { name: "Black", hex: "#161513" },
      { name: "Red", hex: "#8a2b23" },
      { name: "Yellow", hex: "#d9b23c" },
    ],
    sizes: ["S", "M", "L", "XL"],
    active: true,
  }
];

// Helper: Upload a buffer to Cloudinary
async function uploadToCloudinary(fileBuffer, mimeType) {
  if (!hasCloudinary) {
    // If Cloudinary is not configured yet, convert buffer to data URL so it works immediately
    return `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "steezedrip_products" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
}

// GET /api/products - Fetch all active products
router.get("/", async (req, res) => {
  try {
    const includeInactive = req.query.admin === "true";

    if (hasDbUrl && pool) {
      const query = includeInactive
        ? "SELECT * FROM products ORDER BY created_at DESC"
        : "SELECT * FROM products WHERE active = TRUE ORDER BY created_at DESC";
      const result = await pool.query(query);

      // Transform rows to match frontend schema
      const products = result.rows.map((r) => ({
        id: r.id,
        name: r.name,
        cat: r.cat,
        priceNGN: Number(r.price_ngn),
        priceUSD: Number(r.price_usd),
        priceN: `₦${Number(r.price_ngn).toLocaleString("en-NG")}`,
        priceD: `$${Number(r.price_usd).toLocaleString("en-US")}`,
        tag: r.tag,
        category: r.category,
        img: r.img,
        pos: r.pos || "center 20%",
        desc: r.description,
        images: Array.isArray(r.images) ? r.images : [],
        colors: Array.isArray(r.colors) ? r.colors : [],
        sizes: Array.isArray(r.sizes) ? r.sizes : [],
        active: r.active,
      }));

      return res.json({ success: true, count: products.length, products });
    }

    // Fallback in-memory
    const items = (includeInactive
      ? fallbackProducts
      : fallbackProducts.filter((p) => p.active !== false)
    ).map((p) => ({
      ...p,
      priceN: p.priceN || `₦${Number(p.priceNGN || 60000).toLocaleString("en-NG")}`,
      priceD: p.priceD || `$${Number(p.priceUSD || 45).toLocaleString("en-US")}`,
    }));

    return res.json({ success: true, count: items.length, products: items });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/products - Create a new product drop (Admin)
router.post(
  "/",
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "extraImages", maxCount: 4 },
  ]),
  async (req, res) => {
    try {
      const {
        name,
        cat,
        priceNGN,
        priceUSD,
        tag,
        category,
        desc,
        colors,
        sizes,
        mainImageUrl,
      } = req.body;

      if (!name || !priceNGN) {
        return res
          .status(400)
          .json({ success: false, error: "Product name and priceNGN are required." });
      }

      // Generate slug-like ID
      const slugId = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") + "-" + Date.now().toString().slice(-4);

      // Handle main image
      let finalMainImg = mainImageUrl || "";
      if (req.files && req.files.mainImage && req.files.mainImage[0]) {
        finalMainImg = await uploadToCloudinary(
          req.files.mainImage[0].buffer,
          req.files.mainImage[0].mimetype
        );
      }

      // Handle extra gallery images
      const galleryImages = [];
      if (finalMainImg) {
        galleryImages.push({ src: finalMainImg, label: "Front" });
      }

      if (req.files && req.files.extraImages) {
        for (let i = 0; i < req.files.extraImages.length; i++) {
          const file = req.files.extraImages[i];
          const uploadedUrl = await uploadToCloudinary(file.buffer, file.mimetype);
          galleryImages.push({
            src: uploadedUrl,
            label: i === 0 ? "Back" : `Detail ${i + 1}`,
          });
        }
      }

      // Parse colors and sizes
      const parsedColors = typeof colors === "string" ? JSON.parse(colors) : colors || [];
      const parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes || ["S", "M", "L", "XL"];

      const newProduct = {
        id: slugId,
        name: name.trim(),
        cat: (cat || "Apparel").trim(),
        priceNGN: Number(priceNGN) || 60000,
        priceUSD: Number(priceUSD) || 45,
        tag: tag || "NEW",
        category: category || "latest",
        img: finalMainImg || "https://i.imgur.com/m3hnO9M.jpeg",
        pos: "center 20%",
        desc: desc || "",
        images: galleryImages,
        colors: parsedColors,
        sizes: parsedSizes,
        active: true,
      };

      if (hasDbUrl && pool) {
        await pool.query(
          `INSERT INTO products (id, name, cat, price_ngn, price_usd, tag, category, img, pos, description, images, colors, sizes, active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            newProduct.id,
            newProduct.name,
            newProduct.cat,
            newProduct.priceNGN,
            newProduct.priceUSD,
            newProduct.tag,
            newProduct.category,
            newProduct.img,
            newProduct.pos,
            newProduct.desc,
            JSON.stringify(newProduct.images),
            JSON.stringify(newProduct.colors),
            JSON.stringify(newProduct.sizes),
            newProduct.active,
          ]
        );
      } else {
        fallbackProducts.unshift(newProduct);
      }

      console.log(`✨ New drop created: ${newProduct.name} (${newProduct.id})`);
      res.status(201).json({ success: true, product: newProduct });
    } catch (err) {
      console.error("Error creating product:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// PATCH /api/products/:id/toggle - Toggle active status
router.patch("/:id/toggle", async (req, res) => {
  const { id } = req.params;
  try {
    if (hasDbUrl && pool) {
      const check = await pool.query("SELECT active FROM products WHERE id = $1", [id]);
      if (check.rowCount === 0) {
        return res.status(404).json({ success: false, error: "Product not found" });
      }
      const newStatus = !check.rows[0].active;
      await pool.query("UPDATE products SET active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [
        newStatus,
        id,
      ]);
      return res.json({ success: true, id, active: newStatus });
    }

    const item = fallbackProducts.find((p) => p.id === id);
    if (!item) return res.status(404).json({ success: false, error: "Product not found" });
    item.active = !item.active;
    return res.json({ success: true, id, active: item.active });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/products/:id - Delete a drop
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    if (hasDbUrl && pool) {
      const result = await pool.query("DELETE FROM products WHERE id = $1 RETURNING id", [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, error: "Product not found" });
      }
      return res.json({ success: true, message: `Product ${id} deleted` });
    }

    fallbackProducts = fallbackProducts.filter((p) => p.id !== id);
    return res.json({ success: true, message: `Product ${id} deleted` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
