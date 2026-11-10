/**
 * Tests de aislamiento entre usuarios (Row Level Security + storage).
 * Requieren Supabase local activo (`npm run db:start`) y `.env.local`.
 * Si no hay Supabase disponible, se omiten.
 */
import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

config({ path: ".env.local", quiet: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publica = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secreta = process.env.SUPABASE_SECRET_KEY;

async function supabaseDisponible() {
  if (!url || !publica || !secreta) return false;
  if (!url.includes("127.0.0.1") && !url.includes("localhost")) return false; // nunca contra producción
  try {
    const r = await fetch(`${url}/auth/v1/health`, { headers: { apikey: publica } });
    return r.ok;
  } catch {
    return false;
  }
}

const disponible = await supabaseDisponible();

async function crearUsuario(admin: SupabaseClient, email: string) {
  const password = "clave-de-prueba-123";
  await admin.auth.admin.createUser({ email, password, email_confirm: true });
  const cliente = createClient(url!, publica!, { auth: { persistSession: false } });
  const { data, error } = await cliente.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { cliente, id: data.user!.id };
}

describe.skipIf(!disponible)("RLS: cada usuario ve solo sus datos", () => {
  let a: { cliente: SupabaseClient; id: string };
  let b: { cliente: SupabaseClient; id: string };
  let autoDeA: string;

  beforeAll(async () => {
    const admin = createClient(url!, secreta!, { auth: { persistSession: false } });
    const sufijo = Date.now();
    a = await crearUsuario(admin, `rls-a-${sufijo}@test.pe`);
    b = await crearUsuario(admin, `rls-b-${sufijo}@test.pe`);

    const { data, error } = await a.cliente
      .from("autos")
      .insert({ placa: "abc-123", marca: "Toyota", modelo: "Yaris", anio: 2018, precio_compra: 30000, fecha_compra: "2026-10-01" })
      .select("id, placa")
      .single();
    if (error) throw error;
    autoDeA = data.id;
    expect(data.placa).toBe("ABC123"); // placa normalizada
    await a.cliente.from("gastos").insert({ auto_id: autoDeA, categoria: "pintura", monto: 800 });
  });

  it("el perfil se crea al registrarse", async () => {
    const { data } = await a.cliente.from("perfiles").select("umbral_verde, umbral_amarillo").single();
    expect(Number(data?.umbral_verde)).toBe(15);
    expect(Number(data?.umbral_amarillo)).toBe(8);
  });

  it("A ve su auto y el total de gastos en la vista", async () => {
    const { data } = await a.cliente.from("autos_resumen").select("id, total_gastos");
    expect(data).toHaveLength(1);
    expect(Number(data![0].total_gastos)).toBe(800);
  });

  it("B no ve los autos, gastos ni el resumen de A", async () => {
    const autos = await b.cliente.from("autos").select("id");
    const resumen = await b.cliente.from("autos_resumen").select("id");
    const gastos = await b.cliente.from("gastos").select("id");
    expect(autos.data).toEqual([]);
    expect(resumen.data).toEqual([]);
    expect(gastos.data).toEqual([]);
  });

  it("B no puede modificar ni borrar el auto de A", async () => {
    await b.cliente.from("autos").update({ precio_compra: 1 }).eq("id", autoDeA);
    await b.cliente.from("autos").delete().eq("id", autoDeA);
    const { data } = await a.cliente.from("autos").select("precio_compra").eq("id", autoDeA).single();
    expect(Number(data?.precio_compra)).toBe(30000);
  });

  it("B no puede agregar gastos al auto de A", async () => {
    const { error } = await b.cliente.from("gastos").insert({ auto_id: autoDeA, categoria: "otro", monto: 10 });
    expect(error).not.toBeNull();
  });

  it("B no puede crear registros a nombre de A", async () => {
    const { error } = await b.cliente
      .from("autos")
      .insert({ user_id: a.id, placa: "XYZ999", marca: "Kia", modelo: "Rio", anio: 2020 });
    expect(error).not.toBeNull();
  });

  it("un auto vendido exige precio y fecha de venta", async () => {
    const { error } = await a.cliente.from("autos").update({ estado: "vendido" }).eq("id", autoDeA);
    expect(error).not.toBeNull();
  });

  it("storage: B no puede leer ni subir en la carpeta de A", async () => {
    const ruta = `${a.id}/${autoDeA}/prueba.jpg`;
    const archivo = new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: "image/jpeg" });
    const subidaA = await a.cliente.storage.from("fotos-autos").upload(ruta, archivo);
    expect(subidaA.error).toBeNull();

    const lecturaB = await b.cliente.storage.from("fotos-autos").download(ruta);
    expect(lecturaB.error).not.toBeNull();

    const subidaB = await b.cliente.storage
      .from("fotos-autos")
      .upload(`${a.id}/${autoDeA}/intruso.jpg`, archivo);
    expect(subidaB.error).not.toBeNull();
  });
});
