import React, { useEffect, useRef, useState, useCallback } from "react";
import Papa from "papaparse";
import HERO_IMG from "./assets/hero.webp";
import DETAIL_IMG from "./assets/detail.webp";
import VARSITY_IMG from "./assets/varsity.webp";
import NOT_AVERAGE_WORN_IMG from "./assets/not_average_worn.webp";
import STEEZE_BACK_DETAIL_IMG from "./assets/steeze_back_detail.webp";
import VARSITY_PATCH_DETAIL_IMG from "./assets/varsity_patch_detail.webp";

/* ------------------------------------------------------------------
   STEEZEDRIP — brand site, v3
   Frontend-only. Products load from a public Google Sheet (published
   as CSV) so new drops can be added from a phone, no code required.
   Checkout is WhatsApp / bank transfer — no payment gateway backend.
   ------------------------------------------------------------------ */

const WHATSAPP_NUMBER = "2348110092995"; // SteezeDrip WhatsApp Business number
const waLink = (msg) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

// TODO: paste your Google Sheet's "Publish to web" CSV link here.
// See README.md → "Managing products" for exact steps.
// Until this is set, the site just shows the 3 launch products below.
const SHEET_CSV_URL = "";

const DEFAULT_SIZES = ["S", "M", "L", "XL"];
const DEFAULT_COLOR_NAMES = ["White", "Black", "Red", "Yellow"];

