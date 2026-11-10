import "server-only";
import { cache } from "react";
import { requerirUsuario } from "./auth";
import { INFO_PLANES, esPlan, type InfoPlan, type Plan } from "./planes";

export type EstadoSuscripcion = "prueba" | "activa" | "cancelada" | "suspendida" | "vencida";

export type Suscripcion = {
  estado: EstadoSuscripcion;
  /** Plan contratado (o el de la prueba). */
  plan: Plan;
  /** Plan con el que tiene acceso hoy; null = sin acceso (prueba o suscripción terminada). */
  planEfectivo: Plan | null;
  info: InfoPlan | null;
  enPrueba: boolean;
  diasRestantesPrueba: number | null;
  periodoHasta: string | null;
  proveedor: string | null;
  proveedorSuscripcionId: string | null;
};

/** Misma lógica que la función SQL plan_efectivo (ver migración de suscripciones). */
export function calcularPlanEfectivo(
  s: { estado: string; plan: string; prueba_hasta: string | null; periodo_hasta: string | null },
  ahora = new Date(),
): Plan | null {
  const t = ahora.getTime();
  const plan = esPlan(s.plan) ? s.plan : null;
  if (s.estado === "prueba") return s.prueba_hasta && new Date(s.prueba_hasta).getTime() > t ? "pro" : null;
  if (s.estado === "activa") return !s.periodo_hasta || new Date(s.periodo_hasta).getTime() > t - 5 * 86_400_000 ? plan : null;
  if (s.estado === "cancelada") return s.periodo_hasta && new Date(s.periodo_hasta).getTime() > t ? plan : null;
  return null;
}

export const obtenerSuscripcion = cache(async (): Promise<Suscripcion> => {
  const { supabase } = await requerirUsuario();
  const { data } = await supabase.from("suscripciones").select("*").maybeSingle();
  const fila = data ?? { estado: "vencida", plan: "basico", prueba_hasta: null, periodo_hasta: null, proveedor: null, proveedor_suscripcion_id: null };
  const planEfectivo = calcularPlanEfectivo(fila);
  const enPrueba = fila.estado === "prueba" && planEfectivo !== null;
  return {
    estado: fila.estado as EstadoSuscripcion,
    plan: esPlan(fila.plan) ? fila.plan : "basico",
    planEfectivo,
    info: planEfectivo ? INFO_PLANES[planEfectivo] : null,
    enPrueba,
    diasRestantesPrueba: enPrueba && fila.prueba_hasta ? Math.max(0, Math.ceil((new Date(fila.prueba_hasta).getTime() - Date.now()) / 86_400_000)) : null,
    periodoHasta: fila.periodo_hasta,
    proveedor: fila.proveedor,
    proveedorSuscripcionId: fila.proveedor_suscripcion_id,
  };
});
