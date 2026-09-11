import React, { useState, useEffect } from "react";

export default function LegalModal({ initialTab = "shipping", onClose }) {
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="overlay-scrim"
      style={{ zIndex: 180 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="pm-card legal-modal" style={{ maxWidth: "780px", maxHeight: "88vh" }}>
        <button className="pm-close" onClick={onClose} aria-label="Close modal">✕</button>

        <div className="legal-modal-inner" style={{ padding: "32px clamp(16px, 4vw, 36px)", width: "100%" }}>
          <span className="eyebrow">SteezeDrip Legal &amp; Compliance</span>
          <h2 className="section-title" style={{ fontSize: "clamp(24px, 4vw, 34px)", margin: "6px 0 18px" }}>
            Brand Policies &amp; Terms
          </h2>

          {/* Tab Navigation */}
          <div className="admin-nav-tabs" style={{ padding: "0 0 12px 0", background: "transparent", marginBottom: "20px" }}>
            <button
              className={`admin-tab ${tab === "shipping" ? "active" : ""}`}
              onClick={() => setTab("shipping")}
            >
              📦 Shipping &amp; Returns
            </button>
            <button
              className={`admin-tab ${tab === "privacy" ? "active" : ""}`}
              onClick={() => setTab("privacy")}
            >
              🔒 Privacy Policy (NDPR)
            </button>
            <button
              className={`admin-tab ${tab === "terms" ? "active" : ""}`}
              onClick={() => setTab("terms")}
            >
              📜 Terms of Service
            </button>
          </div>

          {/* Tab 1: Shipping & Returns (Paystack Compliance) */}
          {tab === "shipping" && (
            <div className="legal-content-body">
              <h3 className="section-subtitle">Shipping &amp; Delivery Timelines</h3>
              <p className="legal-p">
                SteezeDrip pieces are produced and cut in small batches in Lagos, Nigeria. Orders are dispatched within 24 hours of payment confirmation.
              </p>
              <ul className="legal-list">
                <li><strong>Lagos Deliveries:</strong> Same-day or 24–48 hours via dispatched courier.</li>
                <li><strong>Nationwide Nigeria:</strong> 2 to 4 business days via reliable interstate courier services.</li>
                <li><strong>International Deliveries:</strong> 5 to 10 business days via DHL Express or FedEx International (tracking number provided via email and WhatsApp).</li>
              </ul>

              <h3 className="section-subtitle" style={{ marginTop: "24px" }}>Exchange &amp; Return Policy</h3>
              <p className="legal-p">
                Because our collections are small-batch and released in strictly limited numbers, we do not restock drops once sold out.
              </p>
              <ul className="legal-list">
                <li><strong>Size Exchanges:</strong> If your piece does not fit as desired, you may request an exchange within <strong>7 days</strong> of delivery, provided the garment is unworn, unwashed, and in original condition with all tags attached. Exchanges are subject to size availability.</li>
                <li><strong>Defects or Errors:</strong> In the rare event that an item arrives damaged or incorrect, contact us immediately via WhatsApp or email with photos. We will arrange a free replacement or a 100% full refund via Paystack immediately.</li>
                <li><strong>Cancellations:</strong> Orders may be cancelled before shipment by contacting support. Once dispatched, standard return guidelines apply.</li>
              </ul>
            </div>
          )}

          {/* Tab 2: Privacy Policy (NDPR & GDPR Compliant) */}
          {tab === "privacy" && (
            <div className="legal-content-body">
              <h3 className="section-subtitle">Privacy &amp; Data Protection</h3>
              <p className="legal-p">
                SteezeDrip ("we", "our") is committed to protecting your personal information in accordance with the Nigeria Data Protection Act (NDPA/NDPR) and international privacy frameworks (GDPR).
              </p>

              <h4 className="legal-h4">1. Information We Collect</h4>
              <p className="legal-p">
                When you place an order, we collect only the necessary details required to deliver your clothes: your full name, email address (for receipts), phone or WhatsApp number (for courier dispatch), and delivery address.
              </p>

              <h4 className="legal-h4">2. Secure Payment Processing</h4>
              <p className="legal-p">
                All card payments, bank transfers, and USSD transactions are handled directly by <strong>Paystack Payments Limited</strong>, a PCI-DSS Level 1 certified payment gateway. <strong>SteezeDrip never stores, logs, or has access to your debit card numbers, CVVs, or bank PINs.</strong>
              </p>

              <h4 className="legal-h4">3. No Sale of Personal Data</h4>
              <p className="legal-p">
                We will never sell, rent, or trade your personal contact details to any third-party advertisers. Your information is used solely to deliver your orders and send order status updates.
              </p>
            </div>
          )}

          {/* Tab 3: Terms of Service */}
          {tab === "terms" && (
            <div className="legal-content-body">
              <h3 className="section-subtitle">Terms of Service</h3>
              <p className="legal-p">
                By purchasing from SteezeDrip (via <code>steezedrips.com</code> or verified WhatsApp channels), you agree to the following terms:
              </p>
              <ul className="legal-list">
                <li><strong>Limited Drops &amp; Availability:</strong> All products are released in capped numbers. Adding an item to your cart does not reserve it until checkout and payment verification is finalized on Paystack.</li>
                <li><strong>Pricing &amp; Currency:</strong> Prices are displayed in Nigerian Naira (₦) and US Dollars ($). All payments are settled in Naira or equivalent through Paystack. SteezeDrip reserves the right to adjust pricing on future drops without prior notice.</li>
                <li><strong>Intellectual Property:</strong> All designs, logos, graphics, garment patterns, and lookbook photography are the exclusive intellectual property of SteezeDrip and Only1kuzzy. Unauthorized reproduction or resale is prohibited.</li>
              </ul>
            </div>
          )}

          <div style={{ marginTop: "28px", borderTop: "1px solid var(--line)", paddingTop: "18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>
              Questions? Chat with us directly on WhatsApp (+234 811 009 2995)
            </span>
            <button className="btn btn-outline btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
