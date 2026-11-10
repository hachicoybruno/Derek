import type { Metadata, Viewport } from "next";
import { RegistrarServiceWorker } from "@/components/registrar-sw";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FLIPDESK — Gestión para revendedores de autos",
    template: "%s · FLIPDESK",
  },
  description:
    "Descubre cuánto ganas de verdad con cada auto. Stock, gastos, documentos y ganancias en un solo lugar.",
  applicationName: "FLIPDESK",
  appleWebApp: { capable: true, title: "FLIPDESK", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#1c41b8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-PE" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
