import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// SteezeDrip Production Configuration
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"]
        }
      }
    }
  },
  server: {
    port: 5173
  }
});

