import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
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
  },
});
