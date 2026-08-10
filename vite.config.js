import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    exclude: ["maplibre-gl"]
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true
  }
});