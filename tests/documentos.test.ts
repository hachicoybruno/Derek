import { describe, expect, it } from "vitest";
import { montoEnLetras, numeroALetras } from "@/lib/documentos/letras";
import { aBloques, reemplazarVariables, VACIO, variablesUsadas } from "@/lib/documentos/motor";
import { fechaLarga } from "@/lib/fechas";

describe("números a letras", () => {
  it.each([
    [0, "cero"],
    [1, "uno"],
    [15, "quince"],
    [16, "dieciséis"],
    [21, "veintiuno"],
    [22, "veintidós"],
    [31, "treinta y uno"],
    [100, "cien"],
    [101, "ciento uno"],
    [500, "quinientos"],
    [1000, "mil"],
    [1001, "mil uno"],
    [21000, "veintiún mil"],
    [31500, "treinta y un mil quinientos"],
    [37500, "treinta y siete mil quinientos"],
    [100000, "cien mil"],
    [101000, "ciento un mil"],
    [999999, "novecientos noventa y nueve mil novecientos noventa y nueve"],
    [1000000, "un millón"],
    [2500000, "dos millones quinientos mil"],
    [21000000, "veintiún millones"],
  ])("%i → %s", (n, texto) => {
    expect(numeroALetras(n)).toBe(texto);
  });

  it("montos en soles con centavos", () => {
    expect(montoEnLetras(37500)).toBe("TREINTA Y SIETE MIL QUINIENTOS CON 00/100 SOLES");
    expect(montoEnLetras(1250.5)).toBe("MIL DOSCIENTOS CINCUENTA CON 50/100 SOLES");
    expect(montoEnLetras(0.99)).toBe("CERO CON 99/100 SOLES");
  });
});

describe("fecha larga", () => {
  it("formatea en español", () => {
    expect(fechaLarga("2026-11-09")).toBe("9 de noviembre de 2026");
    expect(fechaLarga(null)).toBe("");
  });
});

describe("motor de plantillas", () => {
  it("reemplaza variables y deja línea para completar si falta el dato", () => {
    const t = reemplazarVariables("Yo, {{vendedor.nombre}}, DNI {{ vendedor.dni }}.", { "vendedor.nombre": "Andree" });
    expect(t).toBe(`Yo, Andree, DNI ${VACIO}.`);
  });

  it("detecta variables usadas", () => {
    expect(variablesUsadas("{{auto.placa}} {{AUTO.PLACA}} {{venta.precio}}")).toEqual(["auto.placa", "venta.precio"]);
  });

  it("convierte el texto en bloques", () => {
    const b = aBloques("# CONTRATO\n\nPrimera línea\ncontinúa aquí.\n\n## PRIMERA\n- uno\n- dos\n\n[[FIRMAS]]\n[[firma_vendedor]]");
    expect(b).toEqual([
      { tipo: "titulo", texto: "CONTRATO" },
      { tipo: "parrafo", texto: "Primera línea continúa aquí." },
      { tipo: "subtitulo", texto: "PRIMERA" },
      { tipo: "item", texto: "uno" },
      { tipo: "item", texto: "dos" },
      { tipo: "firmas", quienes: ["vendedor", "comprador"] },
      { tipo: "firmas", quienes: ["vendedor"] },
    ]);
  });
});

import { PDFDocument } from "pdf-lib";
import { documentoPdf } from "@/lib/documentos/generar";
import { limpiarTexto } from "@/lib/documentos/pdf";
import { PLANTILLAS_BASE, TIPOS_PLANTILLA, VARIABLES } from "@/lib/documentos/plantillas-base";
import { construirVariables, EJEMPLO_VISTA_PREVIA } from "@/lib/documentos/variables";

describe("variables de documentos", () => {
  const base = { ...EJEMPLO_VISTA_PREVIA, ciudad: "Lima", hoy: "2026-11-09" };

  it("contrato: precio en números y letras, fecha larga", () => {
    const v = construirVariables("contrato", base);
    expect(v["venta.precio"]).toBe("S/ 37,500.00");
    expect(v["venta.precio_letras"]).toBe("TREINTA Y SIETE MIL QUINIENTOS CON 00/100 SOLES");
    expect(v["venta.fecha_larga"]).toBe("9 de noviembre de 2026");
    expect(v["auto.placa"]).toBe("ABC-123");
    expect(v["auto.kilometraje"]).toBe("78,000 km");
  });

  it("recibo: número automático con fecha y placa", () => {
    expect(construirVariables("recibo", base)["recibo.numero"]).toBe("20261109-ABC123");
  });

  it("todas las variables usadas en las plantillas originales existen en el catálogo", () => {
    for (const tipo of TIPOS_PLANTILLA) {
      const catalogo = new Set(VARIABLES[tipo].map((x) => x.clave));
      for (const usada of variablesUsadas(PLANTILLAS_BASE[tipo])) expect(catalogo, `${tipo}: ${usada}`).toContain(usada);
      const generadas = construirVariables(tipo, base);
      for (const clave of catalogo) expect(Object.keys(generadas), `${tipo}: ${clave}`).toContain(clave);
    }
  });
});

describe("PDF", () => {
  it("quita caracteres que las fuentes del PDF no soportan", () => {
    expect(limpiarTexto("Auto 🚗 ñandú — “ok” №")).toBe("Auto ñandú — “ok” ");
  });

  it.each(TIPOS_PLANTILLA)("genera un PDF válido: %s", async (tipo) => {
    const bytes = await documentoPdf(tipo, PLANTILLAS_BASE[tipo], { ...EJEMPLO_VISTA_PREVIA, ciudad: "Lima", hoy: "2026-11-09" });
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(pdf.getTitle()).toContain("Toyota Yaris");
  });
});
