"use client";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { cx } from "./ui";

function Interno({ children, etiqueta, className }: { children: ReactNode; etiqueta: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      aria-label={etiqueta}
      disabled={pending}
      className={cx("inline-flex size-11 items-center justify-center rounded-full text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50", className)}
    >
      {children}
    </button>
  );
}

/** Botón pequeño que pide confirmación antes de enviar una acción (borrar, etc.). */
export function BotonConfirmar({
  accion,
  campos,
  mensaje,
  etiqueta,
  children,
  className,
}: {
  accion: (formData: FormData) => Promise<void>;
  campos: Record<string, string>;
  mensaje: string;
  etiqueta: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <form
      action={accion}
      onSubmit={(e) => {
        if (!confirm(mensaje)) e.preventDefault();
      }}
    >
      {Object.entries(campos).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <Interno etiqueta={etiqueta} className={className}>
        {children}
      </Interno>
    </form>
  );
}
