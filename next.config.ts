import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components desactivado: casi todas las páginas dependen del usuario
  // (sesión en cookies), así que el renderizado dinámico clásico es más simple.
  // Ver DECISIONES.md.
  cacheComponents: false,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
