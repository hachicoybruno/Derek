import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "./env";

const RUTAS_PRIVADAS = ["/dashboard", "/autos", "/calculadora", "/vencimientos", "/ajustes", "/plantillas", "/suscripcion", "/equipo"];
const RUTAS_AUTH = ["/login", "/registro"];

function empiezaCon(path: string, rutas: string[]) {
  return rutas.some((r) => path === r || path.startsWith(`${r}/`));
}

/** Refresca la sesión de Supabase y protege las rutas privadas. */
export async function actualizarSesion(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = supabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // No poner código entre createServerClient y getClaims(): refresca el token.
  const { data } = await supabase.auth.getClaims();
  const conSesion = Boolean(data?.claims?.sub);
  const path = request.nextUrl.pathname;

  const redirigir = (destino: string, conRetorno = false) => {
    const url = request.nextUrl.clone();
    url.pathname = destino;
    url.search = conRetorno ? `?siguiente=${encodeURIComponent(path + request.nextUrl.search)}` : "";
    const r = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  };

  if (!conSesion && empiezaCon(path, RUTAS_PRIVADAS)) return redirigir("/login", true);
  if (conSesion && empiezaCon(path, RUTAS_AUTH)) {
    const siguiente = request.nextUrl.searchParams.get("siguiente");
    const destino = siguiente && siguiente.startsWith("/") && !siguiente.startsWith("//") ? siguiente.split("?")[0] : "/dashboard";
    return redirigir(destino);
  }

  return response;
}
