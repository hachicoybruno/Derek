/**
 * Contrato común de los proveedores de pago. Para agregar otro (Culqi, Mercado Pago, Stripe…)
 * basta con implementar ProveedorPagos y registrarlo en lib/pagos/index.ts.
 */
import type { Plan } from "../planes";

export type ProveedorId = "paypal" | "simulado";

export type EstadoExterno = "pendiente" | "activa" | "suspendida" | "cancelada" | "vencida";

export type SuscripcionExterna = {
  id: string;
  proveedor: ProveedorId;
  estado: EstadoExterno;
  plan: Plan | null;
  /** Usuario de FLIPDESK que creó la suscripción (custom_id en PayPal). */
  usuarioId: string | null;
  /** Fecha del próximo cobro / fin del periodo pagado (ISO). */
  periodoHasta: string | null;
};

export type EventoPago =
  | { id: string; tipo: "suscripcion"; suscripcionId: string; usuarioId: string | null }
  | {
      id: string;
      tipo: "pago";
      estado: "completado" | "fallido" | "reembolsado";
      pagoId: string;
      suscripcionId: string | null;
      monto: number;
      moneda: string;
      usuarioId: string | null;
    };

export type ResultadoWebhook = { valido: boolean; evento: EventoPago | null };

export interface ProveedorPagos {
  readonly id: ProveedorId;
  obtenerSuscripcion(id: string): Promise<SuscripcionExterna>;
  cancelar(id: string, motivo: string): Promise<void>;
  /** Verifica la firma del webhook y lo traduce a un evento común (null = evento que no nos interesa). */
  verificarWebhook(headers: Headers, cuerpo: string): Promise<ResultadoWebhook>;
}

/** Datos que necesita el navegador para mostrar los botones de pago. */
export type ConfigPagoCliente =
  | { proveedor: "paypal"; clientId: string; planes: Partial<Record<Plan, string>> }
  | { proveedor: "simulado" };
