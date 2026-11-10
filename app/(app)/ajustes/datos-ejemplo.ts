"use server";
import { revalidatePath } from "next/cache";
import { requerirUsuario } from "@/lib/auth";
import { insertarDatosEjemplo } from "@/lib/datos-ejemplo";
import { hoyLima } from "@/lib/fechas";

export async function cargarDatosEjemplo(): Promise<{ error?: string; ok?: boolean }> {
  const { supabase, cuentaId } = await requerirUsuario();
  const r = await insertarDatosEjemplo(supabase, cuentaId, hoyLima());
  revalidatePath("/", "layout");
  return r;
}
