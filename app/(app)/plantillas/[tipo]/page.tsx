import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Aviso } from "@/components/ui";
import { obtenerPlantilla } from "@/lib/datos";
import { AVISO_LEGAL, esTipoPlantilla, INFO_PLANTILLA, PLANTILLAS_BASE, VARIABLES } from "@/lib/documentos/plantillas-base";
import { EditorPlantilla } from "./editor";
import { requerirUsuario } from "@/lib/auth";

export async function generateMetadata({ params }: PageProps<"/plantillas/[tipo]">): Promise<Metadata> {
  const { tipo } = await params;
  return { title: esTipoPlantilla(tipo) ? `Plantilla: ${INFO_PLANTILLA[tipo].nombre}` : "Plantilla" };
}

export default async function EditarPlantilla({ params }: PageProps<"/plantillas/[tipo]">) {
  const { tipo } = await params;
  if (!esTipoPlantilla(tipo)) notFound();
  const [{ contenido, editada }, { esDueno }] = await Promise.all([obtenerPlantilla(tipo), requerirUsuario()]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/plantillas" className="inline-flex min-h-11 items-center gap-1 font-semibold text-marca-700">
        <ChevronLeft className="size-5" aria-hidden /> Plantillas
      </Link>
      <h1 className="text-2xl font-bold">{INFO_PLANTILLA[tipo].nombre}</h1>
      <Aviso tipo="alerta">
        <strong>{AVISO_LEGAL}</strong> Este texto es un modelo general. Antes de usarlo, haz que un abogado lo revise y lo adapte a
        tu caso. El aviso se imprime siempre al pie de cada PDF.
      </Aviso>
      {!esDueno ? (
        <>
          <Aviso tipo="info">Solo el dueño del negocio puede editar las plantillas.</Aviso>
          <pre className="rounded-xl bg-white p-3 text-sm whitespace-pre-wrap ring-1 ring-slate-200">{contenido}</pre>
        </>
      ) : (
      <EditorPlantilla
        tipo={tipo}
        inicial={contenido}
        original={PLANTILLAS_BASE[tipo]}
        editada={editada}
        variables={VARIABLES[tipo]}
      />
      )}
    </div>
  );
}
