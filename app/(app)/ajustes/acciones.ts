"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requerirUsuario } from "@/lib/auth";
import { erroresPorCampo, textoOpcional, valoresDe } from "@/lib/validacion";
import type { EstadoFormulario } from "../autos/acciones";

const porcentaje = (mensaje: string) =>
  z.preprocess((v) => Number(String(v).replace(",", ".")), z.number({ error: mensaje }).min(0, mensaje).max(100, mensaje));

const esquema = z
  .object({
    nombre: textoOpcional(80),
    negocio: textoOpcional(80),
    umbral_verde: porcentaje("Ingresa un porcentaje entre 0 y 100."),
    umbral_amarillo: porcentaje("Ingresa un porcentaje entre 0 y 100."),
  })
  .refine((d) => d.umbral_amarillo < d.umbral_verde, {
    path: ["umbral_amarillo"],
    message: "El umbral amarillo debe ser menor que el verde.",
  });

export async function guardarAjustes(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase, userId } = await requerirUsuario();
  const valores = valoresDe(formData);
  const datos = esquema.safeParse(Object.fromEntries(formData));
  if (!datos.success) return { errores: erroresPorCampo(datos.error), valores };

  const { error } = await supabase
    .from("perfiles")
    .update({
      nombre: datos.data.nombre ?? null,
      negocio: datos.data.negocio ?? null,
      umbral_verde: datos.data.umbral_verde,
      umbral_amarillo: datos.data.umbral_amarillo,
    })
    .eq("id", userId);
  if (error) return { error: "No se pudieron guardar los ajustes.", valores };
  revalidatePath("/", "layout");
  return { ok: true, valores };
}
