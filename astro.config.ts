import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
// @ts-check
import { defineConfig } from "astro/config";
import buildMeta from "unplugin-build-meta/astro";

// https://astro.build/config
export default defineConfig({
  site: "https://mojis.dev",
  integrations: [
    react(),
    sitemap(),
    icon(),
    buildMeta({}),
  ],
  env: {
    validateSecrets: true,
    schema: {
      API_URL: {
        type: "string",
        access: "public",
        context: "client",
        default: "https://api.mojis.dev",
      },
    },
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  trailingSlash: "never",
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
      configPath: "./wrangler.jsonc",
    },
    imageService: "cloudflare",
  }),
  output: "server",
});
