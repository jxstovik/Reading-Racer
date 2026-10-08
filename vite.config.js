import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { offlinePlugin } from "./scripts/offline-plugin.mjs";

export default defineConfig({
  plugins: [react(), tailwindcss(), offlinePlugin()],
  server: {
    host: true, // listen on 0.0.0.0 so phones on the same Wi-Fi can connect (see README "Run from Phone")
    port: 5173,
    strictPort: false,
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: false,
  },
});
