import { ejecutarAlertas } from "@/lib/alertas/ejecutar";
import { hoyLima } from "@/lib/fechas";
import { enviadorCorreo } from "@/lib/notificaciones/correo";
import { enviadorWhatsapp } from "@/lib/notificaciones/whatsapp";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/supabase/env";

export const maxDuration = 60;

/**
 * Cron diario de avisos de vencimiento (vercel.json → 13:00 UTC = 8:00 en Lima).
 * Vercel envía "Authorization: Bearer $CRON_SECRET".
 */
export async function GET(request: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  const resultados = await ejecutarAlertas({
    db: crearClienteAdmin(),
    correo: enviadorCorreo(),
    whatsapp: enviadorWhatsapp(),
    hoy: hoyLima(),
    urlApp: siteUrl(),
  });
  const enviados = resultados.reduce((n, r) => n + r.enviados.length, 0);
  const errores = resultados.flatMap((r) => r.errores);
  if (errores.length) console.error("[cron alertas] errores:", errores);
  return Response.json({ cuentas: resultados.length, enviados, errores: errores.length });
}
