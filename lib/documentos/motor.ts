/**
 * Motor de plantillas: reemplaza {{variables}} y convierte el texto en bloques para el PDF.
 *
 * Formato de las plantillas (texto plano, fácil de editar en el celular):
 *   # Título            → título centrado
 *   ## Subtítulo        → subtítulo en negrita
 *   - elemento          → viñeta
 *   [[FIRMAS]]          → firmas de vendedor y comprador
 *   [[FIRMA_VENDEDOR]]  / [[FIRMA_COMPRADOR]]
 *   línea en blanco     → separa párrafos
 */

export const VACIO = "______________";

export type Variables = Record<string, string | null | undefined>;

export type Bloque =
  | { tipo: "titulo"; texto: string }
  | { tipo: "subtitulo"; texto: string }
  | { tipo: "parrafo"; texto: string }
  | { tipo: "item"; texto: string }
  | { tipo: "firmas"; quienes: ("vendedor" | "comprador")[] }
  | { tipo: "espacio" };

const PATRON = /\{\{\s*([a-z_]+(?:\.[a-z_]+)?)\s*\}\}/gi;

/** Variables usadas en un texto (para avisar si alguna no existe). */
export function variablesUsadas(texto: string): string[] {
  return [...new Set([...texto.matchAll(PATRON)].map((m) => m[1].toLowerCase()))];
}

export function reemplazarVariables(texto: string, variables: Variables): string {
  return texto.replace(PATRON, (_, clave: string) => {
    const valor = variables[clave.toLowerCase()];
    return valor === null || valor === undefined || String(valor).trim() === "" ? VACIO : String(valor);
  });
}

export function aBloques(texto: string): Bloque[] {
  const bloques: Bloque[] = [];
  let parrafo: string[] = [];
  const cerrarParrafo = () => {
    if (parrafo.length) bloques.push({ tipo: "parrafo", texto: parrafo.join(" ") });
    parrafo = [];
  };

  for (const crudo of texto.replace(/\r\n?/g, "\n").split("\n")) {
    const linea = crudo.trim();
    const marcador = linea.toUpperCase();
    if (!linea) {
      cerrarParrafo();
      continue;
    }
    if (marcador === "[[FIRMAS]]" || marcador === "[[FIRMA_VENDEDOR]]" || marcador === "[[FIRMA_COMPRADOR]]") {
      cerrarParrafo();
      const quienes: ("vendedor" | "comprador")[] =
        marcador === "[[FIRMAS]]" ? ["vendedor", "comprador"] : marcador === "[[FIRMA_VENDEDOR]]" ? ["vendedor"] : ["comprador"];
      bloques.push({ tipo: "firmas", quienes });
    } else if (linea.startsWith("## ")) {
      cerrarParrafo();
      bloques.push({ tipo: "subtitulo", texto: linea.slice(3).trim() });
    } else if (linea.startsWith("# ")) {
      cerrarParrafo();
      bloques.push({ tipo: "titulo", texto: linea.slice(2).trim() });
    } else if (/^[-•*]\s+/.test(linea)) {
      cerrarParrafo();
      bloques.push({ tipo: "item", texto: linea.replace(/^[-•*]\s+/, "") });
    } else {
      parrafo.push(linea);
    }
  }
  cerrarParrafo();
  return bloques;
}
