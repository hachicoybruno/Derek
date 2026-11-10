/**
 * Catálogo de planes. Los límites también se validan en la base de datos
 * (supabase/migrations/20261112000000_suscripciones.sql): mantener sincronizados.
 */

export const PLANES = ["basico", "pro", "concesionario"] as const;
export type Plan = (typeof PLANES)[number];

export const DIAS_PRUEBA = 14;
export const LIMITE_STOCK_BASICO = 5;

export type InfoPlan = {
  id: Plan;
  nombre: string;
  /** Precio de referencia en soles (lo que ve el usuario). */
  precioSoles: number;
  /** Precio que se cobra en PayPal (PayPal no opera en soles). Debe coincidir con el plan creado en PayPal. */
  precioUsd: number;
  descripcion: string;
  limiteStock: number | null;
  alertas: boolean;
  dashboardCompleto: boolean;
  usuarios: number;
  caracteristicas: string[];
  destacado?: boolean;
};

export const INFO_PLANES: Record<Plan, InfoPlan> = {
  basico: {
    id: "basico",
    nombre: "Básico",
    precioSoles: 49,
    precioUsd: 13,
    descripcion: "Para empezar a ordenar tus autos.",
    limiteStock: LIMITE_STOCK_BASICO,
    alertas: false,
    dashboardCompleto: false,
    usuarios: 1,
    caracteristicas: [
      `Hasta ${LIMITE_STOCK_BASICO} autos en stock`,
      "Ganancia real por auto",
      "Calculadora ¿lo compro?",
      "Fotos, gastos y documentos",
      "Contratos y recibos en PDF",
      "Anuncios y Excel",
    ],
  },
  pro: {
    id: "pro",
    nombre: "Pro",
    precioSoles: 119,
    precioUsd: 32,
    descripcion: "Para el revendedor que mueve varios autos al mes.",
    limiteStock: null,
    alertas: true,
    dashboardCompleto: true,
    usuarios: 1,
    destacado: true,
    caracteristicas: [
      "Autos ilimitados",
      "Todo lo del plan Básico",
      "Alertas de SOAT y revisión técnica",
      "Dashboard completo: capital inmovilizado, días en stock y margen por modelo",
    ],
  },
  concesionario: {
    id: "concesionario",
    nombre: "Concesionario",
    precioSoles: 249,
    precioUsd: 67,
    descripcion: "Para negocios con equipo de vendedores.",
    limiteStock: null,
    alertas: true,
    dashboardCompleto: true,
    usuarios: 5,
    caracteristicas: ["Todo lo del plan Pro", "Varios usuarios (dueño y vendedores)", "Soporte prioritario por WhatsApp"],
  },
};

export function esPlan(v: unknown): v is Plan {
  return typeof v === "string" && (PLANES as readonly string[]).includes(v);
}

/** Mensajes para los errores que lanza la base de datos al aplicar límites. */
export function mensajeLimitePlan(mensajeBD: string | undefined): string | null {
  if (!mensajeBD) return null;
  if (mensajeBD.includes("LIMITE_PLAN"))
    return `Tu plan Básico permite hasta ${LIMITE_STOCK_BASICO} autos en stock. Vende uno o pásate a Pro para tener autos ilimitados.`;
  if (mensajeBD.includes("SIN_PLAN"))
    return "Tu prueba gratis o tu suscripción terminó. Elige un plan para seguir agregando autos. Tus datos siguen guardados.";
  return null;
}
