import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

import react from "@astrojs/react";

import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "server",
  trailingSlash: "always",
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
      persist: {
        path: "../../.wrangler/state/v3",
      },
    },
  }),

  security: {
    checkOrigin: false,
  },

  vite: {
    optimizeDeps: {
      include: ["@flarekit/database"],
    },

    plugins: [tailwindcss()],
  },

  integrations: [react()],
});
