/**
 * Envía los avisos de vencimiento (SOAT y revisión técnica) por correo y WhatsApp.
 * Lo ejecuta el cron diario (app/api/cron/alertas) y el botón "Enviar aviso de prueba".
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { DOCUMENTOS_CON_VENCIMIENTO } from "../dominio";
import { diasEntre, sumarDias } from "../fechas";
import { esPlan, INFO_PLANES } from "../planes";
import { htmlCorreo, type EnviadorCorreo } from "../notificaciones/correo";
import type { EnviadorWhatsapp } from "../notificaciones/whatsapp";
import type { Database } from "../supabase/tipos-db";
import { resumenAlerta, umbralPara, type DocumentoAlerta } from "./seleccion";

type Db = SupabaseClient<Database>;
type Canal = "email" | "whatsapp";

export type OpcionesAlertas = {
  db: Db;
  correo: EnviadorCorreo | null;
  whatsapp: EnviadorWhatsapp | null;
  hoy: string;
  urlApp: string;
  /** Limitar a una cuenta (aviso de prueba). */
  cuentaId?: string;
  /** Ignora el registro de enviados y no lo actualiza (aviso de prueba). */
  forzar?: boolean;
};

export type ResultadoCuenta = { cuentaId: string; enviados: Canal[]; omitidos: string[]; errores: string[] };

export async function ejecutarAlertas(o: OpcionesAlertas): Promise<ResultadoCuenta[]> {
  let consulta = o.db
    .from("documentos")
    .select("id, tipo, fecha_vencimiento, user_id, autos!inner(placa, marca, modelo, estado)")
    .in("tipo", DOCUMENTOS_CON_VENCIMIENTO)
    .not("fecha_vencimiento", "is", null)
    .lte("fecha_vencimiento", sumarDias(o.hoy, 30))
    .neq("autos.estado", "vendido");
  if (o.cuentaId) consulta = consulta.eq("user_id", o.cuentaId);
  const { data, error } = await consulta;
  if (error) throw new Error(`No se pudieron leer los documentos: ${error.message}`);

  const porCuenta = new Map<string, (DocumentoAlerta & { umbral: number })[]>();
  for (const d of data ?? []) {
    const umbral = umbralPara(diasEntre(o.hoy, d.fecha_vencimiento!));
    if (umbral === null) continue;
    const auto = d.autos as unknown as { placa: string; marca: string; modelo: string };
    const lista = porCuenta.get(d.user_id) ?? [];
    lista.push({ id: d.id, tipo: d.tipo, fecha_vencimiento: d.fecha_vencimiento!, auto, umbral });
    porCuenta.set(d.user_id, lista);
  }
  if (o.cuentaId && !porCuenta.has(o.cuentaId)) porCuenta.set(o.cuentaId, []);

  const resultados: ResultadoCuenta[] = [];
  for (const [cuentaId, docs] of porCuenta) {
    const r: ResultadoCuenta = { cuentaId, enviados: [], omitidos: [], errores: [] };
    resultados.push(r);

    const { data: plan } = await o.db.rpc("plan_efectivo", { uid: cuentaId });
    if (!esPlan(plan) || !INFO_PLANES[plan].alertas) {
      r.omitidos.push("plan sin alertas");
      continue;
    }
    if (!docs.length) {
      r.omitidos.push("sin documentos por vencer");
      continue;
    }

    const { data: perfil } = await o.db
      .from("perfiles")
      .select("alertas_email, alertas_whatsapp, correo_alertas, whatsapp")
      .eq("id", cuentaId)
      .single();
    let email = perfil?.correo_alertas ?? null;
    if (!email && perfil?.alertas_email) email = (await o.db.auth.admin.getUserById(cuentaId)).data.user?.email ?? null;

    const canales: { canal: Canal; activo: boolean; destino: string | null; listo: boolean }[] = [
      { canal: "email", activo: Boolean(perfil?.alertas_email), destino: email, listo: Boolean(o.correo) },
      { canal: "whatsapp", activo: Boolean(perfil?.alertas_whatsapp), destino: perfil?.whatsapp ?? null, listo: Boolean(o.whatsapp) },
    ];

    for (const c of canales) {
      if (!c.activo) continue;
      if (!c.destino) {
        r.omitidos.push(`${c.canal}: sin destino`);
        continue;
      }
      if (!c.listo) {
        r.omitidos.push(`${c.canal}: proveedor no configurado`);
        continue;
      }

      let pendientes = docs;
      if (!o.forzar) {
        const { data: enviados } = await o.db
          .from("alertas_enviadas")
          .select("documento_id, umbral")
          .eq("canal", c.canal)
          .in("documento_id", docs.map((d) => d.id));
        const ya = new Set((enviados ?? []).map((e) => `${e.documento_id}:${e.umbral}`));
        pendientes = docs.filter((d) => !ya.has(`${d.id}:${d.umbral}`));
      }
      if (!pendientes.length) {
        r.omitidos.push(`${c.canal}: ya avisado`);
        continue;
      }

      const resumen = resumenAlerta(pendientes, o.hoy);
      try {
        if (c.canal === "email") {
          await o.correo!.enviar({
            para: c.destino,
            asunto: resumen.asunto,
            texto: `${resumen.lineas.join("\n")}\n\nRevisa tus vencimientos: ${o.urlApp}/vencimientos`,
            html: htmlCorreo({
              titulo: "Documentos por vencer",
              parrafos: ["Estos documentos de tus autos vencen pronto o ya vencieron:"],
              lista: resumen.lineas,
              boton: { texto: "Ver vencimientos", url: `${o.urlApp}/vencimientos` },
            }),
          });
        } else {
          await o.whatsapp!.enviarAlerta(c.destino, resumen.whatsapp);
        }
        r.enviados.push(c.canal);
        if (!o.forzar) {
          await o.db
            .from("alertas_enviadas")
            .upsert(pendientes.map((d) => ({ documento_id: d.id, umbral: d.umbral, canal: c.canal })), { onConflict: "documento_id,umbral,canal" });
        }
      } catch (e) {
        r.errores.push(`${c.canal}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }
  return resultados;
}
