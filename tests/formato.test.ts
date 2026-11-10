import { describe, expect, it } from "vitest";
import { fecha, formatoPlaca, normalizarPlaca, parsearMonto, porcentaje, soles, solesConSigno } from "@/lib/formato";
import { diasEntre, esFechaISO, hoyLima, rangoMes, sumarDias } from "@/lib/fechas";

describe("formatos", () => {
  it("soles en formato peruano", () => {
    const sp = (t: string) => t.replace(/\u00a0/g, " ");
    expect(sp(soles(45250.5))).toBe("S/ 45,250.50");
    expect(sp(soles(45000))).toBe("S/ 45,000");
    expect(sp(soles(45250.5, { redondear: true }))).toBe("S/ 45,251");
    expect(soles(null)).toBe("—");
    expect(sp(solesConSigno(3200))).toBe("+S/ 3,200");
    expect(sp(solesConSigno(-500))).toBe("−S/ 500");
  });

  it("porcentaje", () => {
    expect(porcentaje(12.345)).toBe("12.3 %");
  });

  it("fecha DD/MM/AAAA", () => {
    expect(fecha("2026-03-07")).toBe("07/03/2026");
    expect(fecha(null)).toBe("—");
  });

  it("placas", () => {
    expect(normalizarPlaca(" abc-123 ")).toBe("ABC123");
    expect(formatoPlaca("abc123")).toBe("ABC-123");
    expect(formatoPlaca("A1B2C3D")).toBe("A1B2C3D");
  });

  it("montos escritos por el usuario", () => {
    expect(parsearMonto("45000")).toBe(45000);
    expect(parsearMonto("45,000")).toBe(45000);
    expect(parsearMonto("S/ 45,000")).toBe(45000);
    expect(parsearMonto("1,250.50")).toBe(1250.5);
    expect(parsearMonto("1250,50")).toBe(1250.5);
    expect(parsearMonto("1.250,50")).toBe(1250.5);
    expect(parsearMonto("1,250,000")).toBe(1250000);
    expect(parsearMonto("45 000")).toBe(45000);
    expect(parsearMonto("")).toBeNull();
    expect(parsearMonto("abc")).toBeNull();
  });
});

describe("fechas en hora de Lima", () => {
  it("hoy en Lima difiere de UTC cerca de medianoche", () => {
    // 10/11/2026 03:00 UTC = 09/11/2026 22:00 en Lima (UTC−5)
    expect(hoyLima(new Date("2026-11-10T03:00:00Z"))).toBe("2026-11-09");
    expect(hoyLima(new Date("2026-11-10T06:00:00Z"))).toBe("2026-11-10");
  });

  it("aritmética de fechas", () => {
    expect(diasEntre("2026-10-01", "2026-11-09")).toBe(39);
    expect(sumarDias("2026-12-20", 30)).toBe("2027-01-19");
    expect(rangoMes("2026-02-15")).toEqual({ desde: "2026-02-01", hasta: "2026-02-28" });
    expect(esFechaISO("2026-02-30")).toBe(false);
    expect(esFechaISO("2026-02-28")).toBe(true);
  });
});
