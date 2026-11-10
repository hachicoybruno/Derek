import { describe, expect, it } from "vitest";
import { INFO_PLANES, mensajeLimitePlan } from "@/lib/planes";

// lib/suscripcion.ts importa "server-only"; se prueba la lógica pura copiándola vía import dinámico con mock.
import { vi } from "vitest";
vi.mock("server-only", () => ({}));
const { calcularPlanEfectivo } = await import("@/lib/suscripcion");

const ahora = new Date("2026-11-10T12:00:00Z");
const dias = (n: number) => new Date(ahora.getTime() + n * 86_400_000).toISOString();

describe("planes", () => {
  it("precios según lo definido", () => {
    expect([INFO_PLANES.basico.precioSoles, INFO_PLANES.pro.precioSoles, INFO_PLANES.concesionario.precioSoles]).toEqual([49, 119, 249]);
    expect(INFO_PLANES.basico.limiteStock).toBe(5);
    expect(INFO_PLANES.pro.limiteStock).toBeNull();
  });

  it("traduce los errores de límite de la base de datos", () => {
    expect(mensajeLimitePlan("LIMITE_PLAN")).toContain("hasta 5 autos");
    expect(mensajeLimitePlan("SIN_PLAN")).toContain("Elige un plan");
    expect(mensajeLimitePlan("otro error")).toBeNull();
  });
});

describe("plan efectivo (igual que la función SQL)", () => {
  it("prueba vigente → Pro; vencida → sin acceso", () => {
    expect(calcularPlanEfectivo({ estado: "prueba", plan: "pro", prueba_hasta: dias(3), periodo_hasta: null }, ahora)).toBe("pro");
    expect(calcularPlanEfectivo({ estado: "prueba", plan: "pro", prueba_hasta: dias(-1), periodo_hasta: null }, ahora)).toBeNull();
  });

  it("activa con 5 días de gracia", () => {
    expect(calcularPlanEfectivo({ estado: "activa", plan: "basico", prueba_hasta: null, periodo_hasta: dias(-4) }, ahora)).toBe("basico");
    expect(calcularPlanEfectivo({ estado: "activa", plan: "basico", prueba_hasta: null, periodo_hasta: dias(-6) }, ahora)).toBeNull();
  });

  it("cancelada conserva acceso hasta fin de periodo; suspendida/vencida no", () => {
    expect(calcularPlanEfectivo({ estado: "cancelada", plan: "pro", prueba_hasta: null, periodo_hasta: dias(2) }, ahora)).toBe("pro");
    expect(calcularPlanEfectivo({ estado: "cancelada", plan: "pro", prueba_hasta: null, periodo_hasta: dias(-1) }, ahora)).toBeNull();
    expect(calcularPlanEfectivo({ estado: "suspendida", plan: "pro", prueba_hasta: null, periodo_hasta: dias(10) }, ahora)).toBeNull();
  });
});
