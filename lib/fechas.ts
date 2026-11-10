/** Utilidades de fechas. Todas las fechas de negocio son "YYYY-MM-DD" en hora de Lima. */

export const ZONA_HORARIA = "America/Lima";

/** Hoy en Lima como "YYYY-MM-DD" (el servidor de Vercel corre en UTC). */
export function hoyLima(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);
}

function aUTC(iso: string) {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(a, m - 1, d);
}

/** Días entre dos fechas ISO (fin − inicio). */
export function diasEntre(inicio: string, fin: string): number {
  return Math.round((aUTC(fin) - aUTC(inicio)) / 86_400_000);
}

export function sumarDias(iso: string, dias: number): string {
  return new Date(aUTC(iso) + dias * 86_400_000).toISOString().slice(0, 10);
}

/** "2026-11" → primer y último día del mes. */
export function rangoMes(iso: string): { desde: string; hasta: string } {
  const [a, m] = iso.split("-").map(Number);
  const desde = `${a}-${String(m).padStart(2, "0")}-01`;
  const hasta = new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10);
  return { desde, hasta };
}

export function esFechaISO(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const d = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor;
}
