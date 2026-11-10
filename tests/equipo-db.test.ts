/**
 * Equipo (dueño + vendedores) aplicado en la base de datos. Requiere Supabase local.
 */
import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

config({ path: ".env.local", quiet: true });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publica = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secreta = process.env.SUPABASE_SECRET_KEY;
const hayDb = await (async () => {
  if (!url || !publica || !secreta || !/127\.0\.0\.1|localhost/.test(url)) return false;
  try { return (await fetch(`${url}/auth/v1/health`, { headers: { apikey: publica } })).ok; } catch { return false; }
})();

describe.skipIf(!hayDb)("equipo", () => {
  let admin: SupabaseClient;
  const sufijo = Date.now();
  const usuarios: Record<string, { cliente: SupabaseClient; id: string; email: string }> = {};
  let autoDelDueno: string;

  async function usuario(nombre: string) {
    const email = `${nombre}-${sufijo}@test.pe`;
    await admin.auth.admin.createUser({ email, password: "clave-123456", email_confirm: true });
    const cliente = createClient(url!, publica!, { auth: { persistSession: false } });
    const { data } = await cliente.auth.signInWithPassword({ email, password: "clave-123456" });
    usuarios[nombre] = { cliente, id: data.user!.id, email };
    return usuarios[nombre];
  }
  const plan = (id: string, p: string) =>
    admin.from("suscripciones").update({ plan: p, estado: "activa", periodo_hasta: new Date(Date.now() + 30 * 864e5).toISOString() }).eq("user_id", id);

  beforeAll(async () => {
    admin = createClient(url!, secreta!, { auth: { persistSession: false } });
    const dueno = await usuario("dueno");
    await usuario("vendedor");
    await usuario("extrano");
    await plan(dueno.id, "concesionario");
    const { data } = await dueno.cliente.from("autos").insert({ placa: "EQP101", marca: "Toyota", modelo: "Hilux", anio: 2020, precio_compra: 80000, fecha_compra: "2026-10-01" }).select("id").single();
    autoDelDueno = data!.id;
  });

  it("solo el dueño con plan Concesionario puede invitar", async () => {
    const { vendedor, extrano } = usuarios;
    const sinPlan = await extrano.cliente.from("invitaciones").insert({ email: "x@test.pe" });
    expect(sinPlan.error?.message).toContain("PLAN_SIN_EQUIPO");
    const ajena = await vendedor.cliente.from("invitaciones").insert({ cuenta_id: usuarios.dueno.id, email: "x@test.pe" });
    expect(ajena.error).not.toBeNull();
  });

  it("la invitación solo la acepta el correo invitado", async () => {
    const { dueno, vendedor, extrano } = usuarios;
    const { data: inv } = await dueno.cliente.from("invitaciones").insert({ email: vendedor.email.toUpperCase() }).select("token").single();
    const info = await extrano.cliente.rpc("ver_invitacion", { p_token: inv!.token });
    expect(info.data).toMatchObject({ email: vendedor.email, vigente: true });

    const otro = await extrano.cliente.rpc("aceptar_invitacion", { p_token: inv!.token });
    expect(otro.error?.message).toContain("INVITACION_OTRO_CORREO");
    const ok = await vendedor.cliente.rpc("aceptar_invitacion", { p_token: inv!.token });
    expect(ok.error).toBeNull();
    expect(ok.data).toBe(dueno.id);
    const otraVez = await vendedor.cliente.rpc("aceptar_invitacion", { p_token: inv!.token });
    expect(otraVez.error?.message).toContain("INVITACION_INVALIDA");
  });

  it("el vendedor trabaja en la cuenta del dueño", async () => {
    const { dueno, vendedor } = usuarios;
    expect((await vendedor.cliente.rpc("mi_contexto")).data).toEqual({ cuenta_id: dueno.id, rol: "vendedor" });
    const autos = await vendedor.cliente.from("autos").select("id");
    expect(autos.data?.map((a) => a.id)).toContain(autoDelDueno);

    const nuevo = await vendedor.cliente.from("autos").insert({ placa: "EQP102", marca: "Kia", modelo: "Rio", anio: 2021, precio_compra: 40000, fecha_compra: "2026-10-05" }).select("user_id").single();
    expect(nuevo.data?.user_id).toBe(dueno.id);
    expect((await vendedor.cliente.from("gastos").insert({ auto_id: autoDelDueno, categoria: "lavado", monto: 50 })).error).toBeNull();
    expect((await vendedor.cliente.rpc("plan_efectivo", { uid: dueno.id })).data).toBe("concesionario");
    expect((await vendedor.cliente.from("perfiles").select("id")).data).toHaveLength(2);
    const miembros = await vendedor.cliente.rpc("listar_miembros");
    expect(miembros.data?.map((m: { rol: string }) => m.rol).sort()).toEqual(["dueno", "vendedor"]);
  });

  it("el vendedor no puede borrar, ni editar plantillas, ni ver pagos", async () => {
    const { vendedor } = usuarios;
    await vendedor.cliente.from("autos").delete().eq("id", autoDelDueno);
    expect((await admin.from("autos").select("id").eq("id", autoDelDueno)).data).toHaveLength(1);
    expect((await vendedor.cliente.from("plantillas").insert({ tipo: "recibo", contenido: "x" })).error).not.toBeNull();
    await admin.from("pagos").insert({ user_id: usuarios.dueno.id, proveedor: "paypal", proveedor_pago_id: `EQ-${sufijo}`, monto: 67, moneda: "USD", estado: "completado" });
    expect((await vendedor.cliente.from("pagos").select("id")).data).toEqual([]);
  });

  it("storage: el vendedor sube a la carpeta del negocio pero no borra", async () => {
    const { dueno, vendedor } = usuarios;
    const ruta = `${dueno.id}/${autoDelDueno}/vendedor.jpg`;
    const subida = await vendedor.cliente.storage.from("fotos-autos").upload(ruta, new Blob([new Uint8Array([1, 2, 3])], { type: "image/jpeg" }));
    expect(subida.error).toBeNull();
    await vendedor.cliente.storage.from("fotos-autos").remove([ruta]);
    expect((await dueno.cliente.storage.from("fotos-autos").download(ruta)).error).toBeNull();
  });

  it("un extraño no ve nada del negocio", async () => {
    const { extrano } = usuarios;
    expect((await extrano.cliente.from("autos").select("id")).data).toEqual([]);
    expect((await extrano.cliente.from("miembros").select("user_id")).data).toEqual([]);
  });

  it("si el negocio baja de plan, el vendedor pierde el acceso", async () => {
    const { dueno, vendedor } = usuarios;
    await plan(dueno.id, "pro");
    expect((await vendedor.cliente.from("autos").select("id")).data).toEqual([]);
    expect((await vendedor.cliente.rpc("mi_contexto")).data).toEqual({ cuenta_id: vendedor.id, rol: "dueno" });
    await plan(dueno.id, "concesionario");
    expect((await vendedor.cliente.from("autos").select("id")).data!.length).toBeGreaterThan(0);
  });

  it("máximo 5 usuarios por negocio", async () => {
    const { dueno } = usuarios;
    for (const n of ["v2", "v3", "v4"]) {
      const u = await usuario(n);
      const { data: inv } = await dueno.cliente.from("invitaciones").insert({ email: u.email }).select("token").single();
      expect((await u.cliente.rpc("aceptar_invitacion", { p_token: inv!.token })).error).toBeNull();
    }
    const extra = await dueno.cliente.from("invitaciones").insert({ email: "sexto@test.pe" });
    expect(extra.error?.message).toContain("LIMITE_USUARIOS");
  });

  it("el dueño puede quitar a un vendedor y el vendedor puede salir", async () => {
    const { dueno, vendedor } = usuarios;
    await dueno.cliente.from("miembros").delete().eq("user_id", usuarios.v2.id);
    await usuarios.v3.cliente.from("miembros").delete().eq("user_id", usuarios.v3.id);
    const quedan = (await admin.from("miembros").select("user_id").eq("cuenta_id", dueno.id)).data!.map((m) => m.user_id);
    expect(quedan).toContain(vendedor.id);
    expect(quedan).not.toContain(usuarios.v2.id);
    expect(quedan).not.toContain(usuarios.v3.id);
  });
});
