import Link from "next/link";
import type { Suscripcion } from "@/lib/suscripcion";
import { cx } from "./ui";

/** Franja superior con el estado de la prueba o de la suscripción. */
export function AvisoSuscripcion({ suscripcion: s }: { suscripcion: Suscripcion }) {
  let texto: string | null = null;
  let urgente = false;

  if (s.enPrueba && s.diasRestantesPrueba !== null) {
    texto =
      s.diasRestantesPrueba <= 1
        ? "Tu prueba gratis termina hoy."
        : `Te quedan ${s.diasRestantesPrueba} días de prueba gratis (plan Pro).`;
    urgente = s.diasRestantesPrueba <= 3;
  } else if (!s.planEfectivo) {
    urgente = true;
    texto =
      s.estado === "suspendida"
        ? "No pudimos cobrar tu suscripción. Actualiza tu forma de pago para seguir agregando autos."
        : s.estado === "prueba"
          ? "Tu prueba gratis terminó. Elige un plan para seguir agregando autos; tus datos siguen guardados."
          : "Tu suscripción terminó. Elige un plan para seguir agregando autos; tus datos siguen guardados.";
  } else if (s.estado === "cancelada" && s.periodoHasta) {
    const [a, m, d] = s.periodoHasta.slice(0, 10).split("-");
    texto = `Cancelaste tu suscripción. Tienes acceso hasta el ${d}/${m}/${a}.`;
  }

  if (!texto) return null;
  return (
    <Link
      href="/suscripcion"
      className={cx(
        "mb-4 flex min-h-11 items-center justify-between gap-3 rounded-xl px-4 py-2 text-sm font-semibold ring-1",
        urgente ? "bg-red-50 text-red-900 ring-red-200" : "bg-marca-50 text-marca-900 ring-marca-200",
      )}
    >
      <span>{texto}</span>
      <span className="shrink-0 underline">{s.planEfectivo && !s.enPrueba ? "Ver" : "Elegir plan"}</span>
    </Link>
  );
}

/** Tarjeta que reemplaza una función no incluida en el plan actual. */
export function FuncionPro({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="space-y-2 rounded-2xl border-2 border-dashed border-marca-200 bg-marca-50/50 p-4">
      <p className="font-bold text-marca-900">🔒 {titulo}</p>
      <p className="text-sm text-slate-700">{texto}</p>
      <Link href="/suscripcion" className="inline-flex min-h-11 items-center font-semibold text-marca-700 underline">
        Pásate a Pro
      </Link>
    </div>
  );
}
