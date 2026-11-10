import { notFound } from "next/navigation";
import type { NextRequest } from "next/server";
import { obtenerPerfil } from "@/lib/datos";
import { documentoPdf, respuestaPdf } from "@/lib/documentos/generar";
import { esTipoPlantilla, INFO_PLANTILLA } from "@/lib/documentos/plantillas-base";
import { EJEMPLO_VISTA_PREVIA } from "@/lib/documentos/variables";
import { hoyLima } from "@/lib/fechas";

/** Vista previa del texto (aún sin guardar) con datos ficticios. */
export async function POST(request: NextRequest, { params }: RouteContext<"/plantillas/[tipo]/vista-previa">) {
  const { tipo } = await params;
  if (!esTipoPlantilla(tipo)) notFound();
  const perfil = await obtenerPerfil(); // también exige sesión
  const form = await request.formData();
  const contenido = String(form.get("contenido") ?? "").slice(0, 20000);

  const bytes = await documentoPdf(tipo, contenido || " ", {
    ...EJEMPLO_VISTA_PREVIA,
    ciudad: perfil.ciudad ?? "Lima",
    hoy: hoyLima(),
  });
  return respuestaPdf(bytes, `vista-previa-${INFO_PLANTILLA[tipo].archivo}.pdf`);
}
