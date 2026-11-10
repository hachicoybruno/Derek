import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { AVISO_LEGAL } from "./plantillas-base";
import type { Bloque } from "./motor";

export type Firmante = { nombre?: string | null; dni?: string | null };

type Opciones = {
  titulo: string;
  firmantes: { vendedor: Firmante; comprador: Firmante };
};

// A4 en puntos y márgenes de ~2 cm.
const ANCHO = 595.28;
const ALTO = 841.89;
const MARGEN_X = 60;
const MARGEN_SUP = 64;
const MARGEN_INF = 72;
const ANCHO_UTIL = ANCHO - MARGEN_X * 2;

const NEGRO = rgb(0.06, 0.09, 0.16);
const GRIS = rgb(0.4, 0.45, 0.52);

const EXTRAS_WINANSI = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";

/** Las fuentes estándar de PDF solo cubren Latin-1 (WinAnsi): se quitan emojis y otros símbolos. */
export function limpiarTexto(texto: string): string {
  return [...texto]
    .map((c) => {
      const code = c.codePointAt(0)!;
      if ((code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || EXTRAS_WINANSI.includes(c)) return c;
      if (c === "\t") return " ";
      return "";
    })
    .join("")
    .replace(/ {2,}/g, " ");
}

function partirEnLineas(texto: string, fuente: PDFFont, tamano: number, ancho: number): string[][] {
  const palabras = texto.split(/\s+/).filter(Boolean);
  const lineas: string[][] = [];
  let actual: string[] = [];
  for (const palabra of palabras) {
    const prueba = [...actual, palabra].join(" ");
    if (actual.length && fuente.widthOfTextAtSize(prueba, tamano) > ancho) {
      lineas.push(actual);
      actual = [palabra];
    } else {
      actual.push(palabra);
    }
  }
  if (actual.length) lineas.push(actual);
  return lineas;
}

export async function generarPdf(bloques: Bloque[], opciones: Opciones): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(limpiarTexto(opciones.titulo));
  pdf.setAuthor("FLIPDESK");
  pdf.setCreator("FLIPDESK");
  pdf.setProducer("FLIPDESK");
  pdf.setLanguage("es-PE");

  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const negrita = await pdf.embedFont(StandardFonts.HelveticaBold);

  let pagina: PDFPage = pdf.addPage([ANCHO, ALTO]);
  let y = ALTO - MARGEN_SUP;

  const nuevaPagina = () => {
    pagina = pdf.addPage([ANCHO, ALTO]);
    y = ALTO - MARGEN_SUP;
  };
  const asegurarEspacio = (alto: number) => {
    if (y - alto < MARGEN_INF) nuevaPagina();
  };

  const escribir = (
    texto: string,
    { fuente = normal, tamano = 10.5, interlineado = 14.5, sangria = 0, alineacion = "justificado" as "justificado" | "centro" | "izquierda" } = {},
  ) => {
    const ancho = ANCHO_UTIL - sangria;
    const lineas = partirEnLineas(limpiarTexto(texto), fuente, tamano, ancho);
    lineas.forEach((palabras, i) => {
      asegurarEspacio(interlineado);
      const textoLinea = palabras.join(" ");
      const anchoLinea = fuente.widthOfTextAtSize(textoLinea, tamano);
      const x0 = MARGEN_X + sangria;
      const ultima = i === lineas.length - 1;

      if (alineacion === "centro") {
        pagina.drawText(textoLinea, { x: MARGEN_X + (ANCHO_UTIL - anchoLinea) / 2, y, size: tamano, font: fuente, color: NEGRO });
      } else if (alineacion === "justificado" && !ultima && palabras.length > 1) {
        const anchoPalabras = palabras.reduce((s, p) => s + fuente.widthOfTextAtSize(p, tamano), 0);
        const hueco = (ancho - anchoPalabras) / (palabras.length - 1);
        let x = x0;
        for (const p of palabras) {
          pagina.drawText(p, { x, y, size: tamano, font: fuente, color: NEGRO });
          x += fuente.widthOfTextAtSize(p, tamano) + hueco;
        }
      } else {
        pagina.drawText(textoLinea, { x: x0, y, size: tamano, font: fuente, color: NEGRO });
      }
      y -= interlineado;
    });
  };

  const ALTO_FIRMAS = 116;
  const firmas = (quienes: ("vendedor" | "comprador")[]) => {
    const altoBloque = ALTO_FIRMAS;
    asegurarEspacio(altoBloque);
    y -= 60; // espacio para firmar
    const anchoFirma = 200;
    const columnas = quienes.length === 2 ? [MARGEN_X, ANCHO - MARGEN_X - anchoFirma] : [MARGEN_X + (ANCHO_UTIL - anchoFirma) / 2];
    quienes.forEach((quien, i) => {
      const x = columnas[i];
      const f = opciones.firmantes[quien];
      pagina.drawLine({ start: { x, y }, end: { x: x + anchoFirma, y }, thickness: 0.8, color: NEGRO });
      const centrar = (t: string, fuente: PDFFont, tamano: number, dy: number) => {
        const limpio = limpiarTexto(t);
        let w = fuente.widthOfTextAtSize(limpio, tamano);
        let texto = limpio;
        while (w > anchoFirma && texto.length > 4) {
          texto = texto.slice(0, -2);
          w = fuente.widthOfTextAtSize(`${texto}…`, tamano);
        }
        if (texto !== limpio) texto += "…";
        pagina.drawText(texto, { x: x + (anchoFirma - w) / 2, y: y - dy, size: tamano, font: fuente, color: NEGRO });
      };
      centrar(quien === "vendedor" ? "EL VENDEDOR" : "EL COMPRADOR", negrita, 9.5, 14);
      centrar(f.nombre?.trim() || "Nombre: ____________________", normal, 9.5, 27);
      centrar(`DNI N° ${f.dni?.trim() || "______________"}`, normal, 9.5, 40);
    });
    y -= 56;
  };

  for (const [indice, bloque] of bloques.entries()) {
    switch (bloque.tipo) {
      case "titulo":
        asegurarEspacio(40);
        escribir(bloque.texto, { fuente: negrita, tamano: 14, interlineado: 19, alineacion: "centro" });
        y -= 10;
        break;
      case "subtitulo":
        asegurarEspacio(40); // evita un subtítulo huérfano al final de la página
        y -= 4;
        escribir(bloque.texto, { fuente: negrita, tamano: 10.5, alineacion: "izquierda" });
        break;
      case "parrafo": {
        // El párrafo previo a las firmas va en la misma página que ellas (no dejar la firma sola).
        if (bloques[indice + 1]?.tipo === "firmas") {
          const lineas = partirEnLineas(limpiarTexto(bloque.texto), normal, 10.5, ANCHO_UTIL).length;
          asegurarEspacio(lineas * 14.5 + 6 + ALTO_FIRMAS);
        }
        escribir(bloque.texto);
        y -= 6;
        break;
      }
      case "item": {
        asegurarEspacio(15.5);
        pagina.drawText("•", { x: MARGEN_X + 4, y, size: 10.5, font: normal, color: NEGRO });
        escribir(bloque.texto, { sangria: 16, alineacion: "izquierda" });
        y -= 2;
        break;
      }
      case "firmas":
        firmas(bloque.quienes);
        break;
      case "espacio":
        y -= 10;
        break;
    }
  }

  // Pie de página: aviso legal obligatorio y número de página.
  const paginas = pdf.getPages();
  paginas.forEach((p, i) => {
    p.drawLine({ start: { x: MARGEN_X, y: 48 }, end: { x: ANCHO - MARGEN_X, y: 48 }, thickness: 0.5, color: GRIS });
    p.drawText(`${AVISO_LEGAL} Generado con FLIPDESK.`, { x: MARGEN_X, y: 34, size: 8, font: normal, color: GRIS });
    const num = `Página ${i + 1} de ${paginas.length}`;
    p.drawText(num, { x: ANCHO - MARGEN_X - normal.widthOfTextAtSize(num, 8), y: 34, size: 8, font: normal, color: GRIS });
  });

  return pdf.save();
}
