/**
 * Fórmulas de negocio de FLIPDESK. Única fuente de verdad (ver DECISIONES.md N1–N7, N13).
 *
 *   costo total     = precio de compra + gastos
 *   ganancia real   = precio de venta final − costo total     (solo autos vendidos)
 *   margen %        = ganancia ÷ precio de venta × 100
 *   días en stock   = fecha de venta (o hoy) − fecha de compra
 */
import type { Estado } from "./dominio";
import { diasEntre, rangoMes } from "./fechas";

export type AutoParaCalculo = {
  estado: Estado | string;
  precio_compra: number | null;
  precio_venta_objetivo: number | null;
  precio_venta_final: number | null;
  fecha_compra: string | null;
  fecha_venta: string | null;
  total_gastos: number | null;
};

export type CalculoAuto = {
  costoTotal: number;
  /** Ganancia real; null si el auto no está vendido. */
  ganancia: number | null;
  margen: number | null;
  /** Ganancia esperada con el precio objetivo (autos no vendidos). */
  gananciaProyectada: number | null;
  margenProyectado: number | null;
  diasEnStock: number | null;
};

export type Umbrales = { verde: number; amarillo: number };
export type ColorSemaforo = "verde" | "amarillo" | "rojo";

export const UMBRALES_POR_DEFECTO: Umbrales = { verde: 15, amarillo: 8 };

const redondear2 = (n: number) => Math.round(n * 100) / 100;

export function margenPorcentaje(ganancia: number, precioVenta: number): number | null {
  if (!precioVenta || precioVenta <= 0) return null;
  return redondear2((ganancia / precioVenta) * 100);
}

export function calcularAuto(auto: AutoParaCalculo, hoy: string): CalculoAuto {
  const compra = Number(auto.precio_compra ?? 0);
  const gastos = Number(auto.total_gastos ?? 0);
  const costoTotal = redondear2(compra + gastos);

  const vendido = auto.estado === "vendido" && auto.precio_venta_final !== null;
  const ganancia = vendido ? redondear2(Number(auto.precio_venta_final) - costoTotal) : null;
  const margen = vendido && ganancia !== null ? margenPorcentaje(ganancia, Number(auto.precio_venta_final)) : null;

  const objetivo = auto.precio_venta_objetivo !== null ? Number(auto.precio_venta_objetivo) : null;
  const gananciaProyectada = !vendido && objetivo ? redondear2(objetivo - costoTotal) : null;
  const margenProyectado =
    gananciaProyectada !== null && objetivo ? margenPorcentaje(gananciaProyectada, objetivo) : null;

  let diasEnStock: number | null = null;
  if (auto.estado !== "en_evaluacion" && auto.fecha_compra) {
    const fin = vendido && auto.fecha_venta ? auto.fecha_venta : hoy;
    diasEnStock = Math.max(0, diasEntre(auto.fecha_compra, fin));
  }

  return { costoTotal, ganancia, margen, gananciaProyectada, margenProyectado, diasEnStock };
}

export function semaforo(margen: number | null, umbrales: Umbrales = UMBRALES_POR_DEFECTO): ColorSemaforo {
  if (margen === null) return "rojo";
  if (margen >= umbrales.verde) return "verde";
  if (margen >= umbrales.amarillo) return "amarillo";
  return "rojo";
}

/** Calculadora "¿lo compro?". */
export function evaluarCompra(
  entrada: { precioCompra: number; reparaciones: number; precioVenta: number },
  umbrales: Umbrales = UMBRALES_POR_DEFECTO,
) {
  const costo = redondear2(entrada.precioCompra + entrada.reparaciones);
  const ganancia = redondear2(entrada.precioVenta - costo);
  const margen = margenPorcentaje(ganancia, entrada.precioVenta);
  const color = semaforo(margen, umbrales);
  /** Precio máximo de compra para llegar al margen verde con ese precio de venta. */
  const compraMaximaVerde = redondear2(entrada.precioVenta * (1 - umbrales.verde / 100) - entrada.reparaciones);
  return { costo, ganancia, margen, color, compraMaximaVerde };
}

