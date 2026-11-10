/**
 * Proveedor de pagos SIMULADO para desarrollo y demos: aprueba todo sin cobrar.
 * Solo se habilita fuera de producción o con PAGOS_PERMITIR_SIMULADO=true.
 * Formato del id: sim_{plan}_{userId}
 */
import { esPlan } from "../planes";
import type { ProveedorPagos, ResultadoWebhook, SuscripcionExterna } from "./tipos";

export class ProveedorSimulado implements ProveedorPagos {
  readonly id = "simulado" as const;

  async obtenerSuscripcion(id: string): Promise<SuscripcionExterna> {
    const m = /^sim_([a-z]+)_([0-9a-f-]{36})$/.exec(id);
    if (!m || !esPlan(m[1])) throw new Error("Id de suscripción simulada inválido.");
    return {
      id,
      proveedor: "simulado",
      estado: "activa",
      plan: m[1],
      usuarioId: m[2],
      periodoHasta: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    };
  }

  async cancelar() {}

  async verificarWebhook(): Promise<ResultadoWebhook> {
    return { valido: false, evento: null };
  }
}
