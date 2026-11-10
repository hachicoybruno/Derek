import { aBloques, reemplazarVariables } from "./motor";
import { generarPdf, type Firmante } from "./pdf";
import { INFO_PLANTILLA, type TipoPlantilla } from "./plantillas-base";
import { construirVariables, type AutoDocumento, type ParametrosDocumento, type Persona } from "./variables";

/** De plantilla + datos a PDF. */
export async function documentoPdf(
  tipo: TipoPlantilla,
  contenido: string,
  datos: { auto: AutoDocumento; vendedor: Persona; comprador: Persona; ciudad: string; hoy: string; params: ParametrosDocumento },
) {
  const variables = construirVariables(tipo, datos);
  const bloques = aBloques(reemplazarVariables(contenido, variables));
  const firmante = (p: Persona): Firmante => ({ nombre: p.nombre, dni: p.dni });
  return generarPdf(bloques, {
    titulo: `${INFO_PLANTILLA[tipo].nombre} · ${datos.auto.marca} ${datos.auto.modelo}`,
    firmantes: { vendedor: firmante(datos.vendedor), comprador: firmante(datos.comprador) },
  });
}

export function respuestaPdf(bytes: Uint8Array, archivo: string) {
  return new Response(bytes as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${archivo}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
