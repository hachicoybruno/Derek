import "server-only";
import ExcelJS from "exceljs";
import { calcularAuto } from "./calculos";
import type { AutoResumen } from "./datos";
import { ETIQUETA_ESTADO } from "./dominio";
import { formatoPlaca } from "./formato";

const FORMATO_SOLES = '"S/" #,##0.00;[Red]-"S/" #,##0.00';
const FORMATO_FECHA = "dd/mm/yyyy";

/** "2026-11-09" → fecha de Excel (sin desfase de zona horaria). */
function fechaExcel(iso: string | null) {
  if (!iso) return null;
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}

export async function excelDeAutos(autos: AutoResumen[], hoy: string, verCostos = true): Promise<ArrayBuffer> {
  const libro = new ExcelJS.Workbook();
  libro.creator = "FLIPDESK";
  libro.created = new Date();
  const hoja = libro.addWorksheet("Autos", { views: [{ state: "frozen", ySplit: 1 }] });

  const COSTOS = new Set(["precio_compra", "gastos", "costo", "ganancia", "margen"]);
  const columnas = [
    { header: "Placa", key: "placa", width: 11 },
    { header: "Marca", key: "marca", width: 14 },
    { header: "Modelo", key: "modelo", width: 16 },
    { header: "Año", key: "anio", width: 7 },
    { header: "Estado", key: "estado", width: 14 },
    { header: "Fecha compra", key: "fecha_compra", width: 13, style: { numFmt: FORMATO_FECHA } },
    { header: "Precio compra", key: "precio_compra", width: 15, style: { numFmt: FORMATO_SOLES } },
    { header: "Gastos", key: "gastos", width: 13, style: { numFmt: FORMATO_SOLES } },
    { header: "Costo total", key: "costo", width: 15, style: { numFmt: FORMATO_SOLES } },
    { header: "Precio objetivo", key: "objetivo", width: 15, style: { numFmt: FORMATO_SOLES } },
    { header: "Precio venta", key: "venta", width: 15, style: { numFmt: FORMATO_SOLES } },
    { header: "Fecha venta", key: "fecha_venta", width: 13, style: { numFmt: FORMATO_FECHA } },
    { header: "Ganancia", key: "ganancia", width: 14, style: { numFmt: FORMATO_SOLES } },
    { header: "Margen %", key: "margen", width: 10, style: { numFmt: '0.0"%"' } },
    { header: "Días en stock", key: "dias", width: 12 },
  ];
  hoja.columns = verCostos ? columnas : columnas.filter((c) => !COSTOS.has(c.key));

  for (const a of autos) {
    const c = calcularAuto(a, hoy);
    hoja.addRow({
      placa: formatoPlaca(a.placa),
      marca: a.marca,
      modelo: a.modelo,
      anio: a.anio,
      estado: ETIQUETA_ESTADO[a.estado],
      fecha_compra: fechaExcel(a.fecha_compra),
      precio_compra: a.precio_compra,
      gastos: Number(a.total_gastos ?? 0),
      costo: c.costoTotal,
      objetivo: a.precio_venta_objetivo,
      venta: a.precio_venta_final,
      fecha_venta: fechaExcel(a.fecha_venta),
      ganancia: c.ganancia,
      margen: c.margen,
      dias: c.diasEnStock,
    });
  }

  const encabezado = hoja.getRow(1);
  encabezado.font = { bold: true, color: { argb: "FFFFFFFF" } };
  encabezado.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1C41B8" } };
  encabezado.alignment = { vertical: "middle" };
  encabezado.height = 22;

  if (autos.length && verCostos) {
    const ultima = autos.length + 1;
    const total = hoja.addRow({ placa: "TOTAL" });
    for (const col of ["G", "H", "I", "M"]) {
      total.getCell(col).value = { formula: `SUM(${col}2:${col}${ultima})` };
      total.getCell(col).numFmt = FORMATO_SOLES;
    }
    total.font = { bold: true };
    hoja.autoFilter = { from: "A1", to: `O${ultima}` };
  }

  return libro.xlsx.writeBuffer() as Promise<ArrayBuffer>;
}
