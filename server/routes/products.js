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
    img: "https://i.imgur.com/YiEDcaS.jpeg",
    pos: "center 20%",
    description: "Boxy, heavyweight cotton tee with an embroidered red patch that says exactly what it means.",
    images: [
      { src: "https://i.imgur.com/YiEDcaS.jpeg", label: "Front Detail" },
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
    id: "2-fly",
    name: "2 FLY",
    cat: "Shirt",
    priceNGN: 60000,
    priceUSD: 45,
    tag: "NEW",
    category: "latest",
    img: "https://i.imgur.com/m3hnO9M.jpeg",
    pos: "center 20%",
    description: "LOVE GOD AND HAVE MONEY. Premium heavyweight tee with signature statement graphic cut.",
    images: [
      { src: "https://i.imgur.com/m3hnO9M.jpeg", label: "FRONT" },
      { src: "https://i.imgur.com/Y0yAOPh.jpeg", label: "BACK" },
    ],
    colors: [
      { name: "Black", hex: "#161513" },
      { name: "White", hex: "#f5f2ea" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    active: true,
  },
  {
    id: "god-s-plan",
    name: "GOD'S PLAN",
    cat: "Shirt",
    priceNGN: 60000,
    priceUSD: 45,
    tag: "NEW",
    category: "latest",
    img: "https://i.imgur.com/YiEDcaS.jpeg",
    pos: "center 20%",
    description: "I'M PART OF GOD'S PLAN. Heavyweight streetwear cut with front statement and back scripture typography.",
    images: [
      { src: "https://i.imgur.com/YiEDcaS.jpeg", label: "FRONT" },
      { src: "https://i.imgur.com/HNY9ASh.jpeg", label: "BACK" },
    ],
    colors: [
      { name: "Black", hex: "#161513" },
      { name: "White", hex: "#f5f2ea" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    active: true,
  },
  {
    id: "no-rules",
    name: "NO RULES",
    cat: "Shirt",
    priceNGN: 60000,
    priceUSD: 45,
    tag: "NEW",
    category: "latest",
    img: "https://i.imgur.com/CPXLwr1.jpeg",
    pos: "center 20%",
    description: "NO RULES JUST STEEZE. Street-grade silhouette, bold monochrome graphic statement.",
    images: [
      { src: "https://i.imgur.com/CPXLwr1.jpeg", label: "FRONT" },
      { src: "https://i.imgur.com/5f5I9SQ.jpeg", label: "BACK" },
    ],
    colors: [
      { name: "Black", hex: "#161513" },
      { name: "White", hex: "#f5f2ea" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    active: true,
  },
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
    { name: "extraImages", maxCount: 10 },
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
        extraImageUrls,
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
      let finalMainImg = mainImageUrl ? mainImageUrl.trim() : "";
      if (req.files && req.files.mainImage && req.files.mainImage[0]) {
        finalMainImg = await uploadToCloudinary(
          req.files.mainImage[0].buffer,
          req.files.mainImage[0].mimetype
        );
      }

      // Handle gallery images
      const galleryImages = [];
      if (finalMainImg) {
        galleryImages.push({ src: finalMainImg, label: "Front" });
      }

      // Upload extra image files
      if (req.files && req.files.extraImages) {
        const slotLabels = ["Back", "Side Angle", "Detail Shot", "On-Body", "Detail 2"];
        for (let i = 0; i < req.files.extraImages.length; i++) {
          const file = req.files.extraImages[i];
          const uploadedUrl = await uploadToCloudinary(file.buffer, file.mimetype);
          galleryImages.push({
            src: uploadedUrl,
            label: slotLabels[i] || `View ${galleryImages.length + 1}`,
          });
        }
      }

      // Parse extra image URLs if provided
      if (extraImageUrls) {
        const parsedUrls = typeof extraImageUrls === "string" ? JSON.parse(extraImageUrls) : extraImageUrls;
        if (Array.isArray(parsedUrls)) {
          const slotLabels = ["Back", "Side Angle", "Detail Shot", "On-Body", "Detail 2"];
          parsedUrls.forEach((url, i) => {
            if (url && typeof url === "string" && url.trim()) {
              galleryImages.push({
                src: url.trim(),
                label: slotLabels[i] || `View ${galleryImages.length + 1}`,
              });
            } else if (url && url.src) {
              galleryImages.push(url);
            }
          });
        }
      }

      // Enforce at least 4 photos requirement
      if (galleryImages.length < 4) {
        return res.status(400).json({
          success: false,
          error: `At least 4 photos are required per product drop (Front, Back, Angle, Detail). You provided ${galleryImages.length}.`,
        });
      }

      // If finalMainImg wasn't set yet, pick the first gallery image
      if (!finalMainImg && galleryImages.length > 0) {
        finalMainImg = galleryImages[0].src;
      }

      // Parse colors and sizes
      const parsedColors = typeof colors === "string" ? JSON.parse(colors) : colors || [];
      const parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes || ["S", "M", "L", "XL"];

      const newProduct = {
        id: slugId,
        name: name.trim(),
        cat: (cat || "Graphic Tee").trim(),
        priceNGN: Number(priceNGN) || 60000,
        priceUSD: Number(priceUSD) || 45,
        priceN: `₦${Number(priceNGN || 60000).toLocaleString("en-NG")}`,
        priceD: `$${Number(priceUSD || 45).toLocaleString("en-US")}`,
        tag: tag || "NEW",
        category: category || "latest",
        img: finalMainImg,
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

      console.log(`✨ New drop created: ${newProduct.name} (${newProduct.id}) with ${galleryImages.length} photos`);
      res.status(201).json({ success: true, product: newProduct });
    } catch (err) {
      console.error("Error creating product:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// PUT /api/products/:id - Update an existing product drop (Admin)
router.put(
  "/:id",
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "extraImages", maxCount: 10 },
  ]),
  async (req, res) => {
    const { id } = req.params;
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
        active,
        pos,
        existingImages,
        mainImageUrl,
        extraImageUrls,
      } = req.body;

      // Find existing product first
      let currentProduct = null;
      if (hasDbUrl && pool) {
        const queryRes = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
        if (queryRes.rowCount === 0) {
          return res.status(404).json({ success: false, error: "Product not found" });
        }
        const r = queryRes.rows[0];
        currentProduct = {
          id: r.id,
          name: r.name,
          cat: r.cat,
          priceNGN: Number(r.price_ngn),
          priceUSD: Number(r.price_usd),
          tag: r.tag,
          category: r.category,
          img: r.img,
          pos: r.pos,
          desc: r.description,
          images: Array.isArray(r.images) ? r.images : [],
          colors: Array.isArray(r.colors) ? r.colors : [],
          sizes: Array.isArray(r.sizes) ? r.sizes : [],
          active: r.active,
        };
      } else {
        currentProduct = fallbackProducts.find((p) => p.id === id);
        if (!currentProduct) {
          return res.status(404).json({ success: false, error: "Product not found" });
        }
      }

      // Build updated gallery from existingImages
      let gallery = [];
      if (existingImages) {
        const parsed = typeof existingImages === "string" ? JSON.parse(existingImages) : existingImages;
        if (Array.isArray(parsed)) {
          gallery = parsed.filter((item) => item && (item.src || typeof item === "string")).map((item) => {
            if (typeof item === "string") return { src: item, label: "View" };
            return item;
          });
        }
      } else if (currentProduct.images && currentProduct.images.length > 0) {
        gallery = [...currentProduct.images];
      }

      // Handle mainImage replacement if uploaded
      if (req.files && req.files.mainImage && req.files.mainImage[0]) {
        const uploadedUrl = await uploadToCloudinary(
          req.files.mainImage[0].buffer,
          req.files.mainImage[0].mimetype
        );
        if (gallery.length > 0) {
          gallery[0] = { ...gallery[0], src: uploadedUrl };
        } else {
          gallery.push({ src: uploadedUrl, label: "Front" });
        }
      } else if (mainImageUrl && mainImageUrl.trim()) {
        if (gallery.length > 0) {
          gallery[0] = { ...gallery[0], src: mainImageUrl.trim() };
        } else {
          gallery.push({ src: mainImageUrl.trim(), label: "Front" });
        }
      }

      // Handle newly uploaded extra images
      if (req.files && req.files.extraImages) {
        for (let i = 0; i < req.files.extraImages.length; i++) {
          const file = req.files.extraImages[i];
          const uploadedUrl = await uploadToCloudinary(file.buffer, file.mimetype);
          gallery.push({
            src: uploadedUrl,
            label: gallery.length === 1 ? "Back" : `Detail ${gallery.length}`,
          });
        }
      }

      // Handle extra URLs
      if (extraImageUrls) {
        const parsedUrls = typeof extraImageUrls === "string" ? JSON.parse(extraImageUrls) : extraImageUrls;
        if (Array.isArray(parsedUrls)) {
          parsedUrls.forEach((u) => {
            if (u && typeof u === "string" && u.trim()) {
              gallery.push({
                src: u.trim(),
                label: gallery.length === 1 ? "Back" : `Detail ${gallery.length}`,
              });
            } else if (u && u.src) {
              gallery.push(u);
            }
          });
        }
      }

      // Fallback if gallery is empty
      if (gallery.length === 0 && currentProduct.img) {
        gallery.push({ src: currentProduct.img, label: "Front" });
      }

      const finalMainImg = gallery.length > 0 ? gallery[0].src : currentProduct.img;

      // Parse colors and sizes
      const parsedColors = colors !== undefined
        ? (typeof colors === "string" ? JSON.parse(colors) : colors)
        : currentProduct.colors;
      const parsedSizes = sizes !== undefined
        ? (typeof sizes === "string" ? JSON.parse(sizes) : sizes)
        : currentProduct.sizes;

      const newPriceNGN = priceNGN !== undefined ? Number(priceNGN) : currentProduct.priceNGN;
      const newPriceUSD = priceUSD !== undefined ? Number(priceUSD) : currentProduct.priceUSD;

      const updatedProduct = {
        id,
        name: name !== undefined ? name.trim() : currentProduct.name,
        cat: cat !== undefined ? cat.trim() : currentProduct.cat,
        priceNGN: newPriceNGN,
        priceUSD: newPriceUSD,
        priceN: `₦${Number(newPriceNGN).toLocaleString("en-NG")}`,
        priceD: `$${Number(newPriceUSD).toLocaleString("en-US")}`,
        tag: tag !== undefined ? tag : currentProduct.tag,
        category: category !== undefined ? category : currentProduct.category,
        img: finalMainImg,
        pos: pos !== undefined ? pos : (currentProduct.pos || "center 20%"),
        desc: desc !== undefined ? desc : currentProduct.desc,
        images: gallery,
        colors: parsedColors || [],
        sizes: parsedSizes || [],
        active: active !== undefined ? (active === true || active === "true") : currentProduct.active,
      };

      if (hasDbUrl && pool) {
        await pool.query(
          `UPDATE products
           SET name = $1, cat = $2, price_ngn = $3, price_usd = $4, tag = $5,
               category = $6, img = $7, pos = $8, description = $9,
               images = $10, colors = $11, sizes = $12, active = $13,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $14`,
          [
            updatedProduct.name,
            updatedProduct.cat,
            updatedProduct.priceNGN,
            updatedProduct.priceUSD,
            updatedProduct.tag,
            updatedProduct.category,
            updatedProduct.img,
            updatedProduct.pos,
            updatedProduct.desc,
            JSON.stringify(updatedProduct.images),
            JSON.stringify(updatedProduct.colors),
            JSON.stringify(updatedProduct.sizes),
            updatedProduct.active,
            id,
          ]
        );
      } else {
        const idx = fallbackProducts.findIndex((p) => p.id === id);
        if (idx !== -1) {
          fallbackProducts[idx] = { ...fallbackProducts[idx], ...updatedProduct };
        }
      }

      console.log(`✏️ Product updated: ${updatedProduct.name} (${id})`);
      res.json({ success: true, product: updatedProduct });
    } catch (err) {
      console.error("Error updating product:", err);
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
