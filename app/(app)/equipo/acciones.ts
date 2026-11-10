"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requerirUsuario } from "@/lib/auth";
import { obtenerPerfil } from "@/lib/datos";
import { enlaceInvitacion, mensajeErrorEquipo } from "@/lib/equipo";
import { enviadorCorreo, htmlCorreo } from "@/lib/notificaciones/correo";
import { siteUrl } from "@/lib/supabase/env";
import { esUUID } from "@/lib/validacion";

export type EstadoInvitacion = { ok?: boolean; error?: string; enlace?: string; email?: string; correoEnviado?: boolean };

export async function invitar(_: EstadoInvitacion, formData: FormData): Promise<EstadoInvitacion> {
  const { supabase, esDueno, email: miCorreo } = await requerirUsuario();
  if (!esDueno) return { error: "Solo el dueño del negocio puede invitar." };
  const email = z.string().trim().toLowerCase().pipe(z.email()).safeParse(formData.get("email"));
  if (!email.success) return { error: "Ingresa un correo válido." };
  if (email.data === miCorreo.toLowerCase()) return { error: "No puedes invitarte a ti mismo." };

  const { data, error } = await supabase.from("invitaciones").insert({ email: email.data }).select("token").single();
  if (error || !data) return { error: mensajeErrorEquipo(error?.message), email: email.data };

  const enlace = enlaceInvitacion(siteUrl(), data.token);
  let correoEnviado = false;
  const correo = enviadorCorreo();
  if (correo) {
    const perfil = await obtenerPerfil();
    const negocio = perfil.negocio || perfil.nombre || "un negocio";
    try {
      await correo.enviar({
        para: email.data,
        asunto: `Te invitaron a ${negocio} en FLIPDESK`,
        texto: `Te invitaron a trabajar en ${negocio} en FLIPDESK. Acepta aquí: ${enlace}`,
        html: htmlCorreo({
          titulo: `Te invitaron a ${negocio}`,
          parrafos: [`${perfil.nombre ?? "El dueño"} te invitó a usar FLIPDESK como vendedor de ${negocio}.`, "El enlace vence en 7 días."],
          boton: { texto: "Aceptar invitación", url: enlace },
        }),
      });
      correoEnviado = true;
    } catch (e) {
      console.error("[equipo] no se pudo enviar el correo de invitación:", e);
    }
  }
  revalidatePath("/equipo");
  return { ok: true, enlace, email: email.data, correoEnviado };
}

export async function revocarInvitacion(formData: FormData) {
  const { supabase, esDueno } = await requerirUsuario();
  const id = formData.get("id");
  if (!esDueno || !esUUID(id)) return;
  await supabase.from("invitaciones").delete().eq("id", id);
  revalidatePath("/equipo");
}

export async function quitarMiembro(formData: FormData) {
  const { supabase, esDueno } = await requerirUsuario();
  const id = formData.get("user_id");
  if (!esDueno || !esUUID(id)) return;
  await supabase.from("miembros").delete().eq("user_id", id);
  revalidatePath("/equipo");
}

export async function salirDelEquipo() {
  const { supabase, userId, esDueno } = await requerirUsuario();
  if (esDueno) return;
  await supabase.from("miembros").delete().eq("user_id", userId);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function aceptarInvitacion(_: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const { supabase } = await requerirUsuario();
  const token = String(formData.get("token") ?? "");
  if (!/^[0-9a-f]{64}$/.test(token)) return { error: mensajeErrorEquipo("INVITACION_INVALIDA") };
  const { error } = await supabase.rpc("aceptar_invitacion", { p_token: token });
  if (error) return { error: mensajeErrorEquipo(error.message) };
  revalidatePath("/", "layout");
  redirect("/dashboard?bienvenida=equipo");
}
