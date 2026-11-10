import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { requerirUsuario } from "./auth";
import { UMBRALES_POR_DEFECTO, type Umbrales } from "./calculos";
import { DOCUMENTOS_CON_VENCIMIENTO, esEstado, type Estado } from "./dominio";
import { hoyLima, sumarDias } from "./fechas";
import { normalizarPlaca } from "./formato";
import type { Database } from "./supabase/tipos-db";
import { PLANTILLAS_BASE, type TipoPlantilla } from "./documentos/plantillas-base";

export type AutoResumen = Database["public"]["Views"]["autos_resumen"]["Row"] & {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  estado: Estado;
};
export type Gasto = Database["public"]["Tables"]["gastos"]["Row"];
export type Documento = Database["public"]["Tables"]["documentos"]["Row"];
export type Contacto = Database["public"]["Tables"]["contactos"]["Row"];
export type Foto = Database["public"]["Tables"]["fotos"]["Row"] & { url: string | null; urlMiniatura: string | null };

const DURACION_URL = 60 * 60; // 1 hora
export const DIAS_AVISO_VENCIMIENTO = 30;

/** Limpia la búsqueda para usarla dentro de un filtro `or()` de PostgREST. */
function limpiarBusqueda(q: string) {
  return q.replace(/[,.()*%\\:"']/g, " ").trim().slice(0, 40);
}

export const obtenerUmbrales = cache(async (): Promise<Umbrales> => {
  const { supabase, cuentaId } = await requerirUsuario();
  const { data } = await supabase.from("perfiles").select("umbral_verde, umbral_amarillo").eq("id", cuentaId).maybeSingle();
  if (!data) return UMBRALES_POR_DEFECTO;
  return { verde: Number(data.umbral_verde), amarillo: Number(data.umbral_amarillo) };
});

/** Perfil del negocio (del dueño): datos legales, ciudad, umbrales y alertas. */
export const obtenerPerfil = cache(async () => {
  const { supabase, email, cuentaId } = await requerirUsuario();
  const { data } = await supabase.from("perfiles").select("*").eq("id", cuentaId).maybeSingle();
  return { ...data, email };
});

/** Perfil del usuario actual (su nombre). Para el dueño es el mismo que el del negocio. */
export const obtenerMiPerfil = cache(async () => {
  const { supabase, userId, email, rol } = await requerirUsuario();
  const { data } = await supabase.from("perfiles").select("nombre").eq("id", userId).maybeSingle();
  return { nombre: data?.nombre ?? null, email, rol };
});

async function urlsFirmadas(bucket: "fotos-autos" | "documentos", paths: string[]) {
  const mapa = new Map<string, string>();
  const validos = paths.filter(Boolean);
  if (!validos.length) return mapa;
  const { supabase } = await requerirUsuario();
  const { data } = await supabase.storage.from(bucket).createSignedUrls(validos, DURACION_URL);
  data?.forEach((d) => d.path && d.signedUrl && mapa.set(d.path, d.signedUrl));
  return mapa;
}

export async function listarAutos(filtros: { estado?: string; q?: string } = {}) {
  const { supabase } = await requerirUsuario();
  let consulta = supabase.from("autos_resumen").select("*").order("created_at", { ascending: false });

  if (esEstado(filtros.estado)) consulta = consulta.eq("estado", filtros.estado);

  // Cada palabra debe coincidir con la placa, la marca o el modelo ("toyota yaris", "abc-123").
  const q = limpiarBusqueda(filtros.q ?? "");
  const placaCompleta = normalizarPlaca(q);
  const palabras = q.split(/\s+/).filter(Boolean).slice(0, 4);
  if (palabras.length) {
    const porPalabra = palabras.map((p) => {
      const condiciones = [`modelo.ilike.*${p}*`, `marca.ilike.*${p}*`, `version.ilike.*${p}*`];
      const placa = normalizarPlaca(p);
      if (placa) condiciones.push(`placa.ilike.*${placa}*`);
      return condiciones.join(",");
    });
    // La placa completa también puede escribirse con espacio ("ABC 123").
    if (palabras.length > 1 && placaCompleta.length >= 5) {
      consulta = consulta.or(`placa.ilike.*${placaCompleta}*,and(${porPalabra.map((c) => `or(${c})`).join(",")})`);
    } else {
      porPalabra.forEach((c) => (consulta = consulta.or(c)));
    }
  }

  const { data, error } = await consulta;
  if (error) throw new Error(`No se pudo cargar la lista de autos: ${error.message}`);
  return (data ?? []) as AutoResumen[];
}

/** Primera foto (miniatura) de cada auto, con URL firmada. */
export async function miniaturasDeAutos(autoIds: string[]) {
  const resultado = new Map<string, string>();
  if (!autoIds.length) return resultado;
  const { supabase } = await requerirUsuario();
  const { data } = await supabase
    .from("fotos")
    .select("auto_id, path, path_miniatura, orden, created_at")
    .in("auto_id", autoIds)
    .order("orden")
    .order("created_at");
  const primera = new Map<string, string>();
  data?.forEach((f) => {
    if (!primera.has(f.auto_id)) primera.set(f.auto_id, f.path_miniatura ?? f.path);
  });
  const urls = await urlsFirmadas("fotos-autos", [...primera.values()]);
  primera.forEach((path, autoId) => {
    const url = urls.get(path);
    if (url) resultado.set(autoId, url);
  });
  return resultado;
}

export async function obtenerAuto(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requerirUsuario();

  const [autoR, gastosR, docsR, fotosR] = await Promise.all([
    supabase.from("autos_resumen").select("*").eq("id", id).maybeSingle(),
    supabase.from("gastos").select("*").eq("auto_id", id).order("fecha", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("documentos").select("*").eq("auto_id", id).order("fecha_vencimiento", { ascending: true, nullsFirst: false }),
    supabase.from("fotos").select("*").eq("auto_id", id).order("orden").order("created_at"),
  ]);

  if (!autoR.data) notFound();
  const auto = autoR.data as AutoResumen;

  const contactoIds = [auto.vendedor_id, auto.comprador_id].filter((x): x is string => Boolean(x));
  const contactosR = contactoIds.length
    ? await supabase.from("contactos").select("*").in("id", contactoIds)
    : { data: [] as Contacto[] };
  const contactos = new Map((contactosR.data ?? []).map((c) => [c.id, c]));

  const fotosData = fotosR.data ?? [];
  const urls = await urlsFirmadas("fotos-autos", fotosData.flatMap((f) => [f.path, f.path_miniatura ?? ""]));
  const fotos: Foto[] = fotosData.map((f) => ({
    ...f,
    url: urls.get(f.path) ?? null,
    urlMiniatura: urls.get(f.path_miniatura ?? f.path) ?? urls.get(f.path) ?? null,
  }));

  const documentos = docsR.data ?? [];
  const urlsDocs = await urlsFirmadas("documentos", documentos.map((d) => d.archivo_path ?? ""));

  return {
    auto,
    gastos: gastosR.data ?? [],
    documentos: documentos.map((d) => ({ ...d, url: d.archivo_path ? urlsDocs.get(d.archivo_path) ?? null : null })),
    fotos,
    vendedor: auto.vendedor_id ? contactos.get(auto.vendedor_id) ?? null : null,
    comprador: auto.comprador_id ? contactos.get(auto.comprador_id) ?? null : null,
  };
}

export type Vencimiento = Documento & {
  autos: { id: string; placa: string; marca: string; modelo: string; anio: number; estado: string };
};

/** SOAT y revisiones técnicas vencidos o por vencer (próximos 30 días) de autos no vendidos. */
export const listarVencimientos = cache(async (dias = DIAS_AVISO_VENCIMIENTO) => {
  const { supabase } = await requerirUsuario();
  const hoy = hoyLima();
  const { data, error } = await supabase
    .from("documentos")
    .select("*, autos!inner(id, placa, marca, modelo, anio, estado)")
    .in("tipo", DOCUMENTOS_CON_VENCIMIENTO)
    .not("fecha_vencimiento", "is", null)
    .lte("fecha_vencimiento", sumarDias(hoy, dias))
    .neq("autos.estado", "vendido")
    .order("fecha_vencimiento");
  if (error) throw new Error(`No se pudieron cargar los vencimientos: ${error.message}`);
  return { hoy, documentos: (data ?? []) as unknown as Vencimiento[] };
});

export async function contarAlertasVencimiento() {
  const { documentos } = await listarVencimientos();
  return documentos.length;
}

/** Plantilla del usuario o, si no la editó, la original. */
export async function obtenerPlantilla(tipo: TipoPlantilla) {
  const { supabase } = await requerirUsuario();
  const { data } = await supabase.from("plantillas").select("contenido, updated_at").eq("tipo", tipo).maybeSingle();
  return { contenido: data?.contenido ?? PLANTILLAS_BASE[tipo], editada: Boolean(data), actualizada: data?.updated_at ?? null };
}

export type Miembro = { user_id: string; email: string; nombre: string | null; rol: "dueno" | "vendedor"; desde: string };

export async function listarMiembros(): Promise<Miembro[]> {
  const { supabase } = await requerirUsuario();
  const { data } = await supabase.rpc("listar_miembros");
  return (data ?? []) as Miembro[];
}

export async function listarInvitacionesPendientes() {
  const { supabase, esDueno } = await requerirUsuario();
  if (!esDueno) return [];
  const { data } = await supabase
    .from("invitaciones")
    .select("id, email, token, expira_at, created_at")
    .is("aceptada_at", null)
    .gt("expira_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  return data ?? [];
}
