"use server";
import { revalidatePath } from "next/cache";
import { requerirUsuario } from "@/lib/auth";
import { esTipoPlantilla } from "@/lib/documentos/plantillas-base";

export type EstadoPlantilla = { ok?: boolean; error?: string };

export async function guardarPlantilla(_: EstadoPlantilla, formData: FormData): Promise<EstadoPlantilla> {
  const { supabase, userId, esDueno } = await requerirUsuario();
  if (!esDueno) return { error: "Solo el dueño del negocio puede editar las plantillas." };
  const tipo = formData.get("tipo");
  const contenido = String(formData.get("contenido") ?? "").replace(/\r\n?/g, "\n").trim();
  if (!esTipoPlantilla(tipo)) return { error: "Tipo de plantilla no válido." };
  if (!contenido) return { error: "La plantilla no puede estar vacía." };
  if (contenido.length > 20000) return { error: "La plantilla es demasiado larga (máximo 20,000 caracteres)." };

  const { error } = await supabase
    .from("plantillas")
    .upsert({ user_id: userId, tipo, contenido }, { onConflict: "user_id,tipo" });
  if (error) return { error: "No se pudo guardar la plantilla. Intenta de nuevo." };
  revalidatePath("/plantillas", "layout");
  return { ok: true };
}

export async function restaurarPlantilla(formData: FormData) {
  const { supabase, esDueno } = await requerirUsuario();
  if (!esDueno) return;
  const tipo = formData.get("tipo");
  if (!esTipoPlantilla(tipo)) return;
  await supabase.from("plantillas").delete().eq("tipo", tipo);
  revalidatePath("/plantillas", "layout");
}
