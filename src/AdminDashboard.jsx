import React, { useState, useEffect } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

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

export default function AdminDashboard({ onClose, onProductCreated }) {
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

  // Image states
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState("");
  const [mainImageUrl, setMainImageUrl] = useState("");
  const [extraImageFiles, setExtraImageFiles] = useState([]);
  const [extraPreviews, setExtraPreviews] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Manage Catalog State
  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

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

  // Handle Main Image file input
  const handleMainFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImageFile(file);
      setMainImagePreview(URL.createObjectURL(file));
      setMainImageUrl("");
    }
  };

  // Handle Extra Image files
  const handleExtraFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setExtraImageFiles(files);
      const previews = files.map((f) => URL.createObjectURL(f));
      setExtraPreviews(previews);
    }
  };

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
        setCatalog((prev) =>
          prev.map((p) => (p.id === id ? { ...p, active: data.active } : p))
        );
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
        setCatalog((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit new product
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFeedbackMsg({ type: "error", text: "Please provide a product name." });
      return;
    }
    if (!mainImageFile && !mainImageUrl.trim()) {
      setFeedbackMsg({ type: "error", text: "Please upload or provide at least one photo." });
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

      if (mainImageFile) {
        formData.append("mainImage", mainImageFile);
      } else if (mainImageUrl) {
        formData.append("mainImageUrl", mainImageUrl.trim());
      }

      extraImageFiles.forEach((file) => {
        formData.append("extraImages", file);
      });

      const res = await fetch(`${BACKEND_URL}/api/products`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({
          type: "success",
          text: `Drop "${name}" published successfully!`,
        });
        // Reset form
        setName("");
        setDesc("");
        setMainImageFile(null);
        setMainImagePreview("");
        setMainImageUrl("");
        setExtraImageFiles([]);
        setExtraPreviews([]);
        if (onProductCreated) onProductCreated(data.product);
      } else {
        setFeedbackMsg({ type: "error", text: data.error || "Failed to create product" });
      }
    } catch (err) {
      setFeedbackMsg({ type: "error", text: "Network error: " + err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const previewImage =
    mainImagePreview ||
    mainImageUrl ||
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80";

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
              <span className="auth-lock-icon">🔒</span>
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
              >
                ➕ Upload Drop
              </button>
              <button
                className={`admin-tab ${activeTab === "manage" ? "active" : ""}`}
                onClick={() => setActiveTab("manage")}
              >
                🏷️ Manage Catalog
              </button>
              <button
                className={`admin-tab ${activeTab === "orders" ? "active" : ""}`}
                onClick={() => setActiveTab("orders")}
              >
                💳 Paystack Orders
              </button>
              <button
                className={`admin-tab ${activeTab === "settings" ? "active" : ""}`}
                onClick={() => setActiveTab("settings")}
              >
                ⚙️ Status & DB
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

                  {/* Photo Upload Card */}
                  <div className="admin-card">
                    <h3 className="section-subtitle">Product Photography</h3>

                    <div className="admin-field">
                      <label className="admin-label">Main Photo (Device upload)</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="admin-file-input"
                        onChange={handleMainFileChange}
                      />
                      <span className="admin-hint">
                        Or paste a direct image URL if already hosted:
                      </span>
                      <input
                        type="url"
                        className="ck-input"
                        placeholder="https://i.imgur.com/..."
                        value={mainImageUrl}
                        onChange={(e) => {
                          setMainImageUrl(e.target.value);
                          setMainImageFile(null);
                          setMainImagePreview("");
                        }}
                      />
                    </div>

                    <div className="admin-field">
                      <label className="admin-label">Extra Angles / Detail Shots (Up to 4)</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="admin-file-input"
                        onChange={handleExtraFilesChange}
                      />
                      {extraPreviews.length > 0 && (
                        <div className="admin-extra-previews">
                          {extraPreviews.map((p, idx) => (
                            <img key={idx} src={p} alt={`Extra ${idx}`} className="extra-thumb" />
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary btn-lg"
                      style={{ width: "100%", justifyContent: "center", marginTop: "16px" }}
                    >
                      {submitting ? "Publishing Drop..." : "🚀 Publish Drop To Storefront"}
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
                  <button className="btn btn-outline btn-sm" onClick={loadCatalog}>
                    ↻ Refresh
                  </button>
                </div>

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
                          <th>Badge</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catalog.map((item) => (
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
                              <div style={{ display: "flex", gap: "8px" }}>
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
                        ))}
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
                    <span style={{ fontSize: "36px" }}>📦</span>
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
                                  >
                                    💬 {ord.customer_phone}
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
    </div>
  );
}
