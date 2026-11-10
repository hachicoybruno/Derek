/** Mensajes para los errores de equipo que lanza la base de datos. */
export function mensajeErrorEquipo(mensaje: string | undefined): string {
  const m = mensaje ?? "";
  if (m.includes("PLAN_SIN_EQUIPO")) return "Los usuarios adicionales están disponibles en el plan Concesionario.";
  if (m.includes("LIMITE_USUARIOS")) return "Tu plan permite hasta 5 usuarios (tú y 4 vendedores).";
  if (m.includes("INVITACION_INVALIDA")) return "La invitación no es válida, ya se usó o expiró. Pide al dueño una nueva.";
  if (m.includes("INVITACION_OTRO_CORREO")) return "Esta invitación es para otro correo. Inicia sesión con el correo invitado.";
  if (m.includes("YA_ES_MIEMBRO")) return "Ya perteneces a un negocio en FLIPDESK.";
  if (m.includes("TIENE_DATOS"))
    return "Tu cuenta ya tiene autos registrados. Para unirte a otro negocio usa una cuenta nueva con el correo invitado.";
  if (m.includes("SOLO_DUENO")) return "Solo el dueño del negocio puede invitar.";
  return "No se pudo completar. Intenta de nuevo.";
}

export function enlaceInvitacion(base: string, token: string) {
  return `${base}/invitacion/${token}`;
}

export function textoWhatsappInvitacion(negocio: string, enlace: string) {
  return `Hola, te invito a trabajar conmigo en ${negocio} en FLIPDESK. Crea tu cuenta con este enlace: ${enlace}`;
}