export type FilaModelo = {
  marca: string;
  modelo: string;
  vendidos: number;
  gananciaTotal: number;
  margenPromedio: number | null;
  diasPromedioVenta: number | null;
};

export type ResumenDashboard = {
  gananciaMes: number;
  vendidosMes: number;
  ventasMes: number;
  autosEnStock: number;
  autosReservados: number;
  autosEnEvaluacion: number;
  capitalInmovilizado: number;
  diasPromedioStock: number | null;
  gananciaProyectadaStock: number;
  porModelo: FilaModelo[];
};

const promedio = (valores: number[]) =>
  valores.length ? redondear2(valores.reduce((a, b) => a + b, 0) / valores.length) : null;

export function resumenDashboard(
  autos: (AutoParaCalculo & { marca: string; modelo: string })[],
  hoy: string,
): ResumenDashboard {
  const { desde, hasta } = rangoMes(hoy);
  let gananciaMes = 0;
  let vendidosMes = 0;
  let ventasMes = 0;
  let capitalInmovilizado = 0;
  let gananciaProyectadaStock = 0;
  const diasStock: number[] = [];
  const grupos = new Map<string, { marca: string; modelo: string; ganancias: number[]; margenes: number[]; dias: number[] }>();

  const conteo = { en_stock: 0, reservado: 0, en_evaluacion: 0 };

  for (const auto of autos) {
    const c = calcularAuto(auto, hoy);

    if (auto.estado === "en_stock" || auto.estado === "reservado") {
      conteo[auto.estado] += 1;
      capitalInmovilizado += c.costoTotal;
      gananciaProyectadaStock += c.gananciaProyectada ?? 0;
      if (c.diasEnStock !== null) diasStock.push(c.diasEnStock);
    } else if (auto.estado === "en_evaluacion") {
      conteo.en_evaluacion += 1;
    }

    if (c.ganancia !== null) {
      if (auto.fecha_venta && auto.fecha_venta >= desde && auto.fecha_venta <= hasta) {
        gananciaMes += c.ganancia;
        vendidosMes += 1;
        ventasMes += Number(auto.precio_venta_final ?? 0);
      }
      const marca = auto.marca.trim();
      const modelo = auto.modelo.trim();
      const clave = `${marca.toLowerCase()}|${modelo.toLowerCase()}`;
      const g = grupos.get(clave) ?? { marca, modelo, ganancias: [], margenes: [], dias: [] };
      g.ganancias.push(c.ganancia);
      if (c.margen !== null) g.margenes.push(c.margen);
      if (c.diasEnStock !== null) g.dias.push(c.diasEnStock);
      grupos.set(clave, g);
    }
  }

  const porModelo: FilaModelo[] = [...grupos.values()]
    .map((g) => ({
      marca: g.marca,
      modelo: g.modelo,
      vendidos: g.ganancias.length,
      gananciaTotal: redondear2(g.ganancias.reduce((a, b) => a + b, 0)),
      margenPromedio: promedio(g.margenes),
      diasPromedioVenta: promedio(g.dias),
    }))
    .sort((a, b) => (b.margenPromedio ?? -Infinity) - (a.margenPromedio ?? -Infinity));

  return {
    gananciaMes: redondear2(gananciaMes),
    vendidosMes,
    ventasMes: redondear2(ventasMes),
    autosEnStock: conteo.en_stock,
    autosReservados: conteo.reservado,
    autosEnEvaluacion: conteo.en_evaluacion,
    capitalInmovilizado: redondear2(capitalInmovilizado),
    diasPromedioStock: promedio(diasStock),
    gananciaProyectadaStock: redondear2(gananciaProyectadaStock),
    porModelo,
  };
}
