/** Formatos para Perú: soles, fechas DD/MM/AAAA y placas. */

const soles2 = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const soles0 = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 0 });
const entero = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 0 });
const decimal1 = new Intl.NumberFormat("es-PE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * 45250.5 → "S/ 45,250.50" · 45000 → "S/ 45,000" · con `redondear` → "S/ 45,251".
 * Usa espacio no separable entre "S/" y el número para que no se corten en dos líneas.
 */
export function soles(valor: number | null | undefined, { redondear = false } = {}): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  const entero = Number.isInteger(Math.round(valor * 100) / 100);
  return (redondear || entero ? soles0 : soles2).format(valor);
}

/** Igual que `soles` pero con signo explícito para ganancias: "+S/ 3,200" / "−S/ 500". */
export function solesConSigno(valor: number | null | undefined, opciones?: { redondear?: boolean }): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  const texto = soles(Math.abs(valor), opciones);
  return valor > 0 ? `+${texto}` : valor < 0 ? `−${texto}` : texto;
}

export function porcentaje(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return `${decimal1.format(valor)} %`;
}

export function numero(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return entero.format(valor);
}

export function km(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? "—" : `${entero.format(valor)} km`;
}

/** "2026-11-09" → "09/11/2026". */
export function fecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

/** Normaliza placas: " abc-123 " → "ABC123". */
export function normalizarPlaca(placa: string): string {
  return placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

/** "ABC123" → "ABC-123" (formato peruano de 6 caracteres). Otros largos se muestran tal cual. */
export function formatoPlaca(placa: string): string {
  const p = normalizarPlaca(placa);
  return p.length === 6 ? `${p.slice(0, 3)}-${p.slice(3)}` : p;
}

/**
 * Convierte lo que escribe el usuario en un número:
 * "45,000" → 45000 · "45 000" → 45000 · "1,250.50" → 1250.5 · "1250,50" → 1250.5
 */
export function parsearMonto(texto: string | null | undefined): number | null {
  if (texto === null || texto === undefined) return null;
  let t = String(texto).replace(/[S/\s]/g, "").replace(/^\./, "");
  if (!t) return null;
  const comas = (t.match(/,/g) ?? []).length;
  const puntos = (t.match(/\./g) ?? []).length;
  if (comas && puntos) {
    // El último separador es el decimal.
    t = t.lastIndexOf(",") > t.lastIndexOf(".") ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  } else if (comas) {
    // "1,250" (miles) vs "1250,5" (decimal): coma seguida de exactamente 3 dígitos = miles.
    t = /,\d{3}(?!\d)/.test(t) && !/,\d{1,2}$/.test(t) ? t.replace(/,/g, "") : t.replace(",", ".");
  } else if (puntos > 1) {
    t = t.replace(/\./g, "");
  }
  const n = Number(t);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}
