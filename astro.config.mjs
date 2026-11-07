// Sitio estático: Vercel lo construye con `npm run build` y publica dist/.
import { defineConfig } from "astro/config";

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || undefined,
  output: "static",
});
