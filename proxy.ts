import type { NextRequest } from "next/server";
import { actualizarSesion } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return actualizarSesion(request);
}

export const config = {
  matcher: [
    // Todo menos archivos estáticos, imágenes, íconos, manifest y service worker.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|iconos/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
