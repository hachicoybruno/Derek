import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import { ejecutarAlertas } from "@/lib/alertas/ejecutar";
import { resumenAlerta, umbralPara } from "@/lib/alertas/seleccion";
import { CorreoResend, type Correo, type EnviadorCorreo } from "@/lib/notificaciones/correo";
import { limpiarParametro, normalizarCelular, WhatsappCloud, type EnviadorWhatsapp } from "@/lib/notificaciones/whatsapp";
import { sumarDias } from "@/lib/fechas";
import type { Database } from "@/lib/supabase/tipos-db";

describe("selección de avisos", () => {
  it("umbral: el menor ya alcanzado (30, 7, 1, 0)", () => {
    expect(umbralPara(31)).toBeNull();
    expect(umbralPara(30)).toBe(30);
    expect(umbralPara(12)).toBe(30);
    expect(umbralPara(7)).toBe(7);
    expect(umbralPara(5)).toBe(7);
    expect(umbralPara(1)).toBe(1);
    expect(umbralPara(0)).toBe(0);
    expect(umbralPara(-4)).toBe(0);
  });

  it("resumen en español", () => {
    const auto = { placa: "ABC123", marca: "Kia", modelo: "Rio" };
    const r = resumenAlerta(
      [
        { id: "1", tipo: "soat", fecha_vencimiento: "2026-11-17", auto },
        { id: "2", tipo: "revision_tecnica", fecha_vencimiento: "2026-11-08", auto },
      ],
      "2026-11-10",
    );
    expect(r.asunto).toBe("Aviso: 2 documentos por vencer (1 vencido)");
    expect(r.lineas[0]).toBe("Revisión técnica del Kia Rio ABC-123 venció hace 2 días (08/11/2026)");
    expect(r.lineas[1]).toBe("SOAT del Kia Rio ABC-123 vence en 7 días (17/11/2026)");
    expect(r.whatsapp).not.toContain("\n");
  });
});

describe("enviadores", () => {
  it("WhatsApp: parámetros sin saltos de línea y número peruano", () => {
    expect(limpiarParametro("a\nb\t\tc     d")).toBe("a · b · c d");
    expect(normalizarCelular("987 654 321")).toBe("+51987654321");
    expect(normalizarCelular("51987654321")).toBe("+51987654321");
    expect(normalizarCelular("+34600111222")).toBe("+34600111222");
    expect(normalizarCelular("12345")).toBeNull();
  });

  it("WhatsApp Cloud: envía la plantilla con el resumen", async () => {
    let pedido: { url: string; body: Record<string, unknown> } | undefined;
    const w = new WhatsappCloud({ token: "t", phoneNumberId: "123", plantilla: "alerta_vencimientos", idioma: "es" }, (async (url: string, init?: RequestInit) => {
      pedido = { url, body: JSON.parse(String(init?.body)) };
      return Response.json({ messages: [{ id: "x" }] });
    }) as typeof fetch);
    await w.enviarAlerta("+51987654321", "SOAT del Kia\nvence hoy");
    expect(pedido?.url).toBe("https://graph.facebook.com/v21.0/123/messages");
    expect(pedido?.body).toMatchObject({
      to: "51987654321",
      type: "template",
      template: { name: "alerta_vencimientos", language: { code: "es" }, components: [{ type: "body", parameters: [{ type: "text", text: "SOAT del Kia · vence hoy" }] }] },
    });
  });

  it("Resend: error del proveedor se propaga", async () => {
    const c = new CorreoResend("k", "FLIPDESK <a@b.pe>", (async () => new Response("mal", { status: 422 })) as typeof fetch);
    await expect(c.enviar({ para: "x@y.pe", asunto: "a", html: "<p>a</p>", texto: "a" })).rejects.toThrow("Resend 422");
  });
});

// ── Ejecución contra Supabase local ────────────────────────────────────────
config({ path: ".env.local", quiet: true });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secreta = process.env.SUPABASE_SECRET_KEY;
const hayDb = await (async () => {
  if (!url || !secreta || !/127\.0\.0\.1|localhost/.test(url)) return false;
  try { return (await fetch(`${url}/auth/v1/health`, { headers: { apikey: secreta } })).ok; } catch { return false; }
})();

