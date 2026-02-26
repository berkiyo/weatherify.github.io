import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Adjusted for GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: "/weather/",
});