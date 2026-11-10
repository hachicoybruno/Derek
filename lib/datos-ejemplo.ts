/**
 * 5 autos de ejemplo para demos. Las fechas son relativas a hoy para que el
 * dashboard siempre muestre ventas del mes, stock y vencimientos.
 * Se usa desde la app (botón) y desde scripts/seed.ts.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/tipos-db";
import { rangoMes, sumarDias } from "./fechas";

type Cliente = SupabaseClient<Database>;

export const PLACAS_EJEMPLO = ["DEM101", "DEM102", "DEM103", "DEM104", "DEM105"];

export async function insertarDatosEjemplo(supabase: Cliente, userId: string, hoy: string) {
  const { count } = await supabase
    .from("autos")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("placa", PLACAS_EJEMPLO);
  if (count) return { error: "Los autos de ejemplo ya están cargados." };
  const { data: plan } = await supabase.rpc("plan_efectivo", { uid: userId });
  if (!plan) return { error: "Tu prueba gratis o tu suscripción terminó. Elige un plan para cargar autos." };

  const d = (dias: number) => sumarDias(hoy, dias);
  const inicioMes = rangoMes(hoy).desde;
  const ventaDelMes = d(-3) < inicioMes ? inicioMes : d(-3);

  const { data: contactos, error: errorContactos } = await supabase
    .from("contactos")
    .insert([
      { user_id: userId, tipo: "vendedor", nombre: "Carlos Mendoza Ríos (ejemplo)", dni: "00000001", telefono: "999 000 001", direccion: "Av. Ejemplo 123, Surco" },
      { user_id: userId, tipo: "comprador", nombre: "Lucía Torres Vega (ejemplo)", dni: "00000002", telefono: "999 000 002", direccion: "Jr. Demo 456, Los Olivos" },
    ])
    .select("id");
  if (errorContactos || !contactos) return { error: "No se pudieron crear los datos de ejemplo." };

  const autos = [
    {
      placa: "DEM101", marca: "Toyota", modelo: "Yaris", anio: 2018, version: "GLI", color: "Plata", kilometraje: 78000,
      transmision: "mecanica", combustible: "gasolina", estado: "vendido",
      fecha_compra: d(-30), precio_compra: 31000, precio_venta_objetivo: 37000, precio_venta_final: 37500, fecha_venta: ventaDelMes,
      notas: "Único dueño, mantenimientos en concesionario.", vendedor_id: contactos[0].id, comprador_id: contactos[1].id,
    },
    {
      placa: "DEM102", marca: "Hyundai", modelo: "Accent", anio: 2019, version: "GL", color: "Blanco", kilometraje: 64000,
      transmision: "automatica", combustible: "gasolina", estado: "vendido",
      fecha_compra: d(-90), precio_compra: 33500, precio_venta_objetivo: 38500, precio_venta_final: 38000, fecha_venta: d(-40),
      notas: null, vendedor_id: null, comprador_id: null,
    },
    {
      placa: "DEM103", marca: "Kia", modelo: "Rio", anio: 2020, version: "EX", color: "Rojo", kilometraje: 41000,
      transmision: "mecanica", combustible: "gasolina", estado: "en_stock",
      fecha_compra: d(-25), precio_compra: 39000, precio_venta_objetivo: 45500, precio_venta_final: null, fecha_venta: null,
      notas: "Llantas nuevas, aros de aleación, cámara de retroceso.", vendedor_id: null, comprador_id: null,
    },
    {
      placa: "DEM104", marca: "Nissan", modelo: "Sentra", anio: 2017, version: "Advance", color: "Gris", kilometraje: 98000,
      transmision: "automatica", combustible: "glp", estado: "reservado",
      fecha_compra: d(-65), precio_compra: 28000, precio_venta_objetivo: 33000, precio_venta_final: null, fecha_venta: null,
      notas: "Kit de GLP certificado. Separado con S/ 500.", vendedor_id: null, comprador_id: null,
    },
    {
      placa: "DEM105", marca: "Suzuki", modelo: "Swift", anio: 2021, version: "GLX", color: "Azul", kilometraje: 23000,
      transmision: "mecanica", combustible: "gasolina", estado: "en_evaluacion",
      fecha_compra: null, precio_compra: 42000, precio_venta_objetivo: 47000, precio_venta_final: null, fecha_venta: null,
      notas: "Dueño pide 42 mil, revisar choque leve en puerta trasera.", vendedor_id: null, comprador_id: null,
    },
  ];

  const { data: insertados, error } = await supabase
    .from("autos")
    .insert(autos.map((a) => ({ ...a, user_id: userId })))
    .select("id, placa");
  if (error || !insertados) {
    if (error?.message.includes("SIN_PLAN") || error?.message.includes("LIMITE_PLAN"))
      return { error: "Tu plan actual no permite agregar estos autos de ejemplo. Revisa tu plan en Suscripción." };
    return { error: "No se pudieron crear los autos de ejemplo." };
  }
  const id = (placa: string) => insertados.find((a) => a.placa === placa)!.id;

  const gastos = [
    { auto_id: id("DEM101"), categoria: "pintura", monto: 900, fecha: d(-27), descripcion: "Retoque de parachoques" },
    { auto_id: id("DEM101"), categoria: "tramite", monto: 350, fecha: d(-28), descripcion: "Transferencia notarial" },
    { auto_id: id("DEM101"), categoria: "lavado", monto: 80, fecha: d(-20), descripcion: "Lavado y encerado" },
    { auto_id: id("DEM102"), categoria: "reparacion", monto: 1200, fecha: d(-85), descripcion: "Cambio de embrague" },
    { auto_id: id("DEM102"), categoria: "comision", monto: 500, fecha: d(-40), descripcion: "Comisión al jalador" },
    { auto_id: id("DEM103"), categoria: "reparacion", monto: 650, fecha: d(-22), descripcion: "Pastillas y discos de freno" },
    { auto_id: id("DEM103"), categoria: "lavado", monto: 60, fecha: d(-20), descripcion: null },
    { auto_id: id("DEM104"), categoria: "pintura", monto: 1400, fecha: d(-60), descripcion: "Pintura de capó y puerta" },
    { auto_id: id("DEM104"), categoria: "transporte", monto: 250, fecha: d(-64), descripcion: "Grúa desde Chosica" },
  ];
  const documentos = [
    { auto_id: id("DEM103"), tipo: "soat", fecha_vencimiento: d(12), descripcion: "Rímac" },
    { auto_id: id("DEM103"), tipo: "revision_tecnica", fecha_vencimiento: d(75), descripcion: null },
    { auto_id: id("DEM104"), tipo: "soat", fecha_vencimiento: d(-3), descripcion: "La Positiva" },
    { auto_id: id("DEM104"), tipo: "revision_tecnica", fecha_vencimiento: d(26), descripcion: null },
    { auto_id: id("DEM104"), tipo: "tarjeta_propiedad", fecha_vencimiento: null, descripcion: null },
    { auto_id: id("DEM101"), tipo: "tarjeta_propiedad", fecha_vencimiento: null, descripcion: null },
  ];

  const [g, docs] = await Promise.all([
    supabase.from("gastos").insert(gastos.map((x) => ({ ...x, user_id: userId }))),
    supabase.from("documentos").insert(documentos.map((x) => ({ ...x, user_id: userId }))),
  ]);
  if (g.error || docs.error) return { error: "Se crearon los autos, pero faltaron algunos gastos o documentos." };
  return { ok: true as const };
}