// Type any of these color names in the sheet and it'll get the right
// swatch automatically. Unrecognized names still work, just with a
// neutral grey swatch.
const COLOR_HEX_MAP = {
  white: "#f5f2ea",
  black: "#161513",
  red: "#8a2b23",
  yellow: "#d9b23c",
  blue: "#2c4a7c",
  navy: "#1b2436",
  green: "#2f5c3d",
  grey: "#7d7a72",
  gray: "#7d7a72",
  cream: "#e9e1cd",
  brown: "#5b4330",
  pink: "#c98a9a",
  purple: "#5a3d6b",
  orange: "#c96a2e",
  beige: "#d8c8a8",
  olive: "#5c5a34",
  maroon: "#5c1f27",
  charcoal: "#3d3b36",
};

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseListField(value, fallback) {
  if (!value || !String(value).trim()) return fallback;
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function colorsFromNames(names) {
  return names.map((name) => ({
    name,
    hex: COLOR_HEX_MAP[name.toLowerCase()] || "#9a958a",
  }));
}

function isActiveValue(value) {
  if (value === undefined || value === null || String(value).trim() === "") return true;
  const v = String(value).trim().toLowerCase();
  return !(v === "false" || v === "no" || v === "0");
}

// Turns one row of the Google Sheet into a product object the rest of
// the site already knows how to render.
function rowToProduct(row, index) {
  const name = (row.name || "").trim();
  if (!name) return null;

  const priceNGN = Number(String(row.price_ngn || "0").replace(/[^0-9.]/g, "")) || 0;
  const priceUSD = Number(String(row.price_usd || "0").replace(/[^0-9.]/g, "")) || 0;
  const colorNames = parseListField(row.colors, DEFAULT_COLOR_NAMES);
  const sizes = parseListField(row.sizes, DEFAULT_SIZES);

  const images = [];
  if (row.image_url && row.image_url.trim()) {
    images.push({ src: row.image_url.trim(), pos: "center", label: (row.image_label || "Front").trim() });
  }
  if (row.image2_url && row.image2_url.trim()) {
    images.push({ src: row.image2_url.trim(), pos: "center", label: (row.image2_label || "Detail").trim() });
  }
  if (!images.length) images.push({ src: "", pos: "center", label: name });

  return {
    id: `${slugify(name)}-${index}`,
    name,
    cat: (row.category || "").trim(),
    category: (row.filter || "").trim().toLowerCase(),
    tag: (row.badge || "").trim() || null,
    priceNGN,
    priceUSD,
    desc: (row.description || "").trim(),
    img: images[0].src,
    pos: images[0].pos,
    images,
    colors: colorsFromNames(colorNames),
    sizes,
    active: isActiveValue(row.active),
  };
}

const NAV_LINKS = [
  { label: "The Drop", href: "#collection" },
  { label: "Our Steeze", href: "#story" },
  { label: "Lookbook", href: "#lookbook" },
  { label: "WhatsApp", href: "#contact" },
];

const STATS = [
  { k: "EST.", v: "2019" },
  { k: "ROUTE", v: "LAGOS → LDN → ATL" },
  { k: "PER DROP", v: "MAX 40 PIECES" },
  { k: "CHECKOUT", v: "DM ONLY" },
];

const FILTERS = [
  { key: "all", label: "Shop All" },
  { key: "latest", label: "Latest Collection" },
  { key: "bestseller", label: "Best Sellers" },
];

const ALL_COLORS = [
  { name: "White", hex: "#f5f2ea" },
  { name: "Black", hex: "#161513" },
  { name: "Red", hex: "#8a2b23" },
  { name: "Yellow", hex: "#d9b23c" },
];

const FALLBACK_PRODUCTS = [
  {
    id: "not-average-tee",
    name: "Not Average Tee",
    cat: "Graphic Tee",
    priceNGN: 45000,
    priceUSD: 35,
    priceN: "₦45,000",
    priceD: "$35",
    tag: "BESTSELLER",
    category: "bestseller",
    img: DETAIL_IMG,
    pos: "center 20%",
    desc: "Boxy, heavyweight cotton tee with an embroidered red patch that says exactly what it means. Relaxed drop shoulders, ribbed collar, made to be lived in.",
    images: [
      { src: DETAIL_IMG, pos: "center 20%", label: "Front Detail" },
      { src: NOT_AVERAGE_WORN_IMG, pos: "center 12%", label: "Worn" },
    ],
    colors: ALL_COLORS,
    sizes: DEFAULT_SIZES,
    active: true,
  },
  {
    id: "steeze-tee",
    name: "Steeze. Tee",
    cat: "Back-Print Tee",
    priceNGN: 52000,
    priceUSD: 40,
    priceN: "₦52,000",
    priceD: "$40",
    tag: "NEW",
    category: "latest",
    img: HERO_IMG,
    pos: "78% 22%",
    desc: "The one that started it. Oversized black tee with a full back print — a \u201cChampions\u201d motif, three running figures, and the line that sums up the whole label. Front stays clean; the story's on the back.",
    images: [
      { src: HERO_IMG, pos: "78% 22%", label: "Back" },
      { src: STEEZE_BACK_DETAIL_IMG, pos: "center 10%", label: "Back Detail" },
    ],
    colors: ALL_COLORS,
    sizes: DEFAULT_SIZES,
    active: true,
  },
  {
    id: "steeze-varsity-09",
    name: "Steeze Varsity 09",
    cat: "Long Sleeve",
    priceNGN: 68000,
    priceUSD: 52,
    priceN: "₦68,000",
    priceD: "$52",
    tag: "LIMITED",
    category: "latest",
    img: VARSITY_IMG,
    pos: "center 15%",
    desc: "Cropped, boxy long sleeve with a chenille-style \u201809\u2019 varsity patch on the chest. Heavyweight jersey, ribbed cuffs, built to sit right over flared denim.",
    images: [
      { src: VARSITY_IMG, pos: "center 15%", label: "Front" },
      { src: VARSITY_PATCH_DETAIL_IMG, pos: "center 30%", label: "Patch Detail" },
    ],
    colors: ALL_COLORS,
    sizes: DEFAULT_SIZES,
    active: true,
  },
];

const formatNGN = (n) => `₦${n.toLocaleString("en-NG")}`;
const formatUSD = (n) => `$${n.toLocaleString("en-US")}`;

const LOOKBOOK = [
  { title: "Not Average × Steeze.", note: "THE DUO", img: HERO_IMG, pos: "center 15%", productName: "Steeze. Tee" },
  { title: "Not Average", note: "DETAIL", img: DETAIL_IMG, pos: "center 20%", productName: "Not Average Tee" },
  { title: "Steeze Varsity", note: "STYLE 09", img: VARSITY_IMG, pos: "center 12%", productName: "Steeze Varsity 09" },
];



/* ---------- small helpers ---------- */

function Letters({ text }) {
  return (
    <>
      {text.split("").map((ch, i) => (
        <span
          className="letter"
          key={i}
          style={{ animationDelay: `${(i % 9) * 0.35 + 0.2}s` }}
        >
          {ch}
        </span>
      ))}
    </>
  );
}

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Reveal({ as: Tag = "div", className = "", children, ...rest }) {
  const ref = useReveal();
  return (
    <Tag ref={ref} className={`reveal ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

function TiltCard({ children, className = "", strength = 8 }) {
  const ref = useRef(null);

  const onMove = useCallback(
    (e) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(1000px) rotateY(${px * strength}deg) rotateX(${-py * strength}deg) translateZ(4px)`;
      el.style.setProperty("--sx", `${(px + 0.5) * 100}%`);
      el.style.setProperty("--sy", `${(py + 0.5) * 100}%`);
    },
    [strength]
  );

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)";
  }, []);

  return (
    <div
      ref={ref}
      className={`tilt-card ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  );
}

/* ---------- product modal ---------- */

function ProductModal({ product, onClose, onAddToCart }) {
  const gallery = product.images && product.images.length ? product.images : [{ src: product.img, pos: product.pos, label: product.name }];
  const sizes = product.sizes && product.sizes.length ? product.sizes : DEFAULT_SIZES;
  const [activeImg, setActiveImg] = useState(0);
  const [size, setSize] = useState(sizes[Math.min(1, sizes.length - 1)]);
  const [color, setColor] = useState(product.colors[0].name);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleAdd = () => {
    onAddToCart(product, size, color, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="overlay-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pm-card">
        <button className="pm-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="pm-image">
          <img src={gallery[activeImg].src} alt={`${product.name} — ${gallery[activeImg].label}`} style={{ objectPosition: gallery[activeImg].pos }} />
          {product.tag && <span className="card-tag">{product.tag}</span>}
          {gallery.length > 1 && (
            <div className="pm-thumbs">
              {gallery.map((g, i) => (
                <button
                  key={g.label}
                  className={`pm-thumb ${activeImg === i ? "active" : ""}`}
                  onClick={() => setActiveImg(i)}
                >
                  <img src={g.src} alt={g.label} style={{ objectPosition: g.pos }} />
                  <span>{g.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="pm-details">
          <span className="product-cat">{product.cat}</span>
          <h3 className="pm-name">{product.name}</h3>
          <div className="price-row" style={{ marginTop: 4 }}>
            <span className="primary">{formatNGN(product.priceNGN)}</span>
            <span className="secondary">{formatUSD(product.priceUSD)}</span>
          </div>
          <p className="pm-desc">{product.desc}</p>

          <div className="pm-field">
            <span className="pm-label">Size</span>
            <div className="pm-options">
              {sizes.map((s) => (
                <button
                  key={s}
                  className={`pm-chip ${size === s ? "active" : ""}`}
                  onClick={() => setSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="pm-field">
            <span className="pm-label">Color — {color}</span>
            <div className="pm-options">
              {product.colors.map((c) => (
                <button
                  key={c.name}
                  className={`pm-swatch ${color === c.name ? "active" : ""}`}
                  style={{ background: c.hex }}
                  onClick={() => setColor(c.name)}
                  aria-label={c.name}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div className="pm-field">
            <span className="pm-label">Quantity</span>
            <div className="qty-stepper">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity">+</button>
            </div>
          </div>

          <div className="pm-actions">
            <button className="btn btn-gold" onClick={handleAdd}>
              {added ? "Added ✓" : "Add To Cart"}
            </button>
            <a
              className="btn btn-wa"
              href={waLink(`Hi SteezeDrip, I'd like to enquire about the ${product.name} — size ${size}, ${color}.`)}
              target="_blank" rel="noopener noreferrer"
            >
              Enquire On WhatsApp
            </a>
          </div>
          <p className="pm-note">Orders are confirmed by DM — add to bag, then check out via WhatsApp.</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- cart drawer ---------- */

function CartDrawer({ cart, onClose, onUpdateQty, onRemove, onCheckout }) {
  const subtotalNGN = cart.reduce((s, i) => s + i.priceNGN * i.qty, 0);
  const subtotalUSD = cart.reduce((s, i) => s + i.priceUSD * i.qty, 0);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="overlay-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer">
        <div className="drawer-head">
          <h3>Your Bag {cart.length > 0 ? `(${cart.reduce((s, i) => s + i.qty, 0)})` : ""}</h3>
          <button className="pm-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {cart.length === 0 ? (
          <div className="drawer-empty">
            <p>Your bag is empty — add a piece from the drop.</p>
          </div>
        ) : (
          <div className="drawer-items">
            {cart.map((item) => (
              <div className="cart-line" key={item.id}>
                <div className="cart-thumb">
                  <img src={item.img} alt={item.name} style={{ objectPosition: item.pos }} />
                </div>
                <div className="cart-info">
                  <span className="cart-name">{item.name}</span>
                  <span className="cart-meta">{item.size} · {item.color}</span>
                  <div className="qty-stepper small">
                    <button onClick={() => onUpdateQty(item.id, -1)} aria-label="Decrease quantity">−</button>
                    <span>{item.qty}</span>
                    <button onClick={() => onUpdateQty(item.id, 1)} aria-label="Increase quantity">+</button>
                  </div>
                </div>
                <div className="cart-right">
                  <span className="cart-price">{formatNGN(item.priceNGN * item.qty)}</span>
                  <button className="cart-remove" onClick={() => onRemove(item.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {cart.length > 0 && (
          <div className="drawer-foot">
            <div className="drawer-subtotal">
              <span>Subtotal</span>
              <span>{formatNGN(subtotalNGN)} <span className="secondary">({formatUSD(subtotalUSD)})</span></span>
            </div>
            <button className="btn btn-gold" style={{ width: "100%", justifyContent: "center" }} onClick={onCheckout}>
              Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- checkout modal ---------- */

function CheckoutModal({ cart, onClose, onBack }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const subtotalNGN = cart.reduce((s, i) => s + i.priceNGN * i.qty, 0);
  const subtotalUSD = cart.reduce((s, i) => s + i.priceUSD * i.qty, 0);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const buildMessage = () => {
    const lines = cart.map(
      (i) => `• ${i.name} — ${i.size}, ${i.color} × ${i.qty} — ${formatNGN(i.priceNGN * i.qty)}`
    );
    return [
      "Hi SteezeDrip 👋, I'd like to place an order:",
      "",
      ...lines,
      "",
      `Total: ${formatNGN(subtotalNGN)} (${formatUSD(subtotalUSD)})`,
      "",
      `Name: ${name || "-"}`,
      `Phone: ${phone || "-"}`,
      `Delivery address: ${address || "-"}`,
    ].join("\n");
  };

  const canSubmit = name.trim() && phone.trim();

  return (
    <div className="overlay-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pm-card checkout">
        <button className="pm-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="pm-details" style={{ width: "100%" }}>
          <span className="eyebrow">Checkout</span>
          <h3 className="pm-name">Confirm Your Order</h3>

          <div className="checkout-summary">
            {cart.map((i) => (
              <div className="checkout-row" key={i.id}>
                <span>{i.name} — {i.size}, {i.color} × {i.qty}</span>
                <span>{formatNGN(i.priceNGN * i.qty)}</span>
              </div>
            ))}
            <div className="checkout-row total">
              <span>Total</span>
              <span>{formatNGN(subtotalNGN)} <span className="secondary">({formatUSD(subtotalUSD)})</span></span>
            </div>
          </div>

          <div className="pm-field">
            <span className="pm-label">Your Details</span>
            <input className="ck-input" placeholder="Full name *" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="ck-input" placeholder="Phone / WhatsApp number *" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <textarea className="ck-input" placeholder="Delivery address (optional)" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="pm-actions">
            <a
              className="btn btn-wa"
              style={{ width: "100%", justifyContent: "center", opacity: canSubmit ? 1 : 0.5, pointerEvents: canSubmit ? "auto" : "none" }}
              href={waLink(buildMessage())}
              target="_blank" rel="noopener noreferrer"
              onClick={onClose}
            >
              Send Order On WhatsApp
            </a>
            <button className="btn btn-outline" style={{ width: "100%", justifyContent: "center" }} onClick={onBack}>
              Back To Bag
            </button>
          </div>
          <p className="pm-note">
            Fill in your name and phone, then tap the button — your order
            goes straight to our WhatsApp. We'll confirm and arrange
            payment details with you directly. 🔒
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- main ---------- */

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState("light"); // "light" first, switchable to "dark"
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);

  // Pull products from the Google Sheet (if one's been configured). Falls
  // back to FALLBACK_PRODUCTS silently if the sheet isn't set up yet, or
  // the fetch fails for any reason — the site never shows a broken page.
  useEffect(() => {
    if (!SHEET_CSV_URL || !SHEET_CSV_URL.trim()) return;
    fetch(SHEET_CSV_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
        return res.text();
      })
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const parsed = results.data
              .map((row, i) => rowToProduct(row, i))
              .filter(Boolean)
              .filter((p) => p.active);
            if (parsed.length) setProducts(parsed);
          },
        });
      })
      .catch((err) => {
        console.error("Could not load products from Google Sheet, showing fallback products.", err);
      });
  }, []);

  const heroRef = useRef(null);
  const frontCardRef = useRef(null);
  const midCardRef = useRef(null);
  const backCardRef = useRef(null);

  const openProduct = (nameOrProduct) => {
    const product =
      typeof nameOrProduct === "string"
        ? products.find((p) => p.name === nameOrProduct)
        : nameOrProduct;
    if (product) setSelectedProduct(product);
  };

  const addToCart = (product, size, color, qty) => {
    setCart((prev) => {
      const id = `${product.id}__${size}__${color}`;
      const existing = prev.find((i) => i.id === id);
      if (existing) {
        return prev.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i));
      }
      return [
        ...prev,
        {
          id,
          productId: product.id,
          name: product.name,
          size,
          color,
          qty,
          priceNGN: product.priceNGN,
          priceUSD: product.priceUSD,
          img: product.img,
          pos: product.pos,
        },
      ];
    });
  };

  const updateCartQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const onHeroMove = useCallback((e) => {
    const el = heroRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--px", px.toFixed(3));
    el.style.setProperty("--py", py.toFixed(3));

    const front = frontCardRef.current;
    const mid = midCardRef.current;
    const back = backCardRef.current;
    if (front) front.style.transform = `rotate(-3deg) perspective(1000px) rotateY(${px * 10}deg) rotateX(${-py * 10}deg) translateZ(30px)`;
    if (mid) mid.style.transform = `rotate(-7deg) translate(${px * 14}px, ${py * 14}px)`;
    if (back) back.style.transform = `rotate(8deg) translate(${-px * 18}px, ${-py * 18}px)`;
  }, []);

  const onHeroLeave = useCallback(() => {
    const front = frontCardRef.current;
    const mid = midCardRef.current;
    const back = backCardRef.current;
    if (front) front.style.transform = "rotate(-3deg) perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)";
    if (mid) mid.style.transform = "rotate(-7deg) translate(0px,0px)";
    if (back) back.style.transform = "rotate(8deg) translate(0px,0px)";
  }, []);

  useEffect(() => {
    const anyOverlayOpen = menuOpen || selectedProduct || cartOpen || checkoutOpen;
    document.body.style.overflow = anyOverlayOpen ? "hidden" : "";
  }, [menuOpen, selectedProduct, cartOpen, checkoutOpen]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <div className="sd-root" data-theme={theme}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800;900&family=Cormorant+Garamond:ital,wght@0,400;1,400;1,500&family=Work+Sans:wght@400;500;600;700&display=swap');

        .sd-root[data-theme="light"]{
          --bg:#faf8f3;
          --bg-soft:#f1ece1;
          --panel:#ffffff;
          --text:#17140f;
          --text-dim:#6b6558;
          --gold:#a1721f;
          --gold-soft:#7d5814;
          --gold-glow: rgba(161,114,31,0.14);
          --rust:#8a3b2b;
          --line: rgba(23,20,15,0.14);
          --nav-fade: rgba(250,248,243,0.9), rgba(250,248,243,0);
          --shadow: 0 18px 40px rgba(23,20,15,0.10);
        }
        .sd-root[data-theme="dark"]{
          --bg:#0b0b0d;
          --bg-soft:#141311;
          --panel:#1a1815;
          --text:#ece6d8;
          --text-dim:#b0a894;
          --gold:#c9a24b;
          --gold-soft:#e8cf94;
          --gold-glow: rgba(201,162,75,0.16);
          --rust:#c9846f;
          --line: rgba(236,230,216,0.14);
          --nav-fade: rgba(11,11,13,0.9), rgba(11,11,13,0);
          --shadow: 0 18px 40px rgba(0,0,0,0.45);
        }

        *{box-sizing:border-box;}
        html,body{margin:0;padding:0;}

        .sd-root{
          background:var(--bg);
          color:var(--text);
          font-family:'Work Sans', sans-serif;
          min-height:100vh;
          overflow-x:hidden;
          position:relative;
          transition:background 0.4s ease, color 0.4s ease;
        }

        .sd-root button{font-family:inherit;}
        a{color:inherit; text-decoration:none;}

        .display{
          font-family:'Big Shoulders Display', sans-serif;
          text-transform:uppercase;
          letter-spacing:0.01em;
        }
        .serif-italic{
          font-family:'Cormorant Garamond', serif;
          font-style:italic;
          font-weight:400;
        }
        .eyebrow{
          font-family:'Work Sans', sans-serif;
          font-size:12px;
          letter-spacing:0.28em;
          text-transform:uppercase;
          color:var(--gold);
          font-weight:600;
        }

        /* ---------- reveal on scroll ---------- */
        .reveal{
          opacity:0;
          transform:translateY(28px);
          transition:opacity 0.9s ease, transform 0.9s ease;
        }
        .reveal.in-view{opacity:1; transform:translateY(0);}

        /* ---------- nav ---------- */
        .nav{
          position:fixed; top:0; left:0; right:0; z-index:60;
          display:flex; align-items:center; justify-content:space-between;
          padding:22px clamp(20px,5vw,64px);
          background:linear-gradient(to bottom, var(--nav-fade));
          backdrop-filter:blur(3px);
        }
        .wordmark{
          font-family:'Big Shoulders Display', sans-serif;
          font-weight:800;
          font-size:22px;
          letter-spacing:0.04em;
          text-transform:uppercase;
          color:var(--text);
        }
        .wordmark span{color:var(--gold);}
        .nav-links{
          display:flex; gap:30px; align-items:center;
        }
        .nav-links a{
          font-size:12px; letter-spacing:0.18em; text-transform:uppercase;
          font-weight:600; color:var(--text-dim);
          position:relative; padding-bottom:4px;
        }
        .nav-links a:hover{color:var(--text);}
        .nav-links a::after{
          content:''; position:absolute; left:0; bottom:0; height:1px; width:0;
          background:var(--gold); transition:width 0.3s ease;
        }
        .nav-links a:hover::after{width:100%;}
        .nav-cta{
          border:1px solid var(--gold); color:var(--gold) !important;
          padding:9px 18px; border-radius:2px; font-weight:700;
        }
        .nav-cta:hover{background:var(--gold); color:var(--bg) !important;}

        /* theme toggle */
        .theme-toggle{
          display:flex; align-items:center; gap:8px;
          border:1px solid var(--line); border-radius:20px; padding:4px;
          background:var(--panel); cursor:pointer;
        }
        .theme-toggle .track{
          position:relative; width:44px; height:22px; border-radius:20px;
          background:var(--bg-soft); border:1px solid var(--line);
        }
        .theme-toggle .knob{
          position:absolute; top:1px; left:1px; width:18px; height:18px; border-radius:50%;
          background:var(--gold); transition:transform 0.3s ease;
          display:flex; align-items:center; justify-content:center; font-size:10px;
        }
        .sd-root[data-theme="dark"] .theme-toggle .knob{transform:translateX(20px);}
        .theme-toggle .icons{display:flex; gap:6px; font-size:11px; letter-spacing:0.1em; color:var(--text-dim); padding:0 6px;}

        .burger{display:none; flex-direction:column; gap:5px; background:none; border:none; cursor:pointer; z-index:70;}
        .nav-right-mobile{display:none; align-items:center; gap:14px;}

        .burger span{width:26px; height:2px; background:var(--text); display:block;}

        .mobile-panel{
          position:fixed; inset:0; background:var(--bg); z-index:65;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:26px; transform:translateY(-100%); transition:transform 0.45s ease;
        }
        .mobile-panel.open{transform:translateY(0);}
        .mobile-panel a{font-family:'Big Shoulders Display'; font-size:32px; text-transform:uppercase; letter-spacing:0.03em; color:var(--text);}

        /* ---------- hero ---------- */
        .hero{
          position:relative; min-height:100vh; display:flex; align-items:center;
          padding:120px clamp(20px,6vw,80px) 60px;
          overflow:hidden;
        }
        .hero-bg{
          position:absolute; inset:-10%; z-index:0; pointer-events:none;
          background:
            radial-gradient(600px 400px at calc(20% + var(--px,0)*40px) calc(30% + var(--py,0)*40px), var(--gold-glow), transparent 60%),
            var(--bg);
          transition:background 0.2s ease-out;
        }
        .hero-grid{
          position:relative; z-index:2; max-width:1280px; margin:0 auto; width:100%;
          display:grid; grid-template-columns:1.1fr 0.9fr; gap:56px; align-items:center;
        }
        .eyebrow-row{display:flex; align-items:center; gap:14px; margin-bottom:18px;}
        .eyebrow-row .rule{width:40px; height:1px; background:var(--gold);}

        .drip-heading{
          display:flex; flex-wrap:wrap;
          font-size:clamp(46px, 8vw, 108px);
          line-height:0.92; font-weight:900; margin:0; color:var(--text);
        }
        .drip-heading .letter{position:relative; display:inline-block;}
        .drip-heading .letter::after{
          content:''; position:absolute; left:50%; bottom:-6px;
          width:5px; height:5px; border-radius:0 50% 50% 50%;
          background:linear-gradient(160deg, var(--gold-soft), var(--gold) 60%, var(--rust));
          transform:translateX(-50%) rotate(45deg);
          opacity:0;
          animation:drip 5s ease-in infinite;
        }
        @keyframes drip{
          0%{opacity:0; bottom:-2px; height:5px; width:5px;}
          8%{opacity:1;}
          55%{bottom:-42px; height:15px; width:7px; opacity:0.95;}
          85%{opacity:0.3;}
          100%{bottom:-62px; opacity:0; height:17px; width:7px;}
        }

        .tagline{
          font-size:clamp(18px,2.4vw,26px); margin:20px 0 30px; max-width:520px; color:var(--text-dim);
        }
        .tagline em{color:var(--gold-soft); font-style:italic;}

        .hero-ctas{display:flex; flex-wrap:wrap; gap:16px;}
        .btn{
          display:inline-flex; align-items:center; gap:10px;
          padding:15px 28px; font-size:13px; font-weight:700;
          letter-spacing:0.14em; text-transform:uppercase;
          border-radius:2px; cursor:pointer; border:1px solid transparent;
          transition:transform 0.25s ease, background 0.25s ease, border-color 0.25s ease, color .25s ease;
        }
        .btn:hover{transform:translateY(-2px);}
        .btn-gold{background:var(--gold); color:var(--bg);}
        .btn-gold:hover{background:var(--gold-soft);}
        .btn-outline{border-color:var(--line); color:var(--text);}
        .btn-outline:hover{border-color:var(--gold); color:var(--gold-soft);}
        .btn-wa{border-color:#3fae5c; color:#2f8a49;}
        .sd-root[data-theme="dark"] .btn-wa{color:#8fe0a4;}
        .btn-wa:hover{background:#1f3b26; color:#c9f2d1 !important; border-color:#1f3b26;}

        /* hero photo */
        .hero-photo-wrap{
          position:relative; perspective:1400px;
          width:100%; max-width:440px; aspect-ratio: 1 / 1.18; margin:0 auto;
        }
        .stack-card{
          position:absolute; border-radius:6px; overflow:hidden; box-shadow:var(--shadow);
          border:1px solid var(--line); transition:transform 0.2s ease-out;
          background:var(--bg-soft);
        }
        .stack-card img{width:100%; height:100%; object-fit:cover; display:block;}
        .stack-card.back{ top:0; right:0; width:56%; height:46%; transform:rotate(8deg); z-index:1; }
        .stack-card.mid{ bottom:0; left:0; width:52%; height:44%; transform:rotate(-7deg); z-index:2; }
        .stack-card.front{ top:13%; left:11%; width:78%; height:80%; transform:rotate(-3deg); z-index:3; }
        .stack-card .card-cap{
          position:absolute; left:0; right:0; bottom:0; padding:9px 12px;
          background:linear-gradient(to top, rgba(0,0,0,0.65), transparent);
          font-size:10px; letter-spacing:0.14em; text-transform:uppercase; color:#f0e9d8;
        }
        .hero-tag{
          position:absolute; right:-14px; bottom:2%; z-index:4;
          width:88px; height:88px; perspective:800px;
        }
        .hero-tag-inner{
          width:100%; height:100%; position:relative; transform-style:preserve-3d;
          animation:spin3d 13s linear infinite;
        }
        @keyframes spin3d{ from{transform:rotateY(0deg) rotateX(10deg);} to{transform:rotateY(360deg) rotateX(10deg);} }
        .face{
          position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
          border:1px solid var(--gold); border-radius:4px;
          background:var(--panel);
          font-family:'Big Shoulders Display'; font-weight:800; font-size:15px; color:var(--gold-soft);
          letter-spacing:0.04em; box-shadow:var(--shadow);
          text-align:center; line-height:1.2;
        }
        .face.front{transform:translateZ(48px);}
        .face.back{transform:rotateY(180deg) translateZ(48px);}
        .face.right{transform:rotateY(90deg) translateZ(48px);}
        .face.left{transform:rotateY(-90deg) translateZ(48px);}

        .scroll-cue{
          position:absolute; bottom:20px; left:clamp(20px,6vw,80px);
          font-size:11px; letter-spacing:0.24em; color:var(--text-dim);
          display:flex; align-items:center; gap:10px; z-index:2;
        }
        .scroll-cue .stick{width:34px; height:1px; background:linear-gradient(90deg, var(--gold), transparent); animation:pulse-stick 2.2s ease-in-out infinite;}
        @keyframes pulse-stick{0%,100%{opacity:0.3;}50%{opacity:1;}}

        /* ---------- marquee ---------- */
        .marquee{
          border-top:1px solid var(--line); border-bottom:1px solid var(--line);
          overflow:hidden; white-space:nowrap; padding:16px 0; background:var(--bg-soft);
          position:relative; z-index:3;
        }
        .marquee-track{display:inline-block; animation:scroll-left 26s linear infinite;}
        .marquee-track span{
          font-family:'Big Shoulders Display'; font-size:18px; letter-spacing:0.08em;
          text-transform:uppercase; margin:0 22px; color:var(--text-dim);
        }
        .marquee-track span.gold{color:var(--gold);}
        @keyframes scroll-left{ from{transform:translateX(0);} to{transform:translateX(-50%);} }

        /* ---------- section shell ---------- */
        section.block{padding:min(12vw,110px) clamp(20px,6vw,80px);}
        .section-head{max-width:720px; margin-bottom:56px;}
        .section-title{font-size:clamp(32px,5vw,58px); font-weight:800; margin:12px 0 0; line-height:1; color:var(--text);}

        .filter-tabs{display:flex; gap:10px; flex-wrap:wrap; margin-bottom:36px;}
        .filter-tab{
          border:1px solid var(--line); background:var(--panel); color:var(--text-dim);
          padding:10px 18px; border-radius:30px; font-size:12px; font-weight:600;
          letter-spacing:0.08em; text-transform:uppercase; cursor:pointer; transition:all 0.2s ease;
        }
        .filter-tab.active{background:var(--gold); border-color:var(--gold); color:var(--bg);}
        .filter-tab:not(.active):hover{border-color:var(--gold); color:var(--text);}
        .empty-note{grid-column:1/-1; color:var(--text-dim); font-size:14px; padding:20px 0;}

        /* ---------- story ---------- */
        .story-grid{
          display:grid; grid-template-columns:1.3fr 0.9fr; gap:64px; align-items:start;
        }
        .story-quote{
          font-family:'Cormorant Garamond', serif; font-style:italic;
          font-size:clamp(22px,2.8vw,32px); line-height:1.4; color:var(--text);
        }
        .story-quote span{color:var(--gold-soft);}
        .story-copy{margin-top:26px; color:var(--text-dim); font-size:16px; line-height:1.8; max-width:560px;}
        .stat-list{display:flex; flex-direction:column; gap:0; border-top:1px solid var(--line);}
        .stat-row{
          display:flex; justify-content:space-between; padding:20px 0; border-bottom:1px solid var(--line);
        }
        .stat-row .k{font-size:11px; letter-spacing:0.2em; color:var(--text-dim);}
        .stat-row .v{font-family:'Big Shoulders Display'; font-weight:700; font-size:16px; letter-spacing:0.03em; color:var(--gold-soft); text-align:right;}

        /* ---------- collection ---------- */
        .collection-grid{
          display:grid; grid-template-columns:repeat(auto-fit, minmax(270px,1fr)); gap:26px;
        }
        .tilt-card{
          transition:transform 0.15s ease-out; transform-style:preserve-3d;
        }
        .product-card{
          border:1px solid var(--line); background:var(--panel);
          padding:16px; border-radius:4px; height:100%;
          display:flex; flex-direction:column; gap:14px;
          box-shadow:var(--shadow);
        }
        .swatch{
          height:320px; border-radius:3px; position:relative; overflow:hidden;
          background:var(--bg-soft);
        }
        .swatch img{width:100%; height:100%; object-fit:cover; display:block; transition:transform 0.5s ease;}
        .product-card:hover .swatch img{transform:scale(1.04);}
        .swatch::after{
          content:''; position:absolute; inset:0;
          background:radial-gradient(220px 160px at var(--sx,50%) var(--sy,50%), rgba(255,255,255,0.10), transparent 60%);
          pointer-events:none;
        }
        .card-tag{
          position:absolute; top:12px; left:12px; font-size:10px; letter-spacing:0.16em;
          background:var(--bg); color:var(--gold-soft); padding:5px 9px; border:1px solid var(--gold);
          z-index:2; font-weight:700; border-radius:2px;
        }
        .product-cat{font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:var(--text-dim);}
        .product-name{font-family:'Big Shoulders Display'; font-size:25px; font-weight:700; margin:2px 0 0; color:var(--text);}
        .price-row{display:flex; justify-content:space-between; align-items:baseline; margin-top:auto;}
        .price-row .primary{font-weight:700; color:var(--gold-soft);}
        .price-row .secondary{color:var(--text-dim); font-size:13px;}
        .enquire-btn{
          margin-top:6px; width:100%; justify-content:center; padding:12px; font-size:11px;
        }
        .product-card{cursor:pointer;}
        .swatch-view{
          position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
          background:rgba(0,0,0,0.38); color:#fff; font-size:12px; letter-spacing:0.16em;
          text-transform:uppercase; font-weight:600; opacity:0; transition:opacity 0.25s ease;
          pointer-events:none;
        }
        .product-card:hover .swatch-view{opacity:1;}
        .look-frame{cursor:pointer;}

        /* ---------- cart button ---------- */
        .cart-btn{
          position:relative; background:none; border:none; cursor:pointer; color:var(--text);
          display:flex; align-items:center; justify-content:center; padding:4px;
        }
        .cart-badge{
          position:absolute; top:-6px; right:-8px; background:var(--gold); color:var(--bg);
          font-size:10px; font-weight:700; border-radius:50%; width:17px; height:17px;
          display:flex; align-items:center; justify-content:center;
        }
        .nav-right-mobile .cart-btn{color:var(--text);}

        /* ---------- overlays: product modal / cart drawer / checkout ---------- */
        .overlay-scrim{
          position:fixed; inset:0; z-index:120; background:rgba(10,9,7,0.55);
          display:flex; align-items:center; justify-content:center; padding:20px;
          backdrop-filter:blur(2px);
        }
        .pm-close{
          position:absolute; top:14px; right:14px; z-index:2; background:var(--panel);
          border:1px solid var(--line); border-radius:50%; width:34px; height:34px;
          color:var(--text); cursor:pointer; font-size:14px;
        }
        .pm-card{
          position:relative; background:var(--panel); border-radius:6px; box-shadow:var(--shadow);
          max-width:860px; width:100%; max-height:90vh; overflow-y:auto;
          display:flex; gap:0;
        }
        .pm-card.checkout{max-width:520px;}
        .pm-image{position:relative; flex:0 0 46%; min-height:320px; background:var(--bg-soft);}
        .pm-image img{width:100%; height:100%; object-fit:cover; display:block; position:absolute; inset:0;}
        .pm-thumbs{
          position:absolute; left:12px; bottom:12px; z-index:2; display:flex; gap:8px;
        }
        .pm-thumb{
          width:52px; height:64px; border-radius:3px; overflow:hidden; position:relative;
          border:2px solid rgba(255,255,255,0.5); cursor:pointer; padding:0; background:none;
        }
        .pm-thumb.active{border-color:var(--gold);}
        .pm-thumb img{width:100%; height:100%; object-fit:cover; display:block; position:static;}
        .pm-thumb span{
          position:absolute; left:0; right:0; bottom:0; font-size:8px; letter-spacing:0.04em;
          background:rgba(0,0,0,0.55); color:#fff; padding:2px 3px; text-align:center;
        }
        .pm-details{flex:1; padding:32px; display:flex; flex-direction:column; gap:4px;}
        .pm-name{font-family:'Big Shoulders Display'; font-size:32px; font-weight:800; margin:2px 0 0; color:var(--text);}
        .pm-desc{color:var(--text-dim); font-size:14.5px; line-height:1.7; margin:14px 0 6px; max-width:480px;}
        .pm-field{margin-top:16px; display:flex; flex-direction:column; gap:8px;}
        .pm-label{font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--text-dim); font-weight:600;}
        .pm-options{display:flex; gap:8px; flex-wrap:wrap;}
        .pm-chip{
          border:1px solid var(--line); background:var(--bg); color:var(--text);
          padding:8px 14px; font-size:12px; font-weight:600; border-radius:2px; cursor:pointer;
        }
        .pm-chip.active{border-color:var(--gold); background:var(--gold); color:var(--bg);}
        .pm-swatch{
          width:26px; height:26px; border-radius:50%; border:2px solid var(--line); cursor:pointer;
        }
        .pm-swatch.active{border-color:var(--gold); box-shadow:0 0 0 2px var(--gold-glow);}
        .qty-stepper{
          display:inline-flex; align-items:center; gap:0; border:1px solid var(--line); border-radius:2px; width:fit-content;
        }
        .qty-stepper button{
          background:none; border:none; width:34px; height:34px; font-size:16px; cursor:pointer; color:var(--text);
        }
        .qty-stepper span{width:30px; text-align:center; font-weight:600; font-size:14px;}
        .qty-stepper.small button{width:26px; height:26px; font-size:13px;}
        .qty-stepper.small span{width:22px; font-size:12px;}
        .pm-actions{display:flex; flex-direction:column; gap:10px; margin-top:20px;}
        .pm-actions .btn{width:100%; justify-content:center;}
        .pm-note{font-size:12px; color:var(--text-dim); margin-top:12px;}
        .pm-error{font-size:13px; color:var(--rust); margin-top:14px; margin-bottom:0;}
        .pm-actions .btn:disabled{opacity:0.55; cursor:not-allowed; transform:none;}

        /* ---------- cart drawer ---------- */
        .drawer{
          position:fixed; top:0; right:0; bottom:0; width:min(420px, 100vw);
          background:var(--panel); box-shadow:var(--shadow); display:flex; flex-direction:column;
          padding:24px; z-index:2;
        }
        .drawer-head{display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;}
        .drawer-head h3{font-family:'Big Shoulders Display'; font-size:22px; margin:0; color:var(--text);}
        .drawer-empty{flex:1; display:flex; align-items:center; justify-content:center; color:var(--text-dim); text-align:center; padding:40px 20px;}
        .drawer-items{flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:16px; margin-top:14px;}
        .cart-line{display:flex; gap:12px; border-bottom:1px solid var(--line); padding-bottom:14px;}
        .cart-thumb{width:64px; height:74px; border-radius:3px; overflow:hidden; flex:0 0 auto; background:var(--bg-soft);}
        .cart-thumb img{width:100%; height:100%; object-fit:cover; display:block;}
        .cart-info{flex:1; display:flex; flex-direction:column; gap:6px;}
        .cart-name{font-weight:700; font-size:14px; color:var(--text);}
        .cart-meta{font-size:12px; color:var(--text-dim); letter-spacing:0.04em;}
        .cart-right{display:flex; flex-direction:column; align-items:flex-end; justify-content:space-between;}
        .cart-price{font-weight:700; color:var(--gold-soft); font-size:13px;}
        .cart-remove{background:none; border:none; color:var(--text-dim); font-size:11px; text-decoration:underline; cursor:pointer; padding:0;}
        .drawer-foot{border-top:1px solid var(--line); padding-top:16px; margin-top:12px; display:flex; flex-direction:column; gap:14px;}
        .drawer-subtotal{display:flex; justify-content:space-between; font-weight:700; color:var(--text); font-size:15px;}
        .drawer-subtotal .secondary{color:var(--text-dim); font-weight:500; font-size:13px;}

        /* ---------- checkout ---------- */
        .checkout-summary{border-top:1px solid var(--line); border-bottom:1px solid var(--line); padding:14px 0; margin-top:10px; display:flex; flex-direction:column; gap:8px;}
        .checkout-row{display:flex; justify-content:space-between; font-size:13px; color:var(--text-dim);}
        .checkout-row.total{font-weight:700; color:var(--text); font-size:15px; padding-top:8px; border-top:1px dashed var(--line);}
        .checkout-row .secondary{color:var(--text-dim); font-weight:500;}
        .ck-input{
          width:100%; padding:11px 12px; border:1px solid var(--line); border-radius:2px;
          background:var(--bg); color:var(--text); font-family:inherit; font-size:13px; margin-bottom:8px;
        }
        .pay-option{display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text); cursor:pointer;}
        .bank-details{
          border:1px solid var(--line); border-radius:3px; padding:12px 14px; margin-top:6px;
          background:var(--bg-soft); font-size:13px; display:flex; flex-direction:column; gap:6px;
        }
        .bank-details > div{display:flex; justify-content:space-between; color:var(--text);}
        .bank-details p{margin:4px 0 0; color:var(--text-dim); font-size:12px;}

        @media (max-width: 720px){
          .pm-card{flex-direction:column; max-height:92vh;}
          .pm-image{flex:0 0 260px;}
        }


        .lookbook-scroll{
          display:flex; gap:20px; overflow-x:auto; padding-bottom:18px; scroll-snap-type:x mandatory;
        }
        .lookbook-scroll::-webkit-scrollbar{height:6px;}
        .lookbook-scroll::-webkit-scrollbar-thumb{background:var(--line);}
        .look-frame{
          flex:0 0 300px; height:400px; border-radius:3px; position:relative;
          scroll-snap-align:start; overflow:hidden; border:1px solid var(--line);
          transform:perspective(900px) rotateY(0deg);
          transition:transform 0.5s ease; box-shadow:var(--shadow);
        }
        .look-frame:hover{transform:perspective(900px) rotateY(-5deg) scale(1.015);}
        .look-frame img{width:100%; height:100%; object-fit:cover; display:block;}
        .look-frame .info{
          position:absolute; left:0; right:0; bottom:0; padding:16px;
          background:linear-gradient(to top, rgba(0,0,0,0.72), transparent);
        }
        .look-frame .info .title{font-family:'Big Shoulders Display'; font-size:19px; text-transform:uppercase; color:#f4efe4;}
        .look-frame .info .note{font-size:11px; letter-spacing:0.18em; color:#e8cf94;}

        /* ---------- contact ---------- */
        .contact-wrap{
          border:1px solid var(--line); background:var(--panel);
          padding:clamp(30px,6vw,70px); border-radius:5px;
          display:flex; flex-wrap:wrap; gap:40px; justify-content:space-between; align-items:center;
          box-shadow:var(--shadow);
        }
        .contact-left{max-width:560px;}
        .contact-number{
          font-family:'Big Shoulders Display'; font-size:clamp(24px,3.6vw,36px); letter-spacing:0.02em; color:var(--gold-soft); margin:14px 0;
        }
        .contact-note{color:var(--text-dim); font-size:14px; margin-top:10px;}

        /* ---------- footer ---------- */
        footer{
          border-top:1px solid var(--line); padding:50px clamp(20px,6vw,80px) 34px;
          display:flex; flex-wrap:wrap; justify-content:space-between; gap:30px;
        }
        .footer-tag{color:var(--text-dim); font-size:14px; max-width:320px; margin-top:10px;}
        .footer-links{display:flex; gap:28px; flex-wrap:wrap;}
        .footer-links a{font-size:12px; letter-spacing:0.16em; text-transform:uppercase; color:var(--text-dim);}
        .footer-links a:hover{color:var(--gold-soft);}
        .footer-bottom{width:100%; margin-top:34px; padding-top:20px; border-top:1px solid var(--line);
          display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px;
          font-size:11px; letter-spacing:0.08em; color:var(--text-dim);
        }

        /* ---------- floating whatsapp ---------- */
        .wa-fab{
          position:fixed; right:22px; bottom:22px; z-index:80;
          display:flex; align-items:center; gap:10px;
          background:#1f7a3d; color:#eafff0; border-radius:40px;
          padding:14px; box-shadow:0 8px 24px rgba(0,0,0,0.35);
          border:1px solid rgba(255,255,255,0.15);
        }
        .wa-fab .ring{
          position:absolute; inset:0; border-radius:40px; border:2px solid #3fae5c;
          animation:ring-pulse 2.4s ease-out infinite;
        }
        @keyframes ring-pulse{
          0%{transform:scale(1); opacity:0.7;}
          100%{transform:scale(1.5); opacity:0;}
        }
        .wa-fab .label{font-size:12px; font-weight:700; letter-spacing:0.06em; padding-right:6px; display:none;}

        @media (prefers-reduced-motion: reduce){
          .drip-heading .letter::after, .marquee-track, .hero-tag-inner, .wa-fab .ring, .scroll-cue .stick{
            animation:none !important;
          }
          .reveal{transition:none; opacity:1; transform:none;}
        }

        /* ---------- responsive ---------- */
        @media (min-width: 900px){
          .wa-fab .label{display:inline;}
        }
        @media (max-width: 980px){
          .hero-grid{grid-template-columns:1fr;}
          .hero-photo-wrap{order:-1; max-width:420px; margin:0 auto;}
          .hero{padding-top:110px;}
        }
        @media (max-width: 899px){
          .nav-links{display:none;}
          .nav-right-mobile{display:flex;}
          .burger{display:flex;}
          .story-grid{grid-template-columns:1fr;}
        }
        @media (max-width: 560px){
          .contact-wrap{flex-direction:column; align-items:flex-start;}
          .hero-tag{display:none;}
        }
      `}</style>

      {/* ---------------- NAV ---------------- */}
      <nav className="nav">
        <a href="#top" className="wordmark">STEEZE<span>DRIP</span></a>
        <div className="nav-links">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href}>{l.label}</a>
          ))}
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle dark mode">
            <span className="icons">☀</span>
            <span className="track"><span className="knob" /></span>
            <span className="icons">☾</span>
          </button>
          <button className="cart-btn" onClick={() => setCartOpen(true)} aria-label="Open cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 7h15l-1.5 9.5a2 2 0 0 1-2 1.7H8.7a2 2 0 0 1-2-1.7L5 4H2" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="21" r="1.4" fill="currentColor"/>
              <circle cx="18" cy="21" r="1.4" fill="currentColor"/>
            </svg>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
          <a
            className="nav-cta"
            href={waLink("Hi SteezeDrip, I'd like to know more about the current drop.")}
            target="_blank" rel="noopener noreferrer"
          >
            Text Us
          </a>
        </div>
        <div className="nav-right-mobile">
          <button className="cart-btn" onClick={() => setCartOpen(true)} aria-label="Open cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 7h15l-1.5 9.5a2 2 0 0 1-2 1.7H8.7a2 2 0 0 1-2-1.7L5 4H2" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="21" r="1.4" fill="currentColor"/>
              <circle cx="18" cy="21" r="1.4" fill="currentColor"/>
            </svg>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
          <button className="burger" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <span/><span/><span/>
          </button>
        </div>
      </nav>

      <div className={`mobile-panel ${menuOpen ? "open" : ""}`}>
        <button
          className="burger" aria-label="Close menu"
          style={{ position: "absolute", top: 24, right: 24 }}
          onClick={() => setMenuOpen(false)}
        >
          <span style={{ transform: "rotate(45deg) translate(4px,4px)" }} />
          <span style={{ opacity: 0 }} />
          <span style={{ transform: "rotate(-45deg) translate(4px,-4px)" }} />
        </button>
        {NAV_LINKS.map((l) => (
          <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</a>
        ))}
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle dark mode">
          <span className="icons">☀</span>
          <span className="track"><span className="knob" /></span>
          <span className="icons">☾</span>
        </button>
        <a
          className="btn btn-wa"
          href={waLink("Hi SteezeDrip, I'd like to know more about the current drop.")}
          target="_blank" rel="noopener noreferrer"
        >
          Chat On WhatsApp
        </a>
      </div>

      {/* ---------------- HERO ---------------- */}
      <section id="top" className="hero" ref={heroRef} onMouseMove={onHeroMove} onMouseLeave={onHeroLeave}>
        <div className="hero-bg" />
        <div className="hero-grid">
          <div>
            <div className="eyebrow-row">
              <span className="rule" />
              <span className="eyebrow">Lagos-Rooted · World-Bound</span>
            </div>
            <h1 className="drip-heading">
              <Letters text="STEEZEDRIP" />
            </h1>
            <p className="tagline">
              <em>Steeze</em> is the swagger. <em>Drip</em> is the proof. Cut in small
              batches, worn by those who already know.
            </p>
            <div className="hero-ctas">
              <a href="#collection" className="btn btn-gold">Shop The Drop</a>
              <a
                className="btn btn-wa"
                href={waLink("Hi SteezeDrip, I'd like to talk about placing an order.")}
                target="_blank" rel="noopener noreferrer"
              >
                Chat On WhatsApp
              </a>
            </div>
          </div>

          <div className="hero-photo-wrap">
            <div className="stack-card back" ref={backCardRef}>
              <img src={VARSITY_IMG} alt="SteezeDrip Steeze Varsity 09 long sleeve" style={{ objectPosition: "center 12%" }} />
              <div className="card-cap">Varsity 09</div>
            </div>
            <div className="stack-card mid" ref={midCardRef}>
              <img src={DETAIL_IMG} alt="SteezeDrip Not Average tee patch detail" style={{ objectPosition: "center 20%" }} />
              <div className="card-cap">Not Average</div>
            </div>
            <div className="stack-card front" ref={frontCardRef}>
              <img src={HERO_IMG} alt="SteezeDrip Not Average and Steeze. tees, worn" style={{ objectPosition: "center 15%" }} />
              <div className="card-cap">Steeze. — Drop 04</div>
            </div>

            <div className="hero-tag">
              <div className="hero-tag-inner">
                <div className="face front">STEEZE.</div>
                <div className="face back">DROP 04</div>
                <div className="face right">SD</div>
                <div className="face left">SD</div>
              </div>
            </div>
          </div>
        </div>

        <div className="scroll-cue">
          <span className="stick" />
          <span>SCROLL</span>
        </div>
      </section>

      {/* ---------------- MARQUEE ---------------- */}
      <div className="marquee">
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, i) => (
            <React.Fragment key={i}>
              <span className="gold">HANDCUT IN SMALL BATCHES</span>
              <span>·</span>
              <span>NO RESTOCKS</span>
              <span>·</span>
              <span className="gold">DM TO COP</span>
              <span>·</span>
              <span>STYLE FOR THOSE WHO KNOW</span>
              <span>·</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ---------------- COLLECTION ---------------- */}
      <section id="collection" className="block">
        <Reveal className="section-head">
          <span className="eyebrow">Drop 04 — Steeze. Edit</span>
          <h2 className="section-title">This Season's Fits</h2>
        </Reveal>
        <Reveal className="filter-tabs">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`filter-tab ${activeFilter === f.key ? "active" : ""}`}
              onClick={() => setActiveFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </Reveal>
        <div className="collection-grid">
          {products.filter((item) => activeFilter === "all" || item.category === activeFilter).length === 0 && (
            <p className="empty-note">Nothing in this category yet — check back soon, or view Shop All.</p>
          )}
          {products.filter((item) => activeFilter === "all" || item.category === activeFilter).map((item) => (
            <Reveal key={item.id || item.name}>
              <TiltCard>
                <div className="product-card" onClick={() => openProduct(item)} role="button" tabIndex={0}>
                  <div className="swatch">
                    {item.tag && <span className="card-tag">{item.tag}</span>}
                    <img src={item.img} alt={item.name} style={{ objectPosition: item.pos }} />
                    <span className="swatch-view">View Details</span>
                  </div>
                  <span className="product-cat">{item.cat}</span>
                  <h3 className="product-name">{item.name}</h3>
                  <div className="price-row">
                    <span className="primary">{formatNGN(item.priceNGN)}</span>
                    <span className="secondary">{formatUSD(item.priceUSD)}</span>
                  </div>
                  <a
                    className="btn btn-outline enquire-btn"
                    href={waLink(`Hi SteezeDrip, I'd like to enquire about the ${item.name}.`)}
                    target="_blank" rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Enquire On WhatsApp
                  </a>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- PRODUCT / CART / CHECKOUT OVERLAYS ---------------- */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}
      {cartOpen && !checkoutOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => setCartOpen(false)}
          onUpdateQty={updateCartQty}
          onRemove={removeFromCart}
          onCheckout={() => setCheckoutOpen(true)}
        />
      )}
      {checkoutOpen && (
        <CheckoutModal
          cart={cart}
          onClose={() => { setCheckoutOpen(false); setCartOpen(false); }}
          onBack={() => setCheckoutOpen(false)}
        />
      )}

      {/* ---------------- STORY ---------------- */}
      <section id="story" className="block">
        <Reveal className="section-head">
          <span className="eyebrow">Our Steeze</span>
          <h2 className="section-title">Where It's From</h2>
        </Reveal>
        <div className="story-grid">
          <Reveal>
            <p className="story-quote">
              "This wasn't about becoming champions overnight — it was about
              rediscovering ourselves in the quiet corners, <span>purpose
              sharpened, strength returned, new confidence in bloom.</span>"
            </p>
            <p className="story-copy">
              SteezeDrip started on the streets of Lagos and grew into a
              small, deliberate label: heavyweight cottons, hand-finished
              patches, and prints that say something instead of just
              occupying space. Every drop is limited on purpose. Once it's
              gone, it's gone — that's the deal we make with the people who
              wear it.
            </p>
          </Reveal>
          <Reveal>
            <div className="stat-list">
              {STATS.map((s) => (
                <div className="stat-row" key={s.k}>
                  <span className="k">{s.k}</span>
                  <span className="v">{s.v}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- LOOKBOOK ---------------- */}
      <section id="lookbook" className="block">
        <Reveal className="section-head">
          <span className="eyebrow">Lookbook</span>
          <h2 className="section-title">Shot On The Drop</h2>
        </Reveal>
        <Reveal>
          <div className="lookbook-scroll">
            {LOOKBOOK.map((f) => (
              <div
                className="look-frame"
                key={f.title}
                onClick={() => openProduct(f.productName)}
                role="button" tabIndex={0}
              >
                <img src={f.img} alt={f.title} style={{ objectPosition: f.pos }} />
                <div className="info">
                  <div className="title">{f.title}</div>
                  <div className="note">{f.note}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ---------------- CONTACT ---------------- */}
      <section id="contact" className="block">
        <Reveal className="contact-wrap">
          <div className="contact-left">
            <span className="eyebrow">Talk Drip, Not Email</span>
            <h2 className="section-title" style={{ fontSize: "clamp(26px,3.6vw,40px)" }}>
              Slide Into Our DMs
            </h2>
            <p className="contact-note">
              Every order starts as a conversation on WhatsApp — no cart, no
              checkout, just steeze. Tell us the piece, your size, and where
              it's headed.
            </p>
            <div className="contact-number">+234 812 345 6789</div>
            <p className="contact-note">We reply within a few hours, Lagos time (WAT).</p>
          </div>
          <a
            className="btn btn-wa"
            style={{ padding: "18px 34px", fontSize: 14 }}
            href={waLink("Hi SteezeDrip, I'd like to talk about a custom order.")}
            target="_blank" rel="noopener noreferrer"
          >
            Message Us On WhatsApp
          </a>
        </Reveal>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer>
        <div>
          <a href="#top" className="wordmark">STEEZE<span>DRIP</span></a>
          <p className="footer-tag">
            Cut in Lagos. Worn everywhere. Small drops, no restocks, DM-only
            checkout.
          </p>
        </div>
        <div className="footer-links">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href}>{l.label}</a>
          ))}
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer">TikTok</a>
        </div>
        <div className="footer-bottom">
          <span>© 2026 SteezeDrip. All rights reserved.</span>
          <span>Lagos, Nigeria</span>
        </div>
      </footer>

      {/* ---------------- FLOATING WHATSAPP ---------------- */}
      <a
        className="wa-fab"
        href={waLink("Hi SteezeDrip, I'd like to know more about the current drop.")}
        target="_blank" rel="noopener noreferrer"
        aria-label="Chat with SteezeDrip on WhatsApp"
      >
        <span className="ring" />
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ position: "relative", zIndex: 1 }}>
          <path
            d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.33 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.87 9.87 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.14.82.84-3.06-.2-.31a8.24 8.24 0 0 1-1.26-4.4c0-4.55 3.71-8.26 8.27-8.26a8.2 8.2 0 0 1 5.85 2.42 8.2 8.2 0 0 1 2.42 5.85c0 4.56-3.71 8.27-8.28 8.27Zm4.53-6.2c-.25-.12-1.47-.73-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.53.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.84-.86 2.04 0 1.2.88 2.36 1 2.52.12.17 1.73 2.64 4.19 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.16-.48-.28Z"
            fill="#eafff0"
          />
        </svg>
        <span className="label">Chat with us</span>
      </a>
    </div>
  );
}
