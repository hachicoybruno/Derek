import { COLOR_ESTADO, ETIQUETA_ESTADO, type Estado } from "@/lib/dominio";
import type { ColorSemaforo } from "@/lib/calculos";
import { cx } from "./ui";

export function BadgeEstado({ estado, className }: { estado: Estado; className?: string }) {
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1", COLOR_ESTADO[estado], className)}>
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}

const estilosSemaforo: Record<ColorSemaforo, { clase: string; texto: string }> = {
  verde: { clase: "bg-emerald-600 text-white", texto: "Buen negocio" },
  amarillo: { clase: "bg-amber-400 text-amber-950", texto: "Margen justo" },
  rojo: { clase: "bg-red-600 text-white", texto: "No conviene" },
};

export function BadgeSemaforo({ color, texto }: { color: ColorSemaforo; texto?: string }) {
  const e = estilosSemaforo[color];
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold", e.clase)}>
      <span aria-hidden className="size-2.5 rounded-full bg-current opacity-80" />
      {texto ?? e.texto}
    </span>
  );
}

export function textoSemaforo(color: ColorSemaforo) {
  return estilosSemaforo[color].texto;
}

/** Texto de ganancia coloreado según el signo. */
export function colorGanancia(valor: number | null | undefined) {
  if (valor === null || valor === undefined) return "text-slate-500";
  return valor > 0 ? "text-emerald-700" : valor < 0 ? "text-red-700" : "text-slate-700";
}
