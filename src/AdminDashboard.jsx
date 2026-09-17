import React, { useState, useEffect } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://steezedrip.onrender.com";

const PRESET_COLORS = [
  { name: "Black", hex: "#161513" },
  { name: "White", hex: "#f5f2ea" },
  { name: "Red", hex: "#8a2b23" },
  { name: "Yellow", hex: "#d9b23c" },
  { name: "Navy", hex: "#0a192f" },
  { name: "Green", hex: "#2d5a27" },
  { name: "Beige", hex: "#d4c5b9" },
  { name: "Brown", hex: "#5c4033" },
  { name: "Grey", hex: "#808080" },
];

const PRESET_SIZES = ["S", "M", "L", "XL", "XXL"];

const INITIAL_PHOTO_SLOTS = [
  { id: "slot-1", label: "Cover / Front View", file: null, preview: "", url: "", mode: "file", required: true },
  { id: "slot-2", label: "Back View", file: null, preview: "", url: "", mode: "file", required: true },
  { id: "slot-3", label: "Side / Angle View", file: null, preview: "", url: "", mode: "file", required: true },
  { id: "slot-4", label: "Detail / Fabric Shot", file: null, preview: "", url: "", mode: "file", required: true },
];

export default function AdminDashboard({ onClose, onProductCreated, onCatalogUpdated }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(sessionStorage.getItem("steeze_admin_token"));
  });
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState("upload"); // "upload" | "manage" | "orders" | "settings"

  // Drop Uploader Form State
  const [name, setName] = useState("");
  const [cat, setCat] = useState("Graphic Tee");
  const [priceNGN, setPriceNGN] = useState("60000");
  const [priceUSD, setPriceUSD] = useState("45");
  const [tag, setTag] = useState("NEW");
  const [category, setCategory] = useState("latest");
  const [desc, setDesc] = useState("");
  const [selectedSizes, setSelectedSizes] = useState(["S", "M", "L", "XL"]);
  const [selectedColors, setSelectedColors] = useState([
    { name: "Black", hex: "#161513" },
    { name: "White", hex: "#f5f2ea" },
  ]);

  // Multi-slot Photo State (Minimum 4 photos enforced)
  const [photoSlots, setPhotoSlots] = useState(INITIAL_PHOTO_SLOTS);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Manage Catalog State
  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogFeedback, setCatalogFeedback] = useState(null);

  // Edit Product State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCat, setEditCat] = useState("");
  const [editPriceNGN, setEditPriceNGN] = useState("");
  const [editPriceUSD, setEditPriceUSD] = useState("");
  const [editTag, setEditTag] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editSizes, setEditSizes] = useState([]);
  const [editColors, setEditColors] = useState([]);
  const [editGallery, setEditGallery] = useState([]);
  const [editNewMode, setEditNewMode] = useState("file");
  const [editNewFile, setEditNewFile] = useState(null);
  const [editNewUrl, setEditNewUrl] = useState("");
  const [editNewPreview, setEditNewPreview] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editFeedback, setEditFeedback] = useState(null);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // System Health
  const [systemHealth, setSystemHealth] = useState(null);

  // Check login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem("steeze_admin_token", data.token || "admin_logged_in");
        setIsAuthenticated(true);
      } else {
        setAuthError(data.error || "Incorrect password");
      }
    } catch (err) {
      // Fallback local verification if server is unreachable
      if (passwordInput === "steezedrip2025") {
        sessionStorage.setItem("steeze_admin_token", "local_admin_token");
        setIsAuthenticated(true);
      } else {
        setAuthError("Could not reach backend or wrong password.");
      }
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("steeze_admin_token");
    setIsAuthenticated(false);
  };

  // Fetch products for Catalog tab
  const loadCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/products?admin=true`);
      const data = await res.json();
      if (data.success) {
        setCatalog(data.products || []);
      }
    } catch (err) {
      console.warn("Failed to load catalog:", err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  // Fetch orders for Orders tab
  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/payments/orders`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.warn("Failed to load orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Check system health
  const checkHealth = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/health`);
      const data = await res.json();
      setSystemHealth(data);
    } catch (err) {
      setSystemHealth({ error: "Backend not reachable on " + BACKEND_URL });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === "manage") loadCatalog();
      if (activeTab === "orders") loadOrders();
      if (activeTab === "settings") checkHealth();
    }
  }, [isAuthenticated, activeTab]);

  // ---------------- PHOTO SLOTS MANAGEMENT (NEW PRODUCT) ----------------
  const updateSlotFile = (slotId, file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setPhotoSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? { ...s, file, preview: previewUrl, url: "", mode: "file" }
          : s
      )
    );
  };

  const updateSlotUrl = (slotId, url) => {
    setPhotoSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? { ...s, url, file: null, preview: url.trim(), mode: "url" }
          : s
      )
    );
  };

  const setSlotMode = (slotId, mode) => {
    setPhotoSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, mode } : s))
    );
  };

  const clearSlot = (slotId) => {
    setPhotoSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? { ...s, file: null, preview: "", url: "" }
          : s
      )
    );
  };

  const addExtraSlot = () => {
    const nextIdx = photoSlots.length + 1;
    setPhotoSlots((prev) => [
      ...prev,
      {
        id: `slot-${Date.now()}`,
        label: `Angle / Detail ${nextIdx}`,
        file: null,
        preview: "",
        url: "",
        mode: "file",
        required: false,
      },
    ]);
  };

  const removeSlot = (slotId) => {
    if (photoSlots.length <= 4) return;
    setPhotoSlots((prev) => prev.filter((s) => s.id !== slotId));
  };

  // Quick Batch Upload: Select 4 or more files at once from file explorer
  const handleBatchUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setPhotoSlots((prev) => {
      const updated = [...prev];
      files.forEach((file, idx) => {
        const previewUrl = URL.createObjectURL(file);
        if (idx < updated.length) {
          updated[idx] = {
            ...updated[idx],
            file,
            preview: previewUrl,
            url: "",
            mode: "file",
          };
        } else {
          // Dynamically add new slot if user selected more than 4 files
          updated.push({
            id: `slot-${Date.now()}-${idx}`,
            label: `Detail ${idx + 1}`,
            file,
            preview: previewUrl,
            url: "",
            mode: "file",
            required: false,
          });
        }
      });
      return updated;
    });
  };

  // Count how many photos have valid files or URLs
  const validPhotosCount = photoSlots.filter(
    (s) => s.file || (s.url && s.url.trim())
  ).length;

  // Toggle size selection
  const toggleSize = (s) => {
    setSelectedSizes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  // Toggle color selection
  const toggleColor = (c) => {
    const exists = selectedColors.some((x) => x.name.toLowerCase() === c.name.toLowerCase());
    if (exists) {
      setSelectedColors((prev) =>
        prev.filter((x) => x.name.toLowerCase() !== c.name.toLowerCase())
      );
    } else {
      setSelectedColors((prev) => [...prev, c]);
    }
  };

  // Toggle active product status
  const handleToggleProduct = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/products/${id}/toggle`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (data.success) {
        setCatalog((prev) => {
          const updated = prev.map((p) => (p.id === id ? { ...p, active: data.active } : p));
          if (onCatalogUpdated) {
            onCatalogUpdated(updated.filter((p) => p.active !== false));
          }
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id, prodName) => {
    if (!window.confirm(`Are you sure you want to delete "${prodName}"?`)) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/products/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setCatalog((prev) => {
          const updated = prev.filter((p) => p.id !== id);
          if (onCatalogUpdated) {
            onCatalogUpdated(updated.filter((p) => p.active !== false));
          }
          return updated;
        });
        setCatalogFeedback({ type: "success", text: `Product "${prodName}" deleted successfully.` });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------- SUBMIT NEW PRODUCT (MIN 4 PHOTOS) ----------------
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFeedbackMsg({ type: "error", text: "Please provide a product name." });
      return;
    }

    // Enforce at least 4 photos
    if (validPhotosCount < 4) {
      setFeedbackMsg({
        type: "error",
        text: `⚠️ Minimum 4 photos required for each product drop (Front, Back, Angle, Detail). You currently have ${validPhotosCount} photo(s) added.`,
      });
      return;
    }

    setSubmitting(true);
    setFeedbackMsg(null);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("cat", cat.trim());
      formData.append("priceNGN", priceNGN);
      formData.append("priceUSD", priceUSD);
      formData.append("tag", tag);
      formData.append("category", category);
      formData.append("desc", desc);
      formData.append("sizes", JSON.stringify(selectedSizes));
      formData.append("colors", JSON.stringify(selectedColors));

      // Separate first valid photo (Cover/Main) from remaining photos
      const filledSlots = photoSlots.filter(
        (s) => s.file || (s.url && s.url.trim())
      );

      const coverSlot = filledSlots[0];
      if (coverSlot.file) {
        formData.append("mainImage", coverSlot.file);
      } else if (coverSlot.url) {
        formData.append("mainImageUrl", coverSlot.url.trim());
      }

      const extraSlots = filledSlots.slice(1);
      const extraUrls = [];

      extraSlots.forEach((slot) => {
        if (slot.file) {
          formData.append("extraImages", slot.file);
        } else if (slot.url && slot.url.trim()) {
          extraUrls.push(slot.url.trim());
        }
      });

      if (extraUrls.length > 0) {
        formData.append("extraImageUrls", JSON.stringify(extraUrls));
      }

      const res = await fetch(`${BACKEND_URL}/api/products`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({
          type: "success",
          text: `Drop "${name}" published with ${validPhotosCount} photos! Loading catalog...`,
        });
        // Reset form
        setName("");
        setDesc("");
        setPhotoSlots(INITIAL_PHOTO_SLOTS);
        if (onProductCreated) onProductCreated(data.product);

        setTimeout(() => {
          setActiveTab("manage");
          setFeedbackMsg(null);
        }, 1200);
      } else {
        setFeedbackMsg({ type: "error", text: data.error || "Failed to create product" });
      }
    } catch (err) {
      setFeedbackMsg({
        type: "error",
        text: "Network error: " + (err.message || "Failed to reach server"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------- EDIT PRODUCT FLOW ----------------
  const handleStartEdit = (product) => {
    setEditingProduct(product);
    setEditName(product.name || "");
    setEditCat(product.cat || "Graphic Tee");
    setEditPriceNGN(product.priceNGN ? String(product.priceNGN) : "60000");
    setEditPriceUSD(product.priceUSD ? String(product.priceUSD) : "45");
    setEditTag(product.tag || "");
    setEditCategory(product.category || "latest");
    setEditDesc(product.desc || "");
    setEditSizes(
      Array.isArray(product.sizes) && product.sizes.length ? product.sizes : ["S", "M", "L", "XL"]
    );
    setEditColors(
      Array.isArray(product.colors) && product.colors.length
        ? product.colors
        : PRESET_COLORS.slice(0, 2)
    );

    // Populate existing gallery
    let initialGallery = [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      initialGallery = product.images.map((img, idx) => ({
        id: `img-${idx}-${Date.now()}`,
        src: typeof img === "string" ? img : img.src,
        label: typeof img === "object" && img.label ? img.label : (idx === 0 ? "Front" : `Detail ${idx}`),
        isNew: false,
      }));
    } else if (product.img) {
      initialGallery = [
        { id: `img-0-${Date.now()}`, src: product.img, label: "Front", isNew: false },
      ];
    }
    setEditGallery(initialGallery);
    setEditNewFile(null);
    setEditNewUrl("");
    setEditNewPreview("");
    setEditFeedback(null);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditFeedback(null);
  };

  // Make an image the primary cover (move to position 0)
  const handleSetCover = (index) => {
    if (index === 0) return;
    setEditGallery((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      item.label = "Front / Cover";
      copy.unshift(item);
      return copy;
    });
  };

  // Remove an image from gallery in Edit mode
  const handleRemoveGalleryItem = (index) => {
    setEditGallery((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Add a new photo in Edit mode
  const handleAddEditPhoto = () => {
    if (editNewMode === "file" && editNewFile) {
      const preview = URL.createObjectURL(editNewFile);
      setEditGallery((prev) => [
        ...prev,
        {
          id: `new-${Date.now()}`,
          src: preview,
          preview,
          file: editNewFile,
          label: `Detail ${prev.length + 1}`,
          isNew: true,
        },
      ]);
      setEditNewFile(null);
      setEditNewPreview("");
    } else if (editNewMode === "url" && editNewUrl.trim()) {
      setEditGallery((prev) => [
        ...prev,
        {
          id: `new-${Date.now()}`,
          src: editNewUrl.trim(),
          label: `Detail ${prev.length + 1}`,
          isNew: false,
        },
      ]);
      setEditNewUrl("");
    }
  };

  // Batch upload more photos in Edit mode
  const handleBatchEditUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newItems = files.map((file, idx) => ({
      id: `new-batch-${Date.now()}-${idx}`,
      src: URL.createObjectURL(file),
      preview: URL.createObjectURL(file),
      file,
      label: `Detail ${editGallery.length + idx + 1}`,
      isNew: true,
    }));
    setEditGallery((prev) => [...prev, ...newItems]);
  };

  // Save changes to existing product
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      setEditFeedback({ type: "error", text: "Product name is required." });
      return;
    }
    if (editGallery.length < 4) {
      const confirmSave = window.confirm(
        `This product has ${editGallery.length} photo(s). SteezeDrip standards recommend at least 4 photos for premium presentation. Do you want to save anyway?`
      );
      if (!confirmSave) return;
    }

    setSavingEdit(true);
    setEditFeedback(null);

    try {
      const formData = new FormData();
      formData.append("name", editName.trim());
      formData.append("cat", editCat.trim());
      formData.append("priceNGN", editPriceNGN);
      formData.append("priceUSD", editPriceUSD);
      formData.append("tag", editTag);
      formData.append("category", editCategory);
      formData.append("desc", editDesc);
      formData.append("sizes", JSON.stringify(editSizes));
      formData.append("colors", JSON.stringify(editColors));

      // Separate existing hosted images vs newly uploaded files
      const existingImages = editGallery
        .filter((item) => !item.isNew && item.src && !item.src.startsWith("blob:"))
        .map((item) => ({ src: item.src, label: item.label }));
      formData.append("existingImages", JSON.stringify(existingImages));

      // New files
      editGallery
        .filter((item) => item.isNew && item.file)
        .forEach((item) => {
          formData.append("extraImages", item.file);
        });

      const res = await fetch(`${BACKEND_URL}/api/products/${editingProduct.id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setCatalog((prev) => {
          const updated = prev.map((p) =>
            p.id === data.product.id ? { ...p, ...data.product } : p
          );
          if (onCatalogUpdated) {
            onCatalogUpdated(updated.filter((p) => p.active !== false));
          }
          return updated;
        });

        setCatalogFeedback({
          type: "success",
          text: `Drop "${data.product.name}" updated successfully!`,
        });
        setEditingProduct(null);
      } else {
        setEditFeedback({ type: "error", text: data.error || "Failed to update product." });
      }
    } catch (err) {
      setEditFeedback({
        type: "error",
        text: "Network error: " + (err.message || "Failed to update product."),
      });
    } finally {
      setSavingEdit(false);
    }
  };

  // Preview Image for Upload Tab
  const firstFilledSlot = photoSlots.find((s) => s.preview || (s.url && s.url.trim()));
  const previewImage =
    (firstFilledSlot ? firstFilledSlot.preview || firstFilledSlot.url : null) ||
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80";

  // Preview Image for Edit Modal
  const editCoverImage =
    editGallery.length > 0 && editGallery[0].src
      ? editGallery[0].src
      : editingProduct?.img || previewImage;

  return (
    <div className="admin-overlay">
      <div className="admin-container">
        {/* Header Bar */}
        <div className="admin-header">
          <div className="admin-brand">
            <span className="admin-eyebrow">SteezeDrip HQ</span>
            <h2>COMMAND CENTER // ADMIN</h2>
          </div>
          <div className="admin-header-actions">
            {isAuthenticated && (
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>
                Lock Session
              </button>
            )}
            <button className="btn btn-outline btn-sm" onClick={onClose} title="Return to Storefront">
              ✕ Close
            </button>
          </div>
        </div>

        {/* Auth Gate */}
        {!isAuthenticated ? (
          <div className="admin-auth-card">
            <div className="admin-auth-inner">
              <span className="auth-lock-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              <h3>Admin Access Restricted</h3>
              <p>Enter the storemaster passkey to manage drops and view Paystack orders.</p>
              <form onSubmit={handleLogin} className="admin-auth-form">
                <input
                  type="password"
                  className="ck-input"
                  placeholder="Enter admin password (Default: steezedrip2025)"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  autoFocus
                />
                {authError && <div className="admin-alert error">{authError}</div>}
                <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                  Unlock Dashboard →
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Main Dashboard Content */
          <div className="admin-main">
            {/* Tabs */}
            <div className="admin-nav-tabs">
              <button
                className={`admin-tab ${activeTab === "upload" ? "active" : ""}`}
                onClick={() => setActiveTab("upload")}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Upload Drop
              </button>
              <button
                className={`admin-tab ${activeTab === "manage" ? "active" : ""}`}
                onClick={() => setActiveTab("manage")}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                  <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
                Manage Catalog
              </button>
              <button
                className={`admin-tab ${activeTab === "orders" ? "active" : ""}`}
                onClick={() => setActiveTab("orders")}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                Paystack Orders
              </button>
              <button
                className={`admin-tab ${activeTab === "settings" ? "active" : ""}`}
                onClick={() => setActiveTab("settings")}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                Status &amp; DB
              </button>
            </div>

            {/* TAB 1: UPLOAD DROP */}
            {activeTab === "upload" && (
              <div className="admin-grid">
                {/* Form Column */}
                <form className="admin-form-col" onSubmit={handleSubmitProduct}>
                  <div className="admin-card">
                    <h3 className="section-subtitle">Drop Details</h3>

                    {feedbackMsg && (
                      <div className={`admin-alert ${feedbackMsg.type}`}>
                        {feedbackMsg.text}
                      </div>
                    )}

                    <div className="admin-form-row">
                      <div className="admin-field flex-2">
                        <label className="admin-label">Product Name *</label>
                        <input
                          type="text"
                          className="ck-input"
                          placeholder="e.g. Lagos Skyline Varsity"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="admin-field flex-1">
                        <label className="admin-label">Category</label>
                        <input
                          type="text"
                          className="ck-input"
                          placeholder="e.g. Graphic Tee, Hoodie"
                          value={cat}
                          onChange={(e) => setCat(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="admin-form-row">
                      <div className="admin-field">
                        <label className="admin-label">Price (₦ Naira) *</label>
                        <input
                          type="number"
                          className="ck-input"
                          placeholder="60000"
                          value={priceNGN}
                          onChange={(e) => setPriceNGN(e.target.value)}
                          required
                        />
                      </div>
                      <div className="admin-field">
                        <label className="admin-label">Price ($ USD)</label>
                        <input
                          type="number"
                          className="ck-input"
                          placeholder="45"
                          value={priceUSD}
                          onChange={(e) => setPriceUSD(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="admin-form-row">
                      <div className="admin-field">
                        <label className="admin-label">Badge Tag</label>
                        <select
                          className="ck-input"
                          value={tag}
                          onChange={(e) => setTag(e.target.value)}
                        >
                          <option value="NEW">NEW</option>
                          <option value="LIMITED">LIMITED</option>
                          <option value="BESTSELLER">BESTSELLER</option>
                          <option value="EXCLUSIVE">EXCLUSIVE</option>
                          <option value="">None</option>
                        </select>
                      </div>
                      <div className="admin-field">
                        <label className="admin-label">Filter Section</label>
                        <select
                          className="ck-input"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          <option value="latest">Latest Collection</option>
                          <option value="bestseller">Best Sellers</option>
                          <option value="all">Standard Catalog</option>
                        </select>
                      </div>
                    </div>

                    <div className="admin-field">
                      <label className="admin-label">Description / Fit / Notes</label>
                      <textarea
                        className="ck-input"
                        rows={3}
                        placeholder="Heavyweight 380gsm cotton, relaxed drop-shoulder cut..."
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Sizes & Colors Card */}
                  <div className="admin-card">
                    <h3 className="section-subtitle">Sizes & Colors</h3>

                    <div className="admin-field">
                      <label className="admin-label">Available Sizes (Tap to toggle)</label>
                      <div className="admin-pill-group">
                        {PRESET_SIZES.map((sz) => {
                          const active = selectedSizes.includes(sz);
                          return (
                            <button
                              type="button"
                              key={sz}
                              className={`admin-size-pill ${active ? "active" : ""}`}
                              onClick={() => toggleSize(sz)}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="admin-field">
                      <label className="admin-label">Available Colors (Tap to toggle)</label>
                      <div className="admin-pill-group">
                        {PRESET_COLORS.map((c) => {
                          const active = selectedColors.some(
                            (x) => x.name.toLowerCase() === c.name.toLowerCase()
                          );
                          return (
                            <button
                              type="button"
                              key={c.name}
                              className={`admin-color-pill ${active ? "active" : ""}`}
                              onClick={() => toggleColor(c)}
                            >
                              <span
                                className="color-swatch-dot"
                                style={{ backgroundColor: c.hex }}
                              />
                              {c.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Photography Card (4+ Photos Enforced) */}
                  <div className="admin-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "10px" }}>
                      <h3 className="section-subtitle" style={{ margin: 0 }}>
                        Product Photography (At Least 4 Photos Required)
                      </h3>
                      {/* Batch upload shortcut */}
                      <label className="btn btn-outline btn-sm" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        ⚡ Batch Select 4+ Photos
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleBatchUpload}
                          style={{ display: "none" }}
                        />
                      </label>
                    </div>

                    {/* Progress Bar & Status */}
                    <div className="admin-photo-progress-bar">
                      <div className={`admin-photo-progress-badge ${validPhotosCount >= 4 ? "ready" : "warning"}`}>
                        {validPhotosCount >= 4 ? "✓" : "⚠️"} Photos Added: {validPhotosCount} / 4 minimum
                        {validPhotosCount >= 4 ? " (Ready to drop)" : ` (Please add ${4 - validPhotosCount} more)`}
                      </div>
                      <span className="admin-hint" style={{ margin: 0 }}>
                        Required views: Front, Back, Side Angle, and Detail/Fabric shot.
                      </span>
                    </div>

                    {/* 4+ Photo Slots Grid */}
                    <div className="admin-photo-slots-grid">
                      {photoSlots.map((slot, index) => {
                        const isFilled = Boolean(slot.file || (slot.url && slot.url.trim()));
                        return (
                          <div key={slot.id} className={`admin-photo-slot ${isFilled ? "filled" : ""}`}>
                            <div className="admin-photo-slot-header">
                              <span className="admin-slot-label">
                                {index === 0 ? "★ " : ""}{slot.label} {slot.required && "*"}
                              </span>
                              {!slot.required && photoSlots.length > 4 && (
                                <button
                                  type="button"
                                  onClick={() => removeSlot(slot.id)}
                                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "11px" }}
                                  title="Remove slot"
                                >
                                  ✕
                                </button>
                              )}
                            </div>

                            {/* Preview box */}
                            <div className="admin-slot-preview-box">
                              {slot.preview ? (
                                <>
                                  <img
                                    src={slot.preview}
                                    alt={slot.label}
                                    className="admin-slot-preview-img"
                                  />
                                  <button
                                    type="button"
                                    className="admin-slot-clear-btn"
                                    onClick={() => clearSlot(slot.id)}
                                    title="Clear photo"
                                  >
                                    ✕
                                  </button>
                                </>
                              ) : (
                                <div className="admin-slot-preview-placeholder">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21 15 16 10 5 21"></polyline>
                                  </svg>
                                  <span>No photo added yet</span>
                                </div>
                              )}
                            </div>

                            {/* Input Mode Toggle */}
                            <div className="admin-slot-inputs">
                              <div className="admin-slot-mode-toggle">
                                <button
                                  type="button"
                                  className={`admin-slot-mode-btn ${slot.mode === "file" ? "active" : ""}`}
                                  onClick={() => setSlotMode(slot.id, "file")}
                                >
                                  Device File
                                </button>
                                <button
                                  type="button"
                                  className={`admin-slot-mode-btn ${slot.mode === "url" ? "active" : ""}`}
                                  onClick={() => setSlotMode(slot.id, "url")}
                                >
                                  Web URL
                                </button>
                              </div>

                              {slot.mode === "file" ? (
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="admin-file-input"
                                  onChange={(e) => updateSlotFile(slot.id, e.target.files?.[0])}
                                />
                              ) : (
                                <input
                                  type="url"
                                  className="ck-input"
                                  placeholder="https://i.imgur.com/..."
                                  value={slot.url}
                                  onChange={(e) => updateSlotUrl(slot.id, e.target.value)}
                                  style={{ fontSize: "12px", padding: "6px 10px" }}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={addExtraSlot}
                      style={{ marginTop: "4px" }}
                    >
                      + Add Additional Angle Slot
                    </button>

                    {feedbackMsg && (
                      <div className={`admin-alert ${feedbackMsg.type}`} style={{ marginTop: "14px" }}>
                        {feedbackMsg.text}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary btn-lg"
                      style={{ width: "100%", justifyContent: "center", marginTop: "16px" }}
                    >
                      {submitting ? "Uploading photos & publishing drop..." : "Publish Drop To Storefront"}
                    </button>
                  </div>
                </form>

                {/* Live Card Preview Column */}
                <div className="admin-preview-col">
                  <div className="preview-sticky">
                    <span className="eyebrow">Live Shopper Preview</span>
                    <p className="admin-hint" style={{ marginBottom: "12px" }}>
                      This is exactly how this piece will render on the home collection grid.
                    </p>

                    <div className="product-card preview-card">
                      <div className="card-media">
                        <img src={previewImage} alt="Preview" className="card-img" />
                        {tag && <span className="card-tag">{tag}</span>}
                      </div>
                      <div className="card-info">
                        <div className="card-cat">{cat || "Category"}</div>
                        <h4 className="card-title">{name || "Your Drop Name"}</h4>
                        <div className="card-price">
                          ₦{Number(priceNGN || 0).toLocaleString()}{" "}
                          <span className="secondary">(${priceUSD || 0})</span>
                        </div>
                        <div className="card-sizes">
                          {selectedSizes.length > 0
                            ? selectedSizes.join(" · ")
                            : "No sizes selected"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MANAGE CATALOG */}
            {activeTab === "manage" && (
              <div className="admin-catalog-view">
                <div className="catalog-header-bar">
                  <h3>Active Drops ({catalog.length})</h3>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-outline btn-sm" onClick={loadCatalog}>
                      ↻ Refresh
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setActiveTab("upload")}
                    >
                      + New Drop
                    </button>
                  </div>
                </div>

                {catalogFeedback && (
                  <div className={`admin-alert ${catalogFeedback.type}`} style={{ marginBottom: "16px" }}>
                    {catalogFeedback.text}
                  </div>
                )}

                {loadingCatalog ? (
                  <p className="admin-hint">Loading catalog...</p>
                ) : catalog.length === 0 ? (
                  <p className="admin-hint">No drops found in database.</p>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Photo</th>
                          <th>Name</th>
                          <th>Category</th>
                          <th>Price (₦)</th>
                          <th>Photos</th>
                          <th>Badge</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catalog.map((item) => {
                          const numPhotos = Array.isArray(item.images) ? item.images.length : (item.img ? 1 : 0);
                          return (
                            <tr key={item.id}>
                              <td>
                                <img
                                  src={item.img}
                                  alt={item.name}
                                  style={{
                                    width: "48px",
                                    height: "56px",
                                    objectFit: "cover",
                                    borderRadius: "4px",
                                  }}
                                />
                              </td>
                              <td>
                                <strong>{item.name}</strong>
                                <div style={{ fontSize: "11px", opacity: 0.6 }}>{item.id}</div>
                              </td>
                              <td>{item.cat}</td>
                              <td>₦{Number(item.priceNGN || 0).toLocaleString()}</td>
                              <td>
                                <span style={{
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  color: numPhotos >= 4 ? "#4ade80" : "#fbbf24",
                                }}>
                                  {numPhotos} photo{numPhotos === 1 ? "" : "s"}
                                </span>
                              </td>
                              <td>
                                {item.tag ? (
                                  <span className="admin-badge-tag">{item.tag}</span>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td>
                                <span
                                  className={`admin-status-pill ${
                                    item.active !== false ? "live" : "hidden"
                                  }`}
                                >
                                  {item.active !== false ? "● LIVE" : "○ HIDDEN"}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <button
                                    className="btn btn-outline btn-sm admin-edit-btn"
                                    onClick={() => handleStartEdit(item)}
                                    title="Edit this product details & photos"
                                    style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-outline btn-sm"
                                    onClick={() => handleToggleProduct(item.id)}
                                  >
                                    {item.active !== false ? "Hide" : "Show"}
                                  </button>
                                  <button
                                    className="btn btn-outline btn-sm danger"
                                    onClick={() => handleDeleteProduct(item.id, item.name)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PAYSTACK ORDERS */}
            {activeTab === "orders" && (
              <div className="admin-orders-view">
                <div className="catalog-header-bar">
                  <h3>Customer Orders ({orders.length})</h3>
                  <button className="btn btn-outline btn-sm" onClick={loadOrders}>
                    ↻ Refresh Orders
                  </button>
                </div>

                {loadingOrders ? (
                  <p className="admin-hint">Loading customer orders...</p>
                ) : orders.length === 0 ? (
                  <div className="admin-empty-state">
                    <span style={{ display: "inline-flex", color: "var(--accent)", marginBottom: "8px" }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                      </svg>
                    </span>
                    <h4>No Orders Placed Yet</h4>
                    <p>When customers check out via Paystack, their orders will populate here with verified payments.</p>
                  </div>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Ref #</th>
                          <th>Customer</th>
                          <th>Phone / WhatsApp</th>
                          <th>Items</th>
                          <th>Total (₦)</th>
                          <th>Payment</th>
                          <th>Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((ord) => {
                          const items = Array.isArray(ord.items)
                            ? ord.items
                            : typeof ord.items === "string"
                            ? JSON.parse(ord.items)
                            : [];
                          return (
                            <tr key={ord.reference}>
                              <td>
                                <span className="ref-code">{ord.reference}</span>
                              </td>
                              <td>
                                <strong>{ord.customer_name}</strong>
                                <div style={{ fontSize: "12px", opacity: 0.7 }}>
                                  {ord.customer_email}
                                </div>
                              </td>
                              <td>
                                {ord.customer_phone ? (
                                  <a
                                    href={`https://wa.me/${ord.customer_phone.replace(/[^0-9]/g, "")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="wa-customer-link"
                                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                    </svg>
                                    {ord.customer_phone}
                                  </a>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td>
                                {items.map((i, idx) => (
                                  <div key={idx} style={{ fontSize: "12px" }}>
                                    {i.qty}× {i.name} ({i.size}, {i.color})
                                  </div>
                                ))}
                              </td>
                              <td>
                                <strong>
                                  ₦{Number(ord.amount_ngn || 0).toLocaleString()}
                                </strong>
                              </td>
                              <td>
                                <span
                                  className={`admin-status-pill ${
                                    ord.status === "paid" ? "live" : "pending"
                                  }`}
                                >
                                  {ord.status ? ord.status.toUpperCase() : "PENDING"}
                                </span>
                              </td>
                              <td style={{ maxWidth: "180px", fontSize: "12px" }}>
                                {ord.delivery_address || "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: SYSTEM STATUS & POSTGRESQL GUIDE */}
            {activeTab === "settings" && (
              <div className="admin-settings-view">
                <div className="admin-card">
                  <h3 className="section-subtitle">System Connectivity</h3>
                  {systemHealth ? (
                    <div className="health-grid">
                      <div className="health-stat">
                        <span className="health-label">PostgreSQL Database:</span>
                        <span className={`health-badge ${systemHealth.postgresConnected ? "ok" : "warn"}`}>
                          {systemHealth.postgresConnected ? "CONNECTED" : "FALLBACK IN-MEMORY"}
                        </span>
                      </div>
                      <div className="health-stat">
                        <span className="health-label">Paystack Gateway:</span>
                        <span className={`health-badge ${systemHealth.paystackConfigured ? "ok" : "warn"}`}>
                          {systemHealth.paystackConfigured ? "CONFIGURED" : "TEST/DEMO MODE"}
                        </span>
                      </div>
                      <div className="health-stat">
                        <span className="health-label">Cloudinary Storage:</span>
                        <span className={`health-badge ${systemHealth.cloudinaryConfigured ? "ok" : "warn"}`}>
                          {systemHealth.cloudinaryConfigured ? "CONFIGURED" : "DIRECT/DATA URL"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <button className="btn btn-outline btn-sm" onClick={checkHealth}>
                      Check Health
                    </button>
                  )}
                </div>

                <div className="admin-card" style={{ marginTop: "20px" }}>
                  <h3 className="section-subtitle">How To Connect PostgreSQL & Paystack</h3>
                  <div className="admin-guide-steps">
                    <div className="step-item">
                      <strong>1. PostgreSQL (Neon / Railway / Render)</strong>
                      <p>
                        Get your database URL (e.g. <code>postgresql://...</code>) and place it in <code>server/.env</code> as <code>DATABASE_URL</code>.
                      </p>
                    </div>
                    <div className="step-item">
                      <strong>2. Paystack API Keys</strong>
                      <p>
                        Log in to Paystack Dashboard → Settings → API Keys & Webhooks. Copy your <code>Secret Key</code> and put it in <code>server/.env</code> as <code>PAYSTACK_SECRET_KEY</code>.
                      </p>
                    </div>
                    <div className="step-item">
                      <strong>3. Cloudinary (Free Photo Storage)</strong>
                      <p>
                        Log in to Cloudinary.com → Settings → API Keys. Put your <code>CLOUDINARY_CLOUD_NAME</code>, <code>CLOUDINARY_API_KEY</code>, and <code>CLOUDINARY_API_SECRET</code> in <code>server/.env</code>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---------------- EDIT PRODUCT MODAL OVERLAY ---------------- */}
      {editingProduct && (
        <div className="admin-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && handleCancelEdit()}>
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <div>
                <span className="admin-eyebrow">Edit Available Product</span>
                <h3 style={{ margin: "4px 0 0", fontFamily: "'Big Shoulders Display', sans-serif", fontSize: "22px", textTransform: "uppercase" }}>
                  {editingProduct.name} <span style={{ opacity: 0.5, fontSize: "14px" }}>({editingProduct.id})</span>
                </h3>
              </div>
              <button className="btn btn-outline btn-sm" onClick={handleCancelEdit}>
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="admin-modal-body">
              {editFeedback && (
                <div className={`admin-alert ${editFeedback.type}`} style={{ marginBottom: "16px" }}>
                  {editFeedback.text}
                </div>
              )}

              <div className="admin-edit-grid">
                {/* Left Form Area */}
                <div>
                  <div className="admin-form-row">
                    <div className="admin-field flex-2">
                      <label className="admin-label">Product Name *</label>
                      <input
                        type="text"
                        className="ck-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="admin-field flex-1">
                      <label className="admin-label">Category</label>
                      <input
                        type="text"
                        className="ck-input"
                        value={editCat}
                        onChange={(e) => setEditCat(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-field">
                      <label className="admin-label">Price (₦ Naira) *</label>
                      <input
                        type="number"
                        className="ck-input"
                        value={editPriceNGN}
                        onChange={(e) => setEditPriceNGN(e.target.value)}
                        required
                      />
                    </div>
                    <div className="admin-field">
                      <label className="admin-label">Price ($ USD)</label>
                      <input
                        type="number"
                        className="ck-input"
                        value={editPriceUSD}
                        onChange={(e) => setEditPriceUSD(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-field">
                      <label className="admin-label">Badge Tag</label>
                      <select
                        className="ck-input"
                        value={editTag}
                        onChange={(e) => setEditTag(e.target.value)}
                      >
                        <option value="NEW">NEW</option>
                        <option value="LIMITED">LIMITED</option>
                        <option value="BESTSELLER">BESTSELLER</option>
                        <option value="EXCLUSIVE">EXCLUSIVE</option>
                        <option value="">None</option>
                      </select>
                    </div>
                    <div className="admin-field">
                      <label className="admin-label">Filter Section</label>
                      <select
                        className="ck-input"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                      >
                        <option value="latest">Latest Collection</option>
                        <option value="bestseller">Best Sellers</option>
                        <option value="all">Standard Catalog</option>
                      </select>
                    </div>
                  </div>

                  <div className="admin-field">
                    <label className="admin-label">Description / Fit / Notes</label>
                    <textarea
                      className="ck-input"
                      rows={3}
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                    />
                  </div>

                  {/* Sizes */}
                  <div className="admin-field" style={{ marginTop: "14px" }}>
                    <label className="admin-label">Available Sizes</label>
                    <div className="admin-pill-group">
                      {PRESET_SIZES.map((sz) => {
                        const active = editSizes.includes(sz);
                        return (
                          <button
                            type="button"
                            key={sz}
                            className={`admin-size-pill ${active ? "active" : ""}`}
                            onClick={() => {
                              setEditSizes((prev) =>
                                prev.includes(sz) ? prev.filter((x) => x !== sz) : [...prev, sz]
                              );
                            }}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="admin-field" style={{ marginTop: "14px" }}>
                    <label className="admin-label">Available Colors</label>
                    <div className="admin-pill-group">
                      {PRESET_COLORS.map((c) => {
                        const active = editColors.some(
                          (x) => x.name.toLowerCase() === c.name.toLowerCase()
                        );
                        return (
                          <button
                            type="button"
                            key={c.name}
                            className={`admin-color-pill ${active ? "active" : ""}`}
                            onClick={() => {
                              setEditColors((prev) => {
                                const exists = prev.some(
                                  (x) => x.name.toLowerCase() === c.name.toLowerCase()
                                );
                                if (exists) {
                                  return prev.filter(
                                    (x) => x.name.toLowerCase() !== c.name.toLowerCase()
                                  );
                                }
                                return [...prev, c];
                              });
                            }}
                          >
                            <span
                              className="color-swatch-dot"
                              style={{ backgroundColor: c.hex }}
                            />
                            {c.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Photography Manager */}
                  <div style={{ marginTop: "20px", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                      <label className="admin-label" style={{ margin: 0 }}>
                        Product Photo Gallery ({editGallery.length} photos)
                      </label>
                      <label className="btn btn-outline btn-sm" style={{ cursor: "pointer" }}>
                        ⚡ Batch Add Photos
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleBatchEditUpload}
                          style={{ display: "none" }}
                        />
                      </label>
                    </div>

                    <p className="admin-hint" style={{ marginBottom: "10px" }}>
                      Tap "Make Cover" to set any photo as the main storefront image. First image is always the cover.
                    </p>

                    <div className="admin-gallery-strip">
                      {editGallery.map((item, idx) => (
                        <div key={item.id || idx} className={`admin-gallery-item ${idx === 0 ? "is-cover" : ""}`}>
                          {idx === 0 && <span className="admin-cover-badge">★ COVER</span>}
                          <img src={item.src} alt={item.label || `Photo ${idx}`} className="admin-gallery-thumb" />
                          <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-dim)", textTransform: "uppercase" }}>
                            {idx === 0 ? "Front / Cover" : (item.label || `Angle ${idx}`)}
                          </div>
                          <div style={{ display: "flex", gap: "4px", marginTop: "auto" }}>
                            {idx !== 0 && (
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => handleSetCover(idx)}
                                style={{ fontSize: "10px", padding: "2px 6px", flex: 1 }}
                                title="Set as primary cover"
                              >
                                Cover
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-outline btn-sm danger"
                              onClick={() => handleRemoveGalleryItem(idx)}
                              style={{ fontSize: "10px", padding: "2px 6px" }}
                              title="Delete photo"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add new photo input */}
                    <div style={{ marginTop: "14px", background: "var(--bg-soft)", padding: "12px", borderRadius: "6px", border: "1px dashed var(--line)" }}>
                      <span className="admin-label" style={{ display: "block", marginBottom: "8px" }}>
                        + Add Another Photo to Gallery
                      </span>
                      <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
                        <button
                          type="button"
                          className={`admin-slot-mode-btn ${editNewMode === "file" ? "active" : ""}`}
                          onClick={() => setEditNewMode("file")}
                        >
                          From Device
                        </button>
                        <button
                          type="button"
                          className={`admin-slot-mode-btn ${editNewMode === "url" ? "active" : ""}`}
                          onClick={() => setEditNewMode("url")}
                        >
                          Image Web URL
                        </button>
                      </div>

                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {editNewMode === "file" ? (
                          <input
                            type="file"
                            accept="image/*"
                            className="admin-file-input"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) setEditNewFile(f);
                            }}
                            style={{ flex: 1 }}
                          />
                        ) : (
                          <input
                            type="url"
                            className="ck-input"
                            placeholder="https://i.imgur.com/..."
                            value={editNewUrl}
                            onChange={(e) => setEditNewUrl(e.target.value)}
                            style={{ flex: 1 }}
                          />
                        )}
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={handleAddEditPhoto}
                          disabled={editNewMode === "file" ? !editNewFile : !editNewUrl.trim()}
                        >
                          + Add Photo
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Preview Column */}
                <div>
                  <div className="preview-sticky">
                    <span className="eyebrow">Shopper Preview</span>
                    <p className="admin-hint" style={{ marginBottom: "12px" }}>
                      Live preview with updated drop details and primary cover photo.
                    </p>

                    <div className="product-card preview-card">
                      <div className="card-media">
                        <img src={editCoverImage} alt="Cover Preview" className="card-img" />
                        {editTag && <span className="card-tag">{editTag}</span>}
                      </div>
                      <div className="card-info">
                        <div className="card-cat">{editCat || "Category"}</div>
                        <h4 className="card-title">{editName || "Drop Name"}</h4>
                        <div className="card-price">
                          ₦{Number(editPriceNGN || 0).toLocaleString()}{" "}
                          <span className="secondary">(${editPriceUSD || 0})</span>
                        </div>
                        <div className="card-sizes">
                          {editSizes.length > 0
                            ? editSizes.join(" · ")
                            : "No sizes selected"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="admin-modal-footer" style={{ marginTop: "24px" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleCancelEdit}
                  disabled={savingEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingEdit}
                >
                  {savingEdit ? "Saving Product Changes..." : "Save Product Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
