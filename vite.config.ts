import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { buildWallexJsonLd } from "./src/constants/seo";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "wallex-seo-jsonld",
      transformIndexHtml(html) {
        const jsonLd = JSON.stringify(buildWallexJsonLd());
        return html.replace(
          /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
          `<script type="application/ld+json">${jsonLd}</script>`
        );
      },
    },
  ],
});
