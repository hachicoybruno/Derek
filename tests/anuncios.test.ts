import { describe, expect, it } from "vitest";
import { GeneradorIA } from "@/lib/anuncios/ia";
import { GeneradorPlantillas } from "@/lib/anuncios/plantillas";
import type { DatosAnuncio } from "@/lib/anuncios/tipos";

const datos: DatosAnuncio = {
  marca: "Toyota",
  modelo: "Yaris",
  anio: 2018,
  version: "GLI",
  color: "Plata",
  kilometraje: 85000,
  transmision: "mecanica",
  combustible: "gasolina",
  precio: 36000,
  soatVigente: true,
  revisionVigente: true,
};

describe("anuncios con plantillas", async () => {
  const anuncios = await new GeneradorPlantillas().generar(datos);

  it("genera las 3 versiones", () => {
    expect(anuncios.map((a) => a.plataforma)).toEqual(["marketplace", "neoauto", "tiktok"]);
  });

  it("incluye los datos del auto y el precio en soles", () => {
    for (const a of anuncios) {
      expect(a.texto).toContain("Toyota");
      expect(a.texto).toContain("Yaris");
      expect(a.texto).toContain("S/ 36,000");
    }
    expect(anuncios[0].texto).toContain("85,000 km");
    expect(anuncios[1].texto).toContain("Transmisión: Mecánica");
    expect(anuncios[0].texto).toContain("SOAT vigente");
  });

  it("TikTok es corto y lleva hashtags", () => {
    expect(anuncios[2].texto.length).toBeLessThan(300);
    expect(anuncios[2].texto).toContain("#toyotayaris");
  });

  it("no rompe con datos mínimos", async () => {
    const [m, n, t] = await new GeneradorPlantillas().generar({ marca: "Kia", modelo: "Río", anio: 2020 });
    expect(m.texto).toContain("Precio conversable");
    expect(n.texto).not.toContain("undefined");
    expect(t.texto).toContain("#kiario");
  });
});

describe("generador IA", () => {
  it("usa las plantillas como respaldo mientras no esté implementado", async () => {
    const ia = new GeneradorIA("clave", new GeneradorPlantillas());
    const original = console.error;
    console.error = () => {};
    const anuncios = await ia.generar(datos);
    console.error = original;
    expect(anuncios).toHaveLength(3);
  });
});
