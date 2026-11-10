import type { Metadata } from "next";
import { hoyLima } from "@/lib/fechas";
import { FormularioAuto } from "../formulario-auto";

export const metadata: Metadata = { title: "Nuevo auto" };

export default function NuevoAuto() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Nuevo auto</h1>
        <p className="text-slate-600">Solo lo básico. Fotos, gastos y documentos los agregas después.</p>
      </div>
      <FormularioAuto hoy={hoyLima()} />
    </div>
  );
}
