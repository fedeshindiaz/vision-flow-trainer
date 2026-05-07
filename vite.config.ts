import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { readFileSync } from "node:fs";
import { VitePWA } from "vite-plugin-pwa";

const packageJson = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8")) as { version: string };

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "onur-icon.png"],
      manifest: {
        name: "ONUr - Otoneuro Uruguay Rehabilitacion",
        short_name: "ONUr",
        description: "Herramienta visual para entrenamiento vestibulo-visual.",
        theme_color: "#f4c400",
        background_color: "#f7f7f5",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "/onur-icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"],
      },
    }),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(packageJson.version),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
