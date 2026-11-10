/**
 * Límites por plan aplicados en la base de datos (requiere Supabase local).
 */
import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

config({ path: ".env.local", quiet: true });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publica = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secreta = process.env.SUPABASE_SECRET_KEY;

async function disponible() {
  if (!url || !publica || !secreta || !/127\.0\.0\.1|localhost/.test(url)) return false;
  try {
    return (await fetch(`${url}/auth/v1/health`, { headers: { apikey: publica } })).ok;
  } catch {
    return false;
  }
}
const hayDb = await disponible();

describe.skipIf(!hayDb)("planes en la base de datos", () => {
  let admin: SupabaseClient;
  let cliente: SupabaseClient;
  let userId: string;

  const auto = (placa: string, estado = "en_stock") => ({
    placa, marca: "Kia", modelo: "Rio", anio: 2020, estado, precio_compra: 20000, fecha_compra: "2026-10-01",
  });
  const fijarSuscripcion = (cambios: Record<string, unknown>) =>
    admin.from("suscripciones").update(cambios).eq("user_id", userId);

  beforeAll(async () => {
    admin = createClient(url!, secreta!, { auth: { persistSession: false } });
    const email = `planes-${Date.now()}@test.pe`;
    await admin.auth.admin.createUser({ email, password: "clave-123456", email_confirm: true });
    cliente = createClient(url!, publica!, { auth: { persistSession: false } });
    const { data } = await cliente.auth.signInWithPassword({ email, password: "clave-123456" });
    userId = data.user!.id;
  });

  it("al registrarse empieza una prueba Pro de 14 días", async () => {
    const { data } = await cliente.from("suscripciones").select("plan, estado, prueba_hasta").single();
    expect(data?.estado).toBe("prueba");
    const dias = (new Date(data!.prueba_hasta!).getTime() - Date.now()) / 86_400_000;
    expect(Math.round(dias)).toBe(14);
    const { data: plan } = await cliente.rpc("plan_efectivo", { uid: userId });
    expect(plan).toBe("pro");
  });

  it("no se puede consultar el plan de otro usuario", async () => {
    const otro = (await admin.auth.admin.createUser({ email: `otro-${Date.now()}@test.pe`, password: "clave-123456", email_confirm: true })).data.user!.id;
    expect((await cliente.rpc("plan_efectivo", { uid: otro })).data).toBeNull();
  });

  it("el usuario no puede modificar su propia suscripción", async () => {
    await cliente.from("suscripciones").update({ plan: "concesionario", estado: "activa" }).eq("user_id", userId);
    const { data } = await cliente.from("suscripciones").select("plan, estado").single();
    expect(data).toEqual({ plan: "pro", estado: "prueba" });
    const { error } = await cliente.from("pagos").insert({ user_id: userId, proveedor: "x", proveedor_pago_id: "1", monto: 1, moneda: "USD", estado: "completado" });
    expect(error).not.toBeNull();
  });

  it("plan Básico: máximo 5 autos en stock (los en evaluación no cuentan)", async () => {
    await fijarSuscripcion({ plan: "basico", estado: "activa", periodo_hasta: new Date(Date.now() + 864e5 * 30).toISOString() });
    for (let i = 1; i <= 4; i++) expect((await cliente.from("autos").insert(auto(`BAS10${i}`))).error).toBeNull();
    expect((await cliente.from("autos").insert(auto("BAS105", "reservado"))).error).toBeNull();
    expect((await cliente.from("autos").insert(auto("BAS106", "en_evaluacion"))).error).toBeNull();

    const sexto = await cliente.from("autos").insert(auto("BAS107"));
    expect(sexto.error?.message).toBe("LIMITE_PLAN");

    // Pasar el auto en evaluación a stock también se bloquea…
    const mover = await cliente.from("autos").update({ estado: "en_stock" }).eq("placa", "BAS106");
    expect(mover.error?.message).toBe("LIMITE_PLAN");

    // …pero al vender uno se libera un cupo.
    await cliente.from("autos").update({ estado: "vendido", precio_venta_final: 25000, fecha_venta: "2026-11-01" }).eq("placa", "BAS101");
    expect((await cliente.from("autos").update({ estado: "en_stock" }).eq("placa", "BAS106")).error).toBeNull();
  });

  it("Pro no tiene límite de stock", async () => {
    await fijarSuscripcion({ plan: "pro" });
    expect((await cliente.from("autos").insert(auto("PRO101"))).error).toBeNull();
  });

  it("sin plan vigente no se pueden agregar autos, pero sí ver y vender los existentes", async () => {
    await fijarSuscripcion({ estado: "vencida" });
    const nuevo = await cliente.from("autos").insert(auto("VEN101", "en_evaluacion"));
    expect(nuevo.error?.message).toBe("SIN_PLAN");
    expect((await cliente.from("autos").select("id")).data!.length).toBeGreaterThan(0);
    const venta = await cliente.from("autos").update({ estado: "vendido", precio_venta_final: 25000, fecha_venta: "2026-11-01" }).eq("placa", "PRO101");
    expect(venta.error).toBeNull();
  });

  it("cancelada mantiene el acceso hasta el fin del periodo pagado", async () => {
    await fijarSuscripcion({ estado: "cancelada", periodo_hasta: new Date(Date.now() + 864e5 * 3).toISOString() });
    expect((await cliente.rpc("plan_efectivo", { uid: userId })).data).toBe("pro");
    await fijarSuscripcion({ periodo_hasta: new Date(Date.now() - 864e5).toISOString() });
    expect((await cliente.rpc("plan_efectivo", { uid: userId })).data).toBeNull();
  });
});
