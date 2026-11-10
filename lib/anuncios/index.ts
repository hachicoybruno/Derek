import { GeneradorIA } from "./ia";
import { GeneradorPlantillas } from "./plantillas";
import type { GeneradorAnuncios } from "./tipos";

export * from "./tipos";

/** Elige el generador según ANUNCIOS_PROVEEDOR ("plantillas" por defecto). */
export function obtenerGenerador(): GeneradorAnuncios {
  const plantillas = new GeneradorPlantillas();
  const clave = process.env.ANUNCIOS_IA_API_KEY;
  if (process.env.ANUNCIOS_PROVEEDOR === "ia" && clave) return new GeneradorIA(clave, plantillas);
  return plantillas;
}
