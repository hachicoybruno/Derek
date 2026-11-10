import { describe, expect, it } from "vitest";
import { calcularAuto, evaluarCompra, resumenDashboard, semaforo, type AutoParaCalculo } from "@/lib/calculos";

const base: AutoParaCalculo = {
  estado: "en_stock",
  precio_compra: 30000,
  precio_venta_objetivo: 36000,
  precio_venta_final: null,
  fecha_compra: "2026-10-01",
  fecha_venta: null,
  total_gastos: 1500,
};

describe("calcularAuto", () => {
  it("costo total = compra + gastos", () => {
    expect(calcularAuto(base, "2026-11-09").costoTotal).toBe(31500);
  });

  it("auto en stock: sin ganancia real, con ganancia proyectada", () => {
    const c = calcularAuto(base, "2026-11-09");
    expect(c.ganancia).toBeNull();
    expect(c.margen).toBeNull();
    expect(c.gananciaProyectada).toBe(4500);
    expect(c.margenProyectado).toBe(12.5);
  });

  it("días en stock hasta hoy si no se vendió", () => {
    expect(calcularAuto(base, "2026-11-09").diasEnStock).toBe(39);
  });

  it("auto vendido: ganancia, margen y días hasta la venta", () => {
    const c = calcularAuto(
      { ...base, estado: "vendido", precio_venta_final: 35000, fecha_venta: "2026-10-21" },
      "2026-11-09",
    );
    expect(c.ganancia).toBe(3500);
    expect(c.margen).toBe(10);
    expect(c.diasEnStock).toBe(20);
    expect(c.gananciaProyectada).toBeNull();
  });

  it("venta con pérdida da ganancia negativa", () => {
    const c = calcularAuto(
      { ...base, estado: "vendido", precio_venta_final: 30000, fecha_venta: "2026-10-21" },
      "2026-11-09",
    );
    expect(c.ganancia).toBe(-1500);
    expect(c.margen).toBe(-5);
  });

  it("en evaluación no suma días en stock", () => {
    expect(calcularAuto({ ...base, estado: "en_evaluacion" }, "2026-11-09").diasEnStock).toBeNull();
  });

  it("tolera valores vacíos", () => {
    const c = calcularAuto(
      { ...base, precio_compra: null, total_gastos: null, precio_venta_objetivo: null, fecha_compra: null },
      "2026-11-09",
    );
    expect(c.costoTotal).toBe(0);
    expect(c.gananciaProyectada).toBeNull();
    expect(c.diasEnStock).toBeNull();
  });

  it("evita errores de punto flotante", () => {
    expect(calcularAuto({ ...base, precio_compra: 0.1, total_gastos: 0.2 }, "2026-11-09").costoTotal).toBe(0.3);
  });
});

describe("semáforo", () => {
  it("usa los umbrales por defecto (15 / 8)", () => {
    expect(semaforo(15)).toBe("verde");
    expect(semaforo(14.99)).toBe("amarillo");
    expect(semaforo(8)).toBe("amarillo");
    expect(semaforo(7.99)).toBe("rojo");
    expect(semaforo(null)).toBe("rojo");
  });

  it("respeta umbrales configurados", () => {
    expect(semaforo(12, { verde: 12, amarillo: 5 })).toBe("verde");
    expect(semaforo(4, { verde: 12, amarillo: 5 })).toBe("rojo");
  });
});

describe("evaluarCompra", () => {
  it("calcula ganancia, margen y color", () => {
    const r = evaluarCompra({ precioCompra: 28000, reparaciones: 2000, precioVenta: 36000 });
    expect(r.costo).toBe(30000);
    expect(r.ganancia).toBe(6000);
    expect(r.margen).toBe(16.67);
    expect(r.color).toBe("verde");
  });

  it("precio máximo de compra para quedar en verde", () => {
    const r = evaluarCompra({ precioCompra: 33000, reparaciones: 1000, precioVenta: 36000 });
    expect(r.color).toBe("rojo");
    expect(r.compraMaximaVerde).toBe(29600); // 36000 × 0.85 − 1000
    expect(evaluarCompra({ precioCompra: 29600, reparaciones: 1000, precioVenta: 36000 }).color).toBe("verde");
  });

  it("precio de venta cero no rompe", () => {
    const r = evaluarCompra({ precioCompra: 1000, reparaciones: 0, precioVenta: 0 });
    expect(r.margen).toBeNull();
    expect(r.color).toBe("rojo");
  });
});

describe("resumenDashboard", () => {
  const autos = [
    { ...base, marca: "Toyota", modelo: "Yaris" }, // en stock, 39 días, costo 31500
    { ...base, marca: "Kia", modelo: "Rio", estado: "reservado", precio_compra: 20000, total_gastos: 0, fecha_compra: "2026-11-01" }, // 8 días
    { ...base, marca: "Hyundai", modelo: "Accent", estado: "en_evaluacion", precio_compra: 25000 },
    { ...base, marca: "Toyota", modelo: "Yaris", estado: "vendido", precio_venta_final: 35000, fecha_venta: "2026-11-05" }, // +3500, 10 %
    { ...base, marca: "toyota", modelo: "yaris ", estado: "vendido", precio_venta_final: 37000, fecha_venta: "2026-10-20" }, // +5500 (mes anterior)
  ];
  const r = resumenDashboard(autos, "2026-11-09");

  it("ganancia del mes solo cuenta ventas del mes actual", () => {
    expect(r.gananciaMes).toBe(3500);
    expect(r.vendidosMes).toBe(1);
    expect(r.ventasMes).toBe(35000);
  });

  it("stock y capital inmovilizado (en stock + reservado)", () => {
    expect(r.autosEnStock).toBe(1);
    expect(r.autosReservados).toBe(1);
    expect(r.autosEnEvaluacion).toBe(1);
    expect(r.capitalInmovilizado).toBe(51500);
  });

  it("días promedio en stock de los autos actuales", () => {
    expect(r.diasPromedioStock).toBe(23.5);
  });

  it("agrupa por marca/modelo sin importar mayúsculas", () => {
    expect(r.porModelo).toHaveLength(1);
    expect(r.porModelo[0].vendidos).toBe(2);
    expect(r.porModelo[0].gananciaTotal).toBe(9000);
    expect(r.porModelo[0].margenPromedio).toBe(12.43); // (10 + 14.86) / 2
  });
});

import { estadoVencimiento } from "@/lib/calculos";

describe("estadoVencimiento", () => {
  it("clasifica vencido / por vencer / vigente", () => {
    expect(estadoVencimiento("2026-11-08", "2026-11-09")).toEqual({ estado: "vencido", dias: -1 });
    expect(estadoVencimiento("2026-11-09", "2026-11-09")).toEqual({ estado: "por_vencer", dias: 0 });
    expect(estadoVencimiento("2026-12-09", "2026-11-09")).toEqual({ estado: "por_vencer", dias: 30 });
    expect(estadoVencimiento("2026-12-10", "2026-11-09")).toEqual({ estado: "vigente", dias: 31 });
    expect(estadoVencimiento(null, "2026-11-09")).toBeNull();
  });
});
