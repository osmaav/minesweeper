import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Base path для GitHub Pages
  // При деплое на https://<USERNAME>.github.io/<REPO>/ используйте '/<REPO>/'
  // При деплое на https://<USERNAME>.github.io/ или custom domain используйте '/'
  base: process.env.NODE_ENV === 'production' ? '/minesweeper/' : '/',
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    hmr: {
      port: 3000,
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