describe.skipIf(!hayDb)("ejecución de alertas", () => {
  let db: SupabaseClient<Database>;
  let cuenta: string;
  const correos: Correo[] = [];
  const whatsapps: { numero: string; texto: string }[] = [];
  const correo: EnviadorCorreo = { nombre: "falso", enviar: async (c) => void correos.push(c) };
  const whatsapp: EnviadorWhatsapp = { nombre: "falso", enviarAlerta: async (numero, texto) => void whatsapps.push({ numero, texto }) };
  const hoy = "2026-11-10";
  const correr = (extra = {}) => ejecutarAlertas({ db, correo, whatsapp, hoy, urlApp: "https://app.test", cuentaId: cuenta, ...extra });

  beforeAll(async () => {
    db = createClient<Database>(url!, secreta!, { auth: { persistSession: false } });
    const email = `alertas-${Date.now()}@test.pe`;
    cuenta = (await db.auth.admin.createUser({ email, password: "clave-123456", email_confirm: true })).data.user!.id;
    await db.from("perfiles").update({ alertas_whatsapp: true, whatsapp: "+51987654321" }).eq("id", cuenta);
    const { data: autos } = await db.from("autos").insert([
      { user_id: cuenta, placa: "ALT101", marca: "Kia", modelo: "Rio", anio: 2020, estado: "en_stock", precio_compra: 1, fecha_compra: "2026-10-01" },
      { user_id: cuenta, placa: "ALT102", marca: "Toyota", modelo: "Yaris", anio: 2019, estado: "vendido", precio_compra: 1, fecha_compra: "2026-10-01", precio_venta_final: 2, fecha_venta: "2026-11-01" },
    ]).select("id, placa");
    const id = (p: string) => autos!.find((a) => a.placa === p)!.id;
    await db.from("documentos").insert([
      { user_id: cuenta, auto_id: id("ALT101"), tipo: "soat", fecha_vencimiento: sumarDias(hoy, 7) },
      { user_id: cuenta, auto_id: id("ALT101"), tipo: "revision_tecnica", fecha_vencimiento: sumarDias(hoy, 90) },
      { user_id: cuenta, auto_id: id("ALT101"), tipo: "tarjeta_propiedad", fecha_vencimiento: null },
      { user_id: cuenta, auto_id: id("ALT102"), tipo: "soat", fecha_vencimiento: sumarDias(hoy, 2) },
    ]);
  });

  it("avisa por correo y WhatsApp solo lo que corresponde (no vendidos, ≤ 30 días)", async () => {
    const [r] = await correr();
    expect(r.enviados.sort()).toEqual(["email", "whatsapp"]);
    expect(correos).toHaveLength(1);
    expect(correos[0].para).toMatch(/^alertas-/);
    expect(correos[0].texto).toContain("SOAT del Kia Rio ALT-101 vence en 7 días");
    expect(correos[0].texto).not.toContain("Yaris");
    expect(whatsapps[0]).toEqual({ numero: "+51987654321", texto: "SOAT del Kia Rio ALT-101 vence en 7 días (17/11/2026)" });
  });

  it("no repite el mismo aviso", async () => {
    const [r] = await correr();
    expect(r.enviados).toEqual([]);
    expect(r.omitidos).toContain("email: ya avisado");
    expect(correos).toHaveLength(1);
  });

  it("vuelve a avisar al llegar al siguiente umbral", async () => {
    const [r] = await correr({ hoy: sumarDias(hoy, 6) }); // falta 1 día
    expect(r.enviados.sort()).toEqual(["email", "whatsapp"]);
    expect(correos.at(-1)?.texto).toContain("vence mañana");
  });

  it("el aviso de prueba ignora el registro", async () => {
    const [r] = await correr({ forzar: true });
    expect(r.enviados.length).toBe(2);
  });

  it("sin plan con alertas no envía", async () => {
    await db.from("suscripciones").update({ plan: "basico", estado: "activa", periodo_hasta: null }).eq("user_id", cuenta);
    const [r] = await correr({ forzar: true });
    expect(r.omitidos).toEqual(["plan sin alertas"]);
  });

  it("sin proveedor configurado lo informa", async () => {
    await db.from("suscripciones").update({ plan: "pro" }).eq("user_id", cuenta);
    const [r] = await ejecutarAlertas({ db, correo: null, whatsapp: null, hoy, urlApp: "x", cuentaId: cuenta, forzar: true });
    expect(r.omitidos).toEqual(["email: proveedor no configurado", "whatsapp: proveedor no configurado"]);
  });
});
