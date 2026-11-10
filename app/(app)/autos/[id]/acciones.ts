"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requerirUsuario } from "@/lib/auth";
import { CATEGORIAS_GASTO, TIPOS_DOCUMENTO } from "@/lib/dominio";
import { hoyLima } from "@/lib/fechas";
import {
  erroresPorCampo,
  esUUID,
  fechaOpcional,
  montoPositivo,
  textoOpcional,
  valoresDe,
} from "@/lib/validacion";
import type { EstadoFormulario } from "../acciones";
import { obtenerGenerador, type Anuncio } from "@/lib/anuncios";

function refrescar(autoId: string) {
  revalidatePath(`/autos/${autoId}`);
  revalidatePath("/autos");
  revalidatePath("/dashboard");
}

/** La ruta de un archivo debe estar dentro de la carpeta del usuario y del auto. */
function rutaValida(ruta: unknown, cuentaId: string, autoId: string): ruta is string {
  return typeof ruta === "string" && ruta.startsWith(`${cuentaId}/${autoId}/`) && !ruta.includes("..");
}

// ── Gastos ────────────────────────────────────────────────────────────────

const esquemaGasto = (hoy: string) =>
  z.object({
    categoria: z.enum(CATEGORIAS_GASTO, { error: "Elige una categoría." }),
    monto: montoPositivo,
    fecha: fechaOpcional.refine((f) => !f || f <= hoy, "La fecha no puede ser futura."),
    descripcion: textoOpcional(200),
  });

export async function agregarGasto(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase } = await requerirUsuario();
  const autoId = formData.get("auto_id");
  if (!esUUID(autoId)) return { error: "Auto no válido." };
  const hoy = hoyLima();
  const datos = esquemaGasto(hoy).safeParse(Object.fromEntries(formData));
  if (!datos.success) return { errores: erroresPorCampo(datos.error), valores: valoresDe(formData) };

  const { error } = await supabase.from("gastos").insert({
    auto_id: autoId,
    categoria: datos.data.categoria,
    monto: datos.data.monto,
    fecha: datos.data.fecha ?? hoy,
    descripcion: datos.data.descripcion ?? null,
  });
  if (error) return { error: "No se pudo guardar el gasto. Intenta de nuevo.", valores: valoresDe(formData) };
  refrescar(autoId);
  return { ok: true };
}

export async function eliminarGasto(formData: FormData) {
  const { supabase, esDueno } = await requerirUsuario();
  if (!esDueno) return;
  const id = formData.get("id");
  const autoId = formData.get("auto_id");
  if (!esUUID(id) || !esUUID(autoId)) return;
  await supabase.from("gastos").delete().eq("id", id);
  refrescar(autoId);
}

// ── Documentos ────────────────────────────────────────────────────────────

const esquemaDocumento = z.object({
  tipo: z.enum(TIPOS_DOCUMENTO, { error: "Elige el tipo de documento." }),
  fecha_vencimiento: fechaOpcional,
  descripcion: textoOpcional(120),
});

export async function agregarDocumento(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase, cuentaId } = await requerirUsuario();
  const autoId = formData.get("auto_id");
  if (!esUUID(autoId)) return { error: "Auto no válido." };
  const datos = esquemaDocumento.safeParse(Object.fromEntries(formData));
  if (!datos.success) return { errores: erroresPorCampo(datos.error), valores: valoresDe(formData) };

  const tipo = datos.data.tipo;
  if ((tipo === "soat" || tipo === "revision_tecnica") && !datos.data.fecha_vencimiento) {
    return { errores: { fecha_vencimiento: "Ingresa la fecha de vencimiento." }, valores: valoresDe(formData) };
  }
  const archivo = formData.get("archivo_path");
  const { error } = await supabase.from("documentos").insert({
    auto_id: autoId,
    tipo,
    fecha_vencimiento: datos.data.fecha_vencimiento ?? null,
    descripcion: datos.data.descripcion ?? null,
    archivo_path: rutaValida(archivo, cuentaId, autoId) ? archivo : null,
  });
  if (error) return { error: "No se pudo guardar el documento. Intenta de nuevo.", valores: valoresDe(formData) };
  refrescar(autoId);
  revalidatePath("/vencimientos");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function eliminarDocumento(formData: FormData) {
  const { supabase, esDueno } = await requerirUsuario();
  if (!esDueno) return;
  const id = formData.get("id");
  const autoId = formData.get("auto_id");
  if (!esUUID(id) || !esUUID(autoId)) return;
  const { data } = await supabase.from("documentos").select("archivo_path").eq("id", id).single();
  if (data?.archivo_path) await supabase.storage.from("documentos").remove([data.archivo_path]);
  await supabase.from("documentos").delete().eq("id", id);
  refrescar(autoId);
  revalidatePath("/", "layout");
}

