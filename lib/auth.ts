import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "./supabase/server";

/**
 * Devuelve el cliente de Supabase y el usuario actual, o redirige a /login.
 * `cache` evita repetir la validación dentro de la misma petición.
 */
export const requerirUsuario = cache(async () => {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/login");
  return { supabase, userId: claims.sub, email: (claims.email as string | undefined) ?? "" };
});

/** Solo acepta rutas internas para evitar redirecciones a otros sitios. */
export function rutaSegura(destino: string | null | undefined, porDefecto = "/dashboard") {
  if (!destino || !destino.startsWith("/") || destino.startsWith("//") || destino.includes("\\")) return porDefecto;
  return destino;
}
