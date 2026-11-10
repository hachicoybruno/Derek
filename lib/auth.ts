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
  // Cuenta (negocio) con la que trabaja: la propia (dueño) o la del dueño si es vendedor.
  const { data: ctx } = await supabase.rpc("mi_contexto");
  const contexto = (ctx ?? {}) as { cuenta_id?: string; rol?: string; ver_costos?: boolean };
  const rol: Rol = contexto.rol === "vendedor" ? "vendedor" : "dueno";
  return {
    supabase,
    userId: claims.sub,
    cuentaId: contexto.cuenta_id ?? claims.sub,
    rol,
    esDueno: rol === "dueno",
    /** Puede ver precio de compra, gastos, costos y ganancias (dueño, o vendedor si el dueño lo permite). */
    verCostos: rol === "dueno" || Boolean(contexto.ver_costos),
    email: (claims.email as string | undefined) ?? "",
  };
});

export type Rol = "dueno" | "vendedor";

/** Para acciones que solo puede hacer el dueño del negocio. */
export async function requerirDueno() {
  const sesion = await requerirUsuario();
  if (!sesion.esDueno) throw new Error("Solo el dueño del negocio puede hacer esto.");
  return sesion;
}

/** Solo acepta rutas internas para evitar redirecciones a otros sitios. */
export function rutaSegura(destino: string | null | undefined, porDefecto = "/dashboard") {
  if (!destino || !destino.startsWith("/") || destino.startsWith("//") || destino.includes("\\")) return porDefecto;
  return destino;
}
