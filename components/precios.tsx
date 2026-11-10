import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { INFO_PLANES, PLANES, DIAS_PRUEBA, type Plan } from "@/lib/planes";
import { cx } from "./ui";

/** Tarjetas de planes (landing y página de suscripción). */
export function TablaPrecios({ accion, planActual }: { accion: (plan: Plan) => ReactNode; planActual?: Plan | null }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {PLANES.map((id) => {
        const p = INFO_PLANES[id];
        return (
          <div
            key={id}
            className={cx(
              "relative flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1",
              p.destacado ? "ring-2 ring-marca-600 shadow-md" : "ring-slate-200",
            )}
          >
            {p.destacado && (
              <span className="absolute -top-3 left-5 rounded-full bg-marca-700 px-3 py-0.5 text-xs font-bold text-white">Más elegido</span>
            )}
            {planActual === id && (
              <span className="absolute -top-3 right-5 rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-bold text-white">Tu plan</span>
            )}
            <div>
              <h3 className="text-xl font-bold">{p.nombre}</h3>
              <p className="text-sm text-slate-600">{p.descripcion}</p>
            </div>
            <div>
              <p className="text-3xl font-black">
                S/ {p.precioSoles}
                <span className="text-base font-semibold text-slate-500"> /mes</span>
              </p>
              <p className="text-xs text-slate-500">Se cobra US$ {p.precioUsd} al mes con PayPal o tarjeta</p>
            </div>
            <ul className="flex-1 space-y-2 text-sm">
              {p.caracteristicas.map((c) => (
                <li key={c} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                  {c}
                </li>
              ))}
            </ul>
            {accion(id)}
          </div>
        );
      })}
      <p className="text-center text-sm text-slate-600 md:col-span-3">
        {DIAS_PRUEBA} días gratis con todas las funciones Pro. Sin tarjeta para empezar. Cancela cuando quieras.
      </p>
    </div>
  );
}
