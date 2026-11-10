"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requerirUsuario } from "@/lib/auth";
import { COMBUSTIBLES, ESTADOS, TRANSMISIONES } from "@/lib/dominio";
import { hoyLima } from "@/lib/fechas";
import { mensajeLimitePlan } from "@/lib/planes";
import {
  enteroOpcional,
  erroresPorCampo,
  esUUID,
  fechaOpcional,
  montoOpcional,
  opcionDe,
  placa,
  textoOpcional,
  textoRequerido,
  valoresDe,
  type ErroresCampo,
} from "@/lib/validacion";

export type EstadoFormulario = {
  error?: string;
  errores?: ErroresCampo;
  valores?: Record<string, string>;
  ok?: boolean;
  /** El error vino de un límite del plan: mostrar enlace a planes. */
  limitePlan?: boolean;
};

function esquemaAuto(hoy: string) {
  const anioMax = Number(hoy.slice(0, 4)) + 1;
  return z
    .object({
      placa,
      marca: textoRequerido("Ingresa la marca.", 40),
      modelo: textoRequerido("Ingresa el modelo.", 60),
      anio: enteroOpcional(1950, anioMax, `Año inválido (1950–${anioMax}).`).refine((v) => v !== undefined, "Ingresa el año."),
      estado: z.enum(ESTADOS, { error: "Elige un estado." }),
      precio_compra: montoOpcional,
      fecha_compra: fechaOpcional,
      precio_venta_objetivo: montoOpcional,
      precio_venta_final: montoOpcional,
      fecha_venta: fechaOpcional,
      version: textoOpcional(60),
      color: textoOpcional(30),
      kilometraje: enteroOpcional(0, 2_000_000, "Kilometraje inválido."),
      transmision: opcionDe(TRANSMISIONES),
      combustible: opcionDe(COMBUSTIBLES),
      notas: textoOpcional(2000),
      numero_serie: textoOpcional(30),
      numero_motor: textoOpcional(30),
    })
    .superRefine((d, ctx) => {
      const comprado = d.estado !== "en_evaluacion";
      if (comprado && d.precio_compra === undefined)
        ctx.addIssue({ code: "custom", path: ["precio_compra"], message: "Ingresa el precio de compra." });
      if (comprado && !d.fecha_compra)
        ctx.addIssue({ code: "custom", path: ["fecha_compra"], message: "Ingresa la fecha de compra." });
      if (d.fecha_compra && d.fecha_compra > hoy)
        ctx.addIssue({ code: "custom", path: ["fecha_compra"], message: "La fecha de compra no puede ser futura." });
      if (d.estado === "vendido") {
        if (d.precio_venta_final === undefined)
          ctx.addIssue({ code: "custom", path: ["precio_venta_final"], message: "Ingresa el precio de venta final." });
        if (!d.fecha_venta) ctx.addIssue({ code: "custom", path: ["fecha_venta"], message: "Ingresa la fecha de venta." });
      }
      if (d.fecha_venta && d.fecha_compra && d.fecha_venta < d.fecha_compra)
        ctx.addIssue({ code: "custom", path: ["fecha_venta"], message: "La venta no puede ser antes de la compra." });
      if (d.fecha_venta && d.fecha_venta > hoy)
        ctx.addIssue({ code: "custom", path: ["fecha_venta"], message: "La fecha de venta no puede ser futura." });
    });
}

function mensajeErrorBD(error: { code?: string; message: string }) {
  if (error.code === "23505") return { errores: { placa: "Ya tienes un auto registrado con esa placa." } };
  const limite = mensajeLimitePlan(error.message);
  if (limite) return { error: limite, limitePlan: true };
  return { error: "No se pudo guardar. Revisa tu conexión e intenta de nuevo." };
}

export async function guardarAuto(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase } = await requerirUsuario();
  const valores = valoresDe(formData);
  const id = formData.get("id");
  const datos = esquemaAuto(hoyLima()).safeParse(Object.fromEntries(formData));
  if (!datos.success) return { errores: erroresPorCampo(datos.error), valores };

  const d = datos.data;
  const vendido = d.estado === "vendido";
  const fila = {
    placa: d.placa,
    marca: d.marca,
    modelo: d.modelo,
    anio: d.anio!,
    estado: d.estado,
    precio_compra: d.precio_compra ?? null,
    fecha_compra: d.fecha_compra ?? null,
    precio_venta_objetivo: d.precio_venta_objetivo ?? null,
    precio_venta_final: vendido ? (d.precio_venta_final ?? null) : null,
    fecha_venta: vendido ? (d.fecha_venta ?? null) : null,
    version: d.version ?? null,
    color: d.color ?? null,
    kilometraje: d.kilometraje ?? null,
    transmision: d.transmision ?? null,
    combustible: d.combustible ?? null,
    notas: d.notas ?? null,
    numero_serie: d.numero_serie?.toUpperCase() ?? null,
    numero_motor: d.numero_motor?.toUpperCase() ?? null,
  };

  let autoId: string;
  if (esUUID(id)) {
    const { error } = await supabase.from("autos").update(fila).eq("id", id);
    if (error) return { ...mensajeErrorBD(error), valores };
    autoId = id;
  } else {
    const { data, error } = await supabase.from("autos").insert(fila).select("id").single();
    if (error) return { ...mensajeErrorBD(error), valores };
    autoId = data.id;
  }

  revalidatePath("/", "layout");
  redirect(`/autos/${autoId}${esUUID(id) ? "" : "?nuevo=1"}`);
}

