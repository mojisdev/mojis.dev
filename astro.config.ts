// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import buildMeta from "unplugin-build-meta/astro";
import icon from "astro-icon";

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
        default: "https://api.mojis.dev"
      }
    }
  },
  vite: {
    plugins: [
      tailwindcss()
    ],
  },
});
