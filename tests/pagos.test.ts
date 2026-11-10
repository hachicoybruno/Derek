import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import { normalizarEvento, normalizarSuscripcion, ProveedorPaypal } from "@/lib/pagos/paypal";
import { aplicarSuscripcion, procesarEvento } from "@/lib/pagos/servicio";
import type { ProveedorPagos, SuscripcionExterna } from "@/lib/pagos/tipos";
import type { Database } from "@/lib/supabase/tipos-db";

const planes = { basico: "P-BASICO", pro: "P-PRO", concesionario: "P-CONC" };

describe("PayPal: normalización", () => {
  it("traduce el estado y el plan de una suscripción", () => {
    const s = normalizarSuscripcion(
      { id: "I-ABC123456", status: "ACTIVE", plan_id: "P-PRO", custom_id: "u1", billing_info: { next_billing_time: "2026-12-10T10:00:00Z" } },
      planes,
    );
    expect(s).toEqual({ id: "I-ABC123456", proveedor: "paypal", estado: "activa", plan: "pro", usuarioId: "u1", periodoHasta: "2026-12-10T10:00:00Z" });
    expect(normalizarSuscripcion({ id: "I-X", status: "SUSPENDED", plan_id: "P-OTRO" }, planes)).toMatchObject({ estado: "suspendida", plan: null });
  });

  it("traduce eventos de webhook", () => {
    expect(normalizarEvento({ id: "WH-1", event_type: "BILLING.SUBSCRIPTION.CANCELLED", resource: { id: "I-ABC", custom_id: "u1" } }))
      .toEqual({ id: "WH-1", tipo: "suscripcion", suscripcionId: "I-ABC", usuarioId: "u1" });
    expect(normalizarEvento({
      id: "WH-2", event_type: "PAYMENT.SALE.COMPLETED",
      resource: { id: "SALE-1", billing_agreement_id: "I-ABC", amount: { total: "32.00", currency: "USD" } },
    })).toEqual({ id: "WH-2", tipo: "pago", estado: "completado", pagoId: "SALE-1", suscripcionId: "I-ABC", monto: 32, moneda: "USD", usuarioId: null });
    expect(normalizarEvento({ id: "WH-3", event_type: "CHECKOUT.ORDER.APPROVED", resource: {} })).toBeNull();
  });

  it("verifica la firma del webhook con la API de PayPal", async () => {
    const llamadas: string[] = [];
    const fetchFalso = (async (url: string, init?: RequestInit) => {
      llamadas.push(String(url));
      if (String(url).endsWith("/v1/oauth2/token")) return Response.json({ access_token: "tok", expires_in: 3600 });
      const body = JSON.parse(String(init?.body));
      return Response.json({ verification_status: body.transmission_sig === "firma-buena" ? "SUCCESS" : "FAILURE" });
    }) as typeof fetch;
    const p = new ProveedorPaypal({ clientId: "c", secret: "s", webhookId: "WH", entorno: "sandbox", planes }, fetchFalso);
    const cuerpo = JSON.stringify({ id: "WH-9", event_type: "BILLING.SUBSCRIPTION.ACTIVATED", resource: { id: "I-ABC" } });

    const bueno = await p.verificarWebhook(new Headers({ "paypal-transmission-sig": "firma-buena" }), cuerpo);
    expect(bueno.valido).toBe(true);
    expect(bueno.evento?.tipo).toBe("suscripcion");
    const malo = await p.verificarWebhook(new Headers({ "paypal-transmission-sig": "falsa" }), cuerpo);
    expect(malo).toEqual({ valido: false, evento: null });
    expect(llamadas.filter((u) => u.includes("oauth2")).length).toBe(1); // token reutilizado
    expect(llamadas[0]).toContain("api-m.sandbox.paypal.com");
  });

  it("rechaza ids de suscripción con formato inválido", async () => {
    const p = new ProveedorPaypal({ clientId: "c", secret: "s", entorno: "sandbox", planes }, (async () => Response.json({})) as typeof fetch);
    await expect(p.obtenerSuscripcion("../../v1/otra-cosa")).rejects.toThrow("inválido");
  });
});

// ── Servicio contra Supabase local ─────────────────────────────────────────
config({ path: ".env.local", quiet: true });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secreta = process.env.SUPABASE_SECRET_KEY;
const hayDb = await (async () => {
  if (!url || !secreta || !/127\.0\.0\.1|localhost/.test(url)) return false;
  try { return (await fetch(`${url}/auth/v1/health`, { headers: { apikey: secreta } })).ok; } catch { return false; }
})();

