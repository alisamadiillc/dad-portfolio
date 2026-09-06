import cmsBridge from "@alisamadiillc/cms-bridge/astro";
// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://mohammadsamadi.com",
  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [cmsBridge()],
});
