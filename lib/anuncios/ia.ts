import type { Anuncio, DatosAnuncio, GeneradorAnuncios } from "./tipos";

/**
 * Punto de conexión para generar anuncios con IA.
 *
 * Para activarlo:
 *   1. Define ANUNCIOS_PROVEEDOR=ia y ANUNCIOS_IA_API_KEY en las variables de entorno.
 *   2. Implementa `llamarModelo` con el proveedor elegido (respetando el contrato `Anuncio[]`).
 *
 * Mientras no esté implementado, `obtenerGenerador()` usa las plantillas como respaldo.
 * Nunca se envían al modelo datos personales (placa, DNI, teléfonos): solo `DatosAnuncio`.
 */
export class GeneradorIA implements GeneradorAnuncios {
  readonly nombre = "ia";
  constructor(
    private readonly apiKey: string,
    private readonly respaldo: GeneradorAnuncios,
  ) {}

  async generar(datos: DatosAnuncio): Promise<Anuncio[]> {
    try {
      return await this.llamarModelo(datos);
    } catch (error) {
      console.error("[anuncios] Falló la IA, se usan plantillas:", error);
      return this.respaldo.generar(datos);
    }
  }

  protected async llamarModelo(datos: DatosAnuncio): Promise<Anuncio[]> {
    void datos;
    void this.apiKey;
    throw new Error("Generador de IA no implementado todavía.");
  }
}