class ProveedorFalso implements ProveedorPagos {
  readonly id = "paypal" as const;
  estados = new Map<string, SuscripcionExterna>();
  canceladas: string[] = [];
  async obtenerSuscripcion(id: string) {
    const s = this.estados.get(id);
    if (!s) throw new Error("no existe");
    return s;
  }
  async cancelar(id: string) { this.canceladas.push(id); }
  async verificarWebhook() { return { valido: true, evento: null }; }
}

describe.skipIf(!hayDb)("servicio de suscripciones", () => {
  let db: SupabaseClient<Database>;
  let userId: string;
  const falso = new ProveedorFalso();
  // Ids únicos por corrida: la columna proveedor_suscripcion_id es única en la base.
  const run = Date.now().toString(36).toUpperCase();
  const PRIMERA = `I-PRIMERA${run}`;
  const SEGUNDA = `I-SEGUNDA${run}`;
  const deps = () => ({ db, proveedor: () => falso });
  const ext = (id: string, cambios: Partial<SuscripcionExterna> = {}): SuscripcionExterna => ({
    id, proveedor: "paypal", estado: "activa", plan: "pro", usuarioId: userId, periodoHasta: "2026-12-10T00:00:00Z", ...cambios,
  });
  const fila = async () => (await db.from("suscripciones").select("*").eq("user_id", userId).single()).data!;

  beforeAll(async () => {
    db = createClient<Database>(url!, secreta!, { auth: { persistSession: false } });
    userId = (await db.auth.admin.createUser({ email: `pagos-${Date.now()}@test.pe`, password: "clave-123456", email_confirm: true })).data.user!.id;
  });

  it("activa la suscripción y conserva la fecha de fin de prueba", async () => {
    await aplicarSuscripcion(deps(), userId, ext(PRIMERA));
    const f = await fila();
    expect(f).toMatchObject({ estado: "activa", plan: "pro", proveedor: "paypal", proveedor_suscripcion_id: PRIMERA });
    expect(f.prueba_hasta).not.toBeNull();
  });

  it("un webhook de pago registra el cobro y es idempotente", async () => {
    falso.estados.set(PRIMERA, ext(PRIMERA, { periodoHasta: "2027-01-10T00:00:00Z" }));
    const evento = { id: `WH-${Date.now()}`, tipo: "pago" as const, estado: "completado" as const, pagoId: `SALE-${Date.now()}`, suscripcionId: PRIMERA, monto: 32, moneda: "USD", usuarioId: null };
    expect((await procesarEvento(deps(), "paypal", evento, {})).resultado).toBe("ok");
    expect((await procesarEvento(deps(), "paypal", evento, {})).resultado).toBe("duplicado");
    const { data: pagos } = await db.from("pagos").select("monto, plan").eq("user_id", userId);
    expect(pagos).toEqual([{ monto: 32, plan: "pro" }]);
    expect((await fila()).periodo_hasta).toContain("2027-01-10");
  });

  it("cambio de plan: cancela la suscripción anterior e ignora sus eventos tardíos", async () => {
    await aplicarSuscripcion(deps(), userId, ext(SEGUNDA, { plan: "concesionario" }));
    expect(falso.canceladas).toContain(PRIMERA);
    expect((await fila()).plan).toBe("concesionario");

    falso.estados.set(PRIMERA, ext(PRIMERA, { estado: "cancelada" }));
    await procesarEvento(deps(), "paypal", { id: `WH-c-${Date.now()}`, tipo: "suscripcion", suscripcionId: PRIMERA, usuarioId: userId }, {});
    expect(await fila()).toMatchObject({ estado: "activa", proveedor_suscripcion_id: SEGUNDA });
  });

  it("cancelación de la suscripción vigente conserva el fin del periodo pagado", async () => {
    falso.estados.set(SEGUNDA, ext(SEGUNDA, { estado: "cancelada", periodoHasta: null, plan: "concesionario" }));
    await procesarEvento(deps(), "paypal", { id: `WH-d-${Date.now()}`, tipo: "suscripcion", suscripcionId: SEGUNDA, usuarioId: null }, {});
    const f = await fila();
    expect(f.estado).toBe("cancelada");
    expect(f.periodo_hasta).toContain("2026-12-10");
  });

  it("si el procesamiento falla, el evento se puede reintentar", async () => {
    const evento = { id: `WH-e-${Date.now()}`, tipo: "suscripcion" as const, suscripcionId: "I-NO-EXISTE", usuarioId: null };
    await expect(procesarEvento(deps(), "paypal", evento, {})).rejects.toThrow();
    const { data } = await db.from("eventos_pago").select("id").eq("id", `paypal:${evento.id}`);
    expect(data).toEqual([]);
  });
});
