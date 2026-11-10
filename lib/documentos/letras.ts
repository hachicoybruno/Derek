/** Números a letras en español, para montos en contratos y recibos. */

const UNIDADES = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
const DIEZ_A_VEINTINUEVE = [
  "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve",
  "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve",
];
const DECENAS = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const CENTENAS = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

function hasta99(n: number): string {
  if (n < 10) return UNIDADES[n];
  if (n < 30) return DIEZ_A_VEINTINUEVE[n - 10];
  const d = Math.floor(n / 10);
  const u = n % 10;
  return u ? `${DECENAS[d]} y ${UNIDADES[u]}` : DECENAS[d];
}

function hasta999(n: number): string {
  if (n === 100) return "cien";
  const c = Math.floor(n / 100);
  const resto = n % 100;
  return [CENTENAS[c], hasta99(resto)].filter(Boolean).join(" ");
}

/** "uno" → "un" delante de "mil" o "millones" (veintiuno → veintiún, treinta y uno → treinta y un). */
function apocope(texto: string) {
  return texto.replace(/veintiuno$/, "veintiún").replace(/uno$/, "un");
}

export function numeroALetras(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "cero";
  if (n >= 1e12) return String(n);

  const millones = Math.floor(n / 1e6);
  const miles = Math.floor((n % 1e6) / 1000);
  const resto = n % 1000;
  const partes: string[] = [];

  if (millones) partes.push(millones === 1 ? "un millón" : `${apocope(numeroALetras(millones))} millones`);
  if (miles) partes.push(miles === 1 ? "mil" : `${apocope(hasta999(miles))} mil`);
  if (resto) partes.push(hasta999(resto));
  return partes.join(" ");
}

/** 37500.5 → "TREINTA Y SIETE MIL QUINIENTOS CON 50/100 SOLES". */
export function montoEnLetras(monto: number): string {
  const centavos = Math.round(Math.abs(monto) * 100);
  const entero = Math.floor(centavos / 100);
  const decimales = String(centavos % 100).padStart(2, "0");
  return `${numeroALetras(entero)} con ${decimales}/100 soles`.toUpperCase();
}
