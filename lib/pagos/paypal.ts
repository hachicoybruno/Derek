/**
 * PayPal Subscriptions (API REST v1). Cobra en US$: PayPal no opera en soles (PEN).
 * El navegador muestra los botones "PayPal" y "Tarjeta de débito o crédito" del SDK de PayPal.
 * Documentación: https://developer.paypal.com/docs/subscriptions/
 */
import { esPlan, type Plan } from "../planes";
import type { EstadoExterno, EventoPago, ProveedorPagos, ResultadoWebhook, SuscripcionExterna } from "./tipos";

export type ConfigPaypal = {
  clientId: string;
  secret: string;
  webhookId?: string;
  entorno: "sandbox" | "live";
  planes: Partial<Record<Plan, string>>;
};

export function configPaypalDesdeEnv(env = process.env): ConfigPaypal | null {
  const clientId = env.PAYPAL_CLIENT_ID ?? env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) return null;
  return {
    clientId,
    secret,
    webhookId: env.PAYPAL_WEBHOOK_ID,
    entorno: env.PAYPAL_ENTORNO === "live" ? "live" : "sandbox",
    planes: {
      basico: env.PAYPAL_PLAN_BASICO || undefined,
      pro: env.PAYPAL_PLAN_PRO || undefined,
      concesionario: env.PAYPAL_PLAN_CONCESIONARIO || undefined,
    },
  };
}

const ESTADOS: Record<string, EstadoExterno> = {
  APPROVAL_PENDING: "pendiente",
  APPROVED: "activa",
  ACTIVE: "activa",
  SUSPENDED: "suspendida",
  CANCELLED: "cancelada",
  EXPIRED: "vencida",
};

type SuscripcionPaypal = {
  id: string;
  status: string;
  plan_id: string;
  custom_id?: string;
  billing_info?: { next_billing_time?: string; last_payment?: { time?: string } };
};

export function normalizarSuscripcion(s: SuscripcionPaypal, planes: ConfigPaypal["planes"]): SuscripcionExterna {
  const plan = (Object.entries(planes).find(([, id]) => id === s.plan_id)?.[0] ?? null) as Plan | null;
  return {
    id: s.id,
    proveedor: "paypal",
    estado: ESTADOS[s.status] ?? "pendiente",
    plan: esPlan(plan) ? plan : null,
    usuarioId: s.custom_id ?? null,
    periodoHasta: s.billing_info?.next_billing_time ?? null,
  };
}

type EventoPaypal = {
  id: string;
  event_type: string;
  resource: Record<string, unknown> & {
    id?: string;
    custom_id?: string;
    custom?: string;
    billing_agreement_id?: string;
    sale_id?: string;
    amount?: { total?: string; currency?: string; value?: string; currency_code?: string };
  };
};

export function normalizarEvento(e: EventoPaypal): EventoPago | null {
  const r = e.resource ?? {};
  if (e.event_type.startsWith("BILLING.SUBSCRIPTION.") && r.id) {
    return { id: e.id, tipo: "suscripcion", suscripcionId: r.id, usuarioId: r.custom_id ?? null };
  }
  const monto = Number(r.amount?.total ?? r.amount?.value ?? 0);
  const moneda = r.amount?.currency ?? r.amount?.currency_code ?? "USD";
  if (e.event_type === "PAYMENT.SALE.COMPLETED" && r.id) {
    return {
      id: e.id, tipo: "pago", estado: "completado", pagoId: r.id, suscripcionId: r.billing_agreement_id ?? null,
      monto, moneda, usuarioId: r.custom ?? null,
    };
  }
  if ((e.event_type === "PAYMENT.SALE.REFUNDED" || e.event_type === "PAYMENT.SALE.REVERSED") && (r.sale_id || r.id)) {
    return {
      id: e.id, tipo: "pago", estado: "reembolsado", pagoId: r.sale_id ?? r.id!, suscripcionId: r.billing_agreement_id ?? null,
      monto: Math.abs(monto), moneda, usuarioId: null,
    };
  }
  return null;
}

export class ProveedorPaypal implements ProveedorPagos {
  readonly id = "paypal" as const;
  private token: { valor: string; vence: number } | null = null;

  constructor(
    private readonly config: ConfigPaypal,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  private get base() {
    return this.config.entorno === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  }

  private async accessToken() {
    if (this.token && this.token.vence > Date.now() + 60_000) return this.token.valor;
    const credenciales = Buffer.from(`${this.config.clientId}:${this.config.secret}`).toString("base64");
    const r = await this.fetcher(`${this.base}/v1/oauth2/token`, {
      method: "POST",
      headers: { Authorization: `Basic ${credenciales}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`PayPal: no se pudo autenticar (${r.status})`);
    const json = (await r.json()) as { access_token: string; expires_in: number };
    this.token = { valor: json.access_token, vence: Date.now() + json.expires_in * 1000 };
    return json.access_token;
  }

  private async api<T>(ruta: string, init: RequestInit = {}): Promise<T> {
    const r = await this.fetcher(`${this.base}${ruta}`, {
      ...init,
      headers: { Authorization: `Bearer ${await this.accessToken()}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`PayPal ${init.method ?? "GET"} ${ruta}: ${r.status} ${await r.text().catch(() => "")}`);
    return (r.status === 204 ? undefined : await r.json()) as T;
  }

  async obtenerSuscripcion(id: string) {
    if (!/^I-[A-Z0-9]{6,30}$/.test(id)) throw new Error("Id de suscripción de PayPal inválido.");
    return normalizarSuscripcion(await this.api<SuscripcionPaypal>(`/v1/billing/subscriptions/${id}`), this.config.planes);
  }

  async cancelar(id: string, motivo: string) {
    await this.api(`/v1/billing/subscriptions/${id}/cancel`, { method: "POST", body: JSON.stringify({ reason: motivo.slice(0, 120) }) });
  }

  async verificarWebhook(headers: Headers, cuerpo: string): Promise<ResultadoWebhook> {
    if (!this.config.webhookId) throw new Error("Falta PAYPAL_WEBHOOK_ID.");
    let evento: EventoPaypal;
    try {
      evento = JSON.parse(cuerpo);
    } catch {
      return { valido: false, evento: null };
    }
    const h = (k: string) => headers.get(k) ?? "";
    const verificacion = await this.api<{ verification_status: string }>("/v1/notifications/verify-webhook-signature", {
      method: "POST",
      body: JSON.stringify({
        auth_algo: h("paypal-auth-algo"),
        cert_url: h("paypal-cert-url"),
        transmission_id: h("paypal-transmission-id"),
        transmission_sig: h("paypal-transmission-sig"),
        transmission_time: h("paypal-transmission-time"),
        webhook_id: this.config.webhookId,
        webhook_event: evento,
      }),
    });
    if (verificacion.verification_status !== "SUCCESS") return { valido: false, evento: null };
    return { valido: true, evento: normalizarEvento(evento) };
  }
}
