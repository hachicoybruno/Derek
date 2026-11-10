import type { Metadata } from "next";
import { obtenerUmbrales } from "@/lib/datos";
import { Calculadora } from "./calculadora";

export const metadata: Metadata = { title: "¿Lo compro?" };

export default async function PaginaCalculadora() {
  const umbrales = await obtenerUmbrales();
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">¿Lo compro?</h1>
        <p className="text-slate-600">Calcula tu ganancia antes de cerrar el trato.</p>
      </div>
      <Calculadora umbrales={umbrales} />
    </div>
  );
}
