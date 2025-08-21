// @ts-check
import luxass from "@luxass/eslint-config";

export default luxass({
  astro: true,
  formatters: true,
}, {
  ignores: [
    "**/vercel.json",
    "worker-configuration.d.ts"
  ],
});
