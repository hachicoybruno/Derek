import type { Metadata } from "next";
import { hoyLima } from "@/lib/fechas";
import { FormularioAuto } from "../formulario-auto";

export const metadata: Metadata = { title: "Nuevo auto" };

export default async function NuevoAuto({ searchParams }: PageProps<"/autos/nuevo">) {
  // Valores que llegan desde la calculadora "¿Lo compro?".
  const sp = await searchParams;
  const inicial: Record<string, string> = {};
  for (const campo of ["precio_compra", "precio_venta_objetivo", "estado"]) {
    const valor = sp[campo];
    if (typeof valor === "string" && valor.length < 20) inicial[campo] = valor;
  }
  if (inicial.estado && !["en_stock", "en_evaluacion", "reservado"].includes(inicial.estado)) delete inicial.estado;
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Nuevo auto</h1>
        <p className="text-slate-600">Solo lo básico. Fotos, gastos y documentos los agregas después.</p>
      </div>
      <FormularioAuto hoy={hoyLima()} inicial={inicial} />
    </div>
  );
}
