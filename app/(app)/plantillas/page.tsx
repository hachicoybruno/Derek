import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import { Aviso, Tarjeta } from "@/components/ui";
import { obtenerPlantilla } from "@/lib/datos";
import { AVISO_LEGAL, INFO_PLANTILLA, TIPOS_PLANTILLA } from "@/lib/documentos/plantillas-base";
import { fecha } from "@/lib/formato";

export const metadata: Metadata = { title: "Plantillas de documentos" };

export default async function Plantillas() {
  const estados = await Promise.all(TIPOS_PLANTILLA.map(async (tipo) => ({ tipo, ...(await obtenerPlantilla(tipo)) })));
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Plantillas de documentos</h1>
        <p className="text-slate-600">Edita los textos del contrato, el recibo y la constancia de entrega.</p>
      </div>
      <Aviso tipo="alerta">
        <strong>{AVISO_LEGAL}</strong> FLIPDESK no brinda asesoría legal.
      </Aviso>
      <Tarjeta className="divide-y divide-slate-100 p-0">
        {estados.map(({ tipo, editada, actualizada }) => (
          <Link key={tipo} href={`/plantillas/${tipo}`} className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-slate-50">
            <FileText className="size-6 text-marca-700" aria-hidden />
            <span className="flex-1">
              <span className="block font-semibold">{INFO_PLANTILLA[tipo].nombre}</span>
              <span className="block text-sm text-slate-500">
                {editada && actualizada ? `Editada el ${fecha(actualizada.slice(0, 10))}` : "Plantilla original"}
              </span>
            </span>
            <ChevronRight className="size-5 text-slate-400" aria-hidden />
          </Link>
        ))}
      </Tarjeta>
    </div>
  );
}
