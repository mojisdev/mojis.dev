// @ts-check
import react from '@astrojs/react';
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: "https://mojis.dev",
  integrations: [
    react(),
    sitemap()
  ],
  vite: {
    plugins: [
      tailwindcss()
    ]
  },
});