/** Cambio rápido de estado desde la ficha (en evaluación / en stock / reservado). */
export async function cambiarEstado(formData: FormData) {
  const { supabase } = await requerirUsuario();
  const id = formData.get("id");
  const estado = z.enum(["en_evaluacion", "en_stock", "reservado"]).safeParse(formData.get("estado"));
  if (!esUUID(id) || !estado.success) return;

  const cambios: { estado: string; precio_venta_final?: null; fecha_venta?: null; fecha_compra?: string } = {
    estado: estado.data,
    precio_venta_final: null,
    fecha_venta: null,
  };
  // Al pasar a stock/reservado sin fecha de compra, se asume hoy.
  if (estado.data !== "en_evaluacion") {
    const { data } = await supabase.from("autos").select("fecha_compra").eq("id", id).single();
    if (data && !data.fecha_compra) cambios.fecha_compra = hoyLima();
  }
  const { error } = await supabase.from("autos").update(cambios).eq("id", id);
  revalidatePath("/", "layout");
  if (error && mensajeLimitePlan(error.message)) {
    redirect(`/autos/${id}?aviso=${error.message.includes("LIMITE_PLAN") ? "limite" : "sin_plan"}`);
  }
}

const esquemaVenta = (hoy: string) =>
  z.object({
    precio_venta_final: montoOpcional.refine((v) => v !== undefined, "Ingresa el precio de venta."),
    fecha_venta: fechaOpcional
      .refine((v) => Boolean(v), "Ingresa la fecha de venta.")
      .refine((v) => !v || v <= hoy, "La fecha de venta no puede ser futura."),
  });

export async function registrarVenta(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase } = await requerirUsuario();
  const valores = valoresDe(formData);
  const id = formData.get("id");
  if (!esUUID(id)) return { error: "Auto no válido." };
  const datos = esquemaVenta(hoyLima()).safeParse(Object.fromEntries(formData));
  if (!datos.success) return { errores: erroresPorCampo(datos.error), valores };

  const { data: auto } = await supabase.from("autos").select("fecha_compra").eq("id", id).single();
  if (auto?.fecha_compra && datos.data.fecha_venta! < auto.fecha_compra) {
    return { errores: { fecha_venta: "La venta no puede ser antes de la compra." }, valores };
  }

  const { error } = await supabase
    .from("autos")
    .update({ estado: "vendido", precio_venta_final: datos.data.precio_venta_final!, fecha_venta: datos.data.fecha_venta! })
    .eq("id", id);
  if (error) return { error: "No se pudo registrar la venta. Intenta de nuevo.", valores };

  revalidatePath("/", "layout");
  return { ok: true };
}

const esquemaContacto = z.object({
  rol: z.enum(["vendedor", "comprador"]),
  nombre: textoRequerido("Ingresa el nombre.", 120),
  dni: z.preprocess(
    (v) => (typeof v === "string" && v.trim() ? v.replace(/\s/g, "") : undefined),
    z.string().regex(/^[0-9A-Za-z-]{6,15}$/, "DNI o CE inválido.").optional(),
  ),
  telefono: textoOpcional(20),
  direccion: textoOpcional(200),
});

/** Crea o actualiza el vendedor/comprador vinculado al auto. */
export async function guardarContacto(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase } = await requerirUsuario();
  const valores = valoresDe(formData);
  const autoId = formData.get("auto_id");
  if (!esUUID(autoId)) return { error: "Auto no válido." };
  const datos = esquemaContacto.safeParse(Object.fromEntries(formData));
  if (!datos.success) return { errores: erroresPorCampo(datos.error), valores };
  const { rol, ...contacto } = datos.data;
  const columna = rol === "vendedor" ? "vendedor_id" : "comprador_id";

  const { data: auto } = await supabase.from("autos").select("vendedor_id, comprador_id").eq("id", autoId).single();
  if (!auto) return { error: "Auto no encontrado." };
  const existente = auto[columna];
  const fila = {
    nombre: contacto.nombre,
    dni: contacto.dni ?? null,
    telefono: contacto.telefono ?? null,
    direccion: contacto.direccion ?? null,
  };

  if (existente) {
    const { error } = await supabase.from("contactos").update(fila).eq("id", existente);
    if (error) return { error: "No se pudo guardar el contacto.", valores };
  } else {
    const { data, error } = await supabase.from("contactos").insert({ ...fila, tipo: rol }).select("id").single();
    if (error) return { error: "No se pudo guardar el contacto.", valores };
    await supabase
      .from("autos")
      .update(rol === "vendedor" ? { vendedor_id: data.id } : { comprador_id: data.id })
      .eq("id", autoId);
  }
  revalidatePath(`/autos/${autoId}`);
  return { ok: true };
}

export async function eliminarAuto(formData: FormData) {
  const { supabase, esDueno } = await requerirUsuario();
  if (!esDueno) return;
  const id = formData.get("id");
  if (!esUUID(id)) return;

  // Borrar archivos del storage antes que las filas.
  const [fotos, docs] = await Promise.all([
    supabase.from("fotos").select("path, path_miniatura").eq("auto_id", id),
    supabase.from("documentos").select("archivo_path").eq("auto_id", id),
  ]);
  const rutasFotos = (fotos.data ?? []).flatMap((f) => [f.path, f.path_miniatura].filter((p): p is string => Boolean(p)));
  const rutasDocs = (docs.data ?? []).map((d) => d.archivo_path).filter((p): p is string => Boolean(p));
  if (rutasFotos.length) await supabase.storage.from("fotos-autos").remove(rutasFotos);
  if (rutasDocs.length) await supabase.storage.from("documentos").remove(rutasDocs);

  await supabase.from("autos").delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect("/autos");
}