// ── Fotos ─────────────────────────────────────────────────────────────────

/** Registra en la BD las fotos que el navegador ya subió al storage. */
export async function registrarFotos(autoId: string, fotos: { path: string; miniatura: string }[]) {
  const { supabase, cuentaId } = await requerirUsuario();
  if (!esUUID(autoId)) return { error: "Auto no válido." };
  const validas = fotos.filter((f) => rutaValida(f.path, cuentaId, autoId) && rutaValida(f.miniatura, cuentaId, autoId));
  if (!validas.length) return { error: "No hay fotos válidas." };

  const { count } = await supabase.from("fotos").select("id", { count: "exact", head: true }).eq("auto_id", autoId);
  const inicio = count ?? 0;
  const { error } = await supabase.from("fotos").insert(
    validas.map((f, i) => ({ auto_id: autoId, path: f.path, path_miniatura: f.miniatura, orden: inicio + i })),
  );
  if (error) return { error: "No se pudieron guardar las fotos." };
  refrescar(autoId);
  return { ok: true };
}

export async function eliminarFoto(formData: FormData) {
  const { supabase, esDueno } = await requerirUsuario();
  if (!esDueno) return;
  const id = formData.get("id");
  const autoId = formData.get("auto_id");
  if (!esUUID(id) || !esUUID(autoId)) return;
  const { data } = await supabase.from("fotos").select("path, path_miniatura").eq("id", id).single();
  if (data) {
    await supabase.storage.from("fotos-autos").remove([data.path, data.path_miniatura].filter((p): p is string => Boolean(p)));
  }
  await supabase.from("fotos").delete().eq("id", id);
  refrescar(autoId);
}

/** Pone una foto como principal (la que aparece en la lista). */
export async function fotoPrincipal(formData: FormData) {
  const { supabase } = await requerirUsuario();
  const id = formData.get("id");
  const autoId = formData.get("auto_id");
  if (!esUUID(id) || !esUUID(autoId)) return;
  const { data } = await supabase.from("fotos").select("id").eq("auto_id", autoId).order("orden").order("created_at");
  if (!data) return;
  const orden = [id, ...data.map((f) => f.id).filter((x) => x !== id)];
  await Promise.all(orden.map((fotoId, i) => supabase.from("fotos").update({ orden: i }).eq("id", fotoId)));
  refrescar(autoId);
}

// ── Anuncios ──────────────────────────────────────────────────────────────

export async function generarAnuncios(autoId: string): Promise<{ anuncios?: Anuncio[]; error?: string }> {
  const { supabase } = await requerirUsuario();
  if (!esUUID(autoId)) return { error: "Auto no válido." };
  const [autoR, docsR] = await Promise.all([
    supabase.from("autos").select("*").eq("id", autoId).single(),
    supabase.from("documentos").select("tipo, fecha_vencimiento").eq("auto_id", autoId),
  ]);
  const a = autoR.data;
  if (!a) return { error: "Auto no encontrado." };

  const hoy = hoyLima();
  const vigente = (tipo: string) => (docsR.data ?? []).some((d) => d.tipo === tipo && d.fecha_vencimiento && d.fecha_vencimiento >= hoy);

  // Solo datos del vehículo: nunca placa, DNI ni teléfonos (ver lib/anuncios/ia.ts).
  const anuncios = await obtenerGenerador().generar({
    marca: a.marca,
    modelo: a.modelo,
    anio: a.anio,
    version: a.version,
    color: a.color,
    kilometraje: a.kilometraje,
    transmision: a.transmision,
    combustible: a.combustible,
    precio: a.precio_venta_objetivo ?? a.precio_venta_final,
    notas: a.notas,
    soatVigente: vigente("soat"),
    revisionVigente: vigente("revision_tecnica"),
    tieneTarjeta: (docsR.data ?? []).some((d) => d.tipo === "tarjeta_propiedad"),
  });
  return { anuncios };
}
