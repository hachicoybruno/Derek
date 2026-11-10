import "server-only";
import { configPaypalDesdeEnv, ProveedorPaypal } from "./paypal";
import { ProveedorSimulado } from "./simulado";
import type { ConfigPagoCliente, ProveedorId, ProveedorPagos } from "./tipos";

export * from "./tipos";

export function simuladoPermitido() {
  return process.env.NODE_ENV !== "production" || process.env.PAGOS_PERMITIR_SIMULADO === "true";
}

/** Proveedor activo: PAGOS_PROVEEDOR o, por defecto, PayPal si está configurado y si no el simulado (solo en desarrollo). */
export function proveedorActivo(): ProveedorPagos | null {
  const elegido = process.env.PAGOS_PROVEEDOR as ProveedorId | undefined;
  const paypal = configPaypalDesdeEnv();
  if ((elegido === "paypal" || !elegido) && paypal) return new ProveedorPaypal(paypal);
  if ((elegido === "simulado" || !elegido) && simuladoPermitido()) return new ProveedorSimulado();
  return null;
}

/** Proveedor con el que se creó una suscripción existente (para cancelarla o consultarla). */
export function proveedorPorId(id: string | null): ProveedorPagos | null {
  if (id === "paypal") {
    const paypal = configPaypalDesdeEnv();
    return paypal ? new ProveedorPaypal(paypal) : null;
  }
  if (id === "simulado") return new ProveedorSimulado();
  return null;
}

export function configPagoCliente(): ConfigPagoCliente | null {
  const p = proveedorActivo();
  if (!p) return null;
  if (p.id === "simulado") return { proveedor: "simulado" };
  const cfg = configPaypalDesdeEnv()!;
  return { proveedor: "paypal", clientId: cfg.clientId, planes: cfg.planes };
}
