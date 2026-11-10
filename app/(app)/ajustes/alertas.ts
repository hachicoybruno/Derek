"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requerirUsuario } from "@/lib/auth";
import { ejecutarAlertas } from "@/lib/alertas/ejecutar";
import { hoyLima } from "@/lib/fechas";
import { enviadorCorreo } from "@/lib/notificaciones/correo";
import { enviadorWhatsapp, normalizarCelular } from "@/lib/notificaciones/whatsapp";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/supabase/env";

export type EstadoAlertas = { ok?: boolean; error?: string; errores?: Record<string, string>; mensaje?: string };

export async function guardarAlertas(_: EstadoAlertas, formData: FormData): Promise<EstadoAlertas> {
  const { supabase, userId, esDueno } = await requerirUsuario();
  if (!esDueno) return { error: "Solo el dueño configura las alertas." };

  const alertasEmail = formData.get("alertas_email") === "on";
  const alertasWhatsapp = formData.get("alertas_whatsapp") === "on";
  const correoTexto = String(formData.get("correo_alertas") ?? "").trim().toLowerCase();
  const correo = correoTexto ? z.email().safeParse(correoTexto) : null;
  const whatsapp = normalizarCelular(String(formData.get("whatsapp") ?? ""));
  const errores: Record<string, string> = {};
  if (correo && !correo.success) errores.correo_alertas = "Correo inválido.";
  if (alertasWhatsapp && !whatsapp) errores.whatsapp = "Ingresa un celular válido (ej. 987 654 321).";
  if (Object.keys(errores).length) return { errores };

  const { error } = await supabase
    .from("perfiles")
    .update({
      alertas_email: alertasEmail,
      alertas_whatsapp: alertasWhatsapp,
      correo_alertas: correo?.success ? correo.data : null,
      whatsapp: whatsapp ?? null,
    })
    .eq("id", userId);
  if (error) return { error: "No se pudieron guardar las alertas." };
  revalidatePath("/ajustes");
  return { ok: true, mensaje: "Alertas guardadas." };
}

/** Envía ahora mismo un aviso con los documentos por vencer (sin marcarlos como avisados). */
export async function enviarAlertaPrueba(): Promise<EstadoAlertas> {
  const { cuentaId, esDueno } = await requerirUsuario();
  if (!esDueno) return { error: "Solo el dueño puede enviar avisos." };
  try {
    const [r] = await ejecutarAlertas({
      db: crearClienteAdmin(),
      correo: enviadorCorreo(),
      whatsapp: enviadorWhatsapp(),
      hoy: hoyLima(),
      urlApp: siteUrl(),
      cuentaId,
      forzar: true,
    });
    if (r.enviados.length) return { ok: true, mensaje: `Aviso enviado por ${r.enviados.map((c) => (c === "email" ? "correo" : "WhatsApp")).join(" y ")}.` };
    const motivos: Record<string, string> = {
      "plan sin alertas": "Tu plan no incluye alertas.",
      "sin documentos por vencer": "No tienes SOAT ni revisiones técnicas que venzan en los próximos 30 días.",
      "email: proveedor no configurado": "El envío de correos no está configurado (RESEND_API_KEY).",
      "whatsapp: proveedor no configurado": "WhatsApp no está configurado (WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID y WHATSAPP_PLANTILLA).",
      "email: sin destino": "Falta el correo de destino.",
      "whatsapp: sin destino": "Falta el número de WhatsApp.",
    };
    const texto = [...r.errores, ...r.omitidos.map((o) => motivos[o] ?? o)].join(" ");
    return { error: texto || "Activa al menos un canal (correo o WhatsApp)." };
  } catch (e) {
    console.error("[alertas] prueba:", e);
    return { error: "No se pudo enviar el aviso de prueba." };
  }
}
