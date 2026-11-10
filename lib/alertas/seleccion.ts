/** Qué avisar y cómo redactarlo (lógica pura, sin base de datos). */
import { ETIQUETA_DOCUMENTO, type TipoDocumento } from "../dominio";
import { diasEntre } from "../fechas";
import { fecha, formatoPlaca } from "../formato";

/** Días antes del vencimiento en que se avisa. 0 = vence hoy o ya venció. */
export const UMBRALES_AVISO = [30, 7, 1, 0] as const;

/**
 * Umbral que corresponde hoy: el menor umbral que ya se alcanzó.
 * Así, si el cron no corrió un día o el documento se registró tarde, igual se avisa.
 * Devuelve null si faltan más de 30 días.
 */
export function umbralPara(diasRestantes: number): number | null {
  const alcanzados = UMBRALES_AVISO.filter((u) => diasRestantes <= u);
  return alcanzados.length ? Math.min(...alcanzados) : null;
}

export type DocumentoAlerta = {
  id: string;
  tipo: string;
  fecha_vencimiento: string;
  auto: { placa: string; marca: string; modelo: string };
};

export function describir(doc: DocumentoAlerta, hoy: string): string {
  const dias = diasEntre(hoy, doc.fecha_vencimiento);
  const nombre = ETIQUETA_DOCUMENTO[doc.tipo as TipoDocumento] ?? doc.tipo;
  const auto = `${doc.auto.marca} ${doc.auto.modelo} ${formatoPlaca(doc.auto.placa)}`;
  const cuando =
    dias < 0 ? `venció hace ${-dias} ${dias === -1 ? "día" : "días"}` : dias === 0 ? "vence hoy" : dias === 1 ? "vence mañana" : `vence en ${dias} días`;
  return `${nombre} del ${auto} ${cuando} (${fecha(doc.fecha_vencimiento)})`;
}

export function resumenAlerta(docs: DocumentoAlerta[], hoy: string) {
  const ordenados = [...docs].sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento));
  const lineas = ordenados.map((d) => describir(d, hoy));
  const vencidos = ordenados.filter((d) => d.fecha_vencimiento < hoy).length;
  const asunto =
    docs.length === 1
      ? `Aviso: ${lineas[0].split(" (")[0]}`
      : `Aviso: ${docs.length} documentos por vencer${vencidos ? ` (${vencidos} vencido${vencidos > 1 ? "s" : ""})` : ""}`;
  const whatsapp =
    lineas.length <= 3 ? lineas.join("; ") : `${lineas.slice(0, 3).join("; ")} y ${lineas.length - 3} más`;
  return { asunto, lineas, whatsapp };
}
