import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { obtenerAuto } from "@/lib/datos";
import { hoyLima } from "@/lib/fechas";
import { FormularioAuto } from "../../formulario-auto";
import { BotonEliminarAuto } from "../boton-eliminar-auto";

export const metadata: Metadata = { title: "Editar auto" };

export default async function EditarAuto({ params }: PageProps<"/autos/[id]/editar">) {
  const { id } = await params;
  const { auto } = await obtenerAuto(id);
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href={`/autos/${id}`} className="inline-flex min-h-11 items-center gap-1 font-semibold text-marca-700">
        <ChevronLeft className="size-5" aria-hidden /> Volver a la ficha
      </Link>
      <h1 className="text-2xl font-bold">
        Editar {auto.marca} {auto.modelo}
      </h1>
      <FormularioAuto auto={auto} hoy={hoyLima()} />
      <div className="border-t border-slate-200 pt-4">
        <BotonEliminarAuto id={id} />
      </div>
    </div>
  );
}
