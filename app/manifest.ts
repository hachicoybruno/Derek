import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FLIPDESK — Gestión para revendedores de autos",
    short_name: "FLIPDESK",
    description: "Stock, gastos, documentos y ganancias reales de tus autos usados.",
    lang: "es-PE",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#1c41b8",
    categories: ["business", "finance", "productivity"],
    icons: [
      { src: "/iconos/icono-192.png", sizes: "192x192", type: "image/png" },
      { src: "/iconos/icono-512.png", sizes: "512x512", type: "image/png" },
      { src: "/iconos/icono-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Nuevo auto", url: "/autos/nuevo", icons: [{ src: "/iconos/icono-192.png", sizes: "192x192" }] },
      { name: "¿Lo compro?", url: "/calculadora", icons: [{ src: "/iconos/icono-192.png", sizes: "192x192" }] },
    ],
  };
}
