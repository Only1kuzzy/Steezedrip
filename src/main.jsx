import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("SteezeDrip App Error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px 20px", textAlign: "center", fontFamily: "sans-serif", background: "#0a0a0a", color: "#f5f5f5", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <h2 style={{ fontSize: "1.8rem", marginBottom: "1rem", color: "#e5a93c" }}>SteezeDrip</h2>
          <p style={{ maxWidth: "480px", color: "#aaa", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            Something went wrong while rendering the catalog. Please check your Google Sheet formatting or reload the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "10px 24px", background: "#e5a93c", color: "#000", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

