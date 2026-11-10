import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...clases: (string | false | null | undefined)[]) {
  return clases.filter(Boolean).join(" ");
}

type Variante = "primario" | "secundario" | "peligro" | "fantasma" | "exito";
type Tamano = "md" | "lg";

const variantes: Record<Variante, string> = {
  primario: "bg-marca-700 text-white hover:bg-marca-800 active:bg-marca-900 disabled:bg-marca-200",
  secundario: "bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 active:bg-slate-100",
  peligro: "bg-white text-red-700 ring-1 ring-red-300 hover:bg-red-50 active:bg-red-100",
  fantasma: "text-marca-700 hover:bg-marca-50 active:bg-marca-100",
  exito: "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800",
};

const tamanos: Record<Tamano, string> = {
  md: "min-h-11 px-4 text-base",
  lg: "min-h-13 px-5 text-lg",
};

export function clasesBoton(variante: Variante = "primario", tamano: Tamano = "md", extra?: string) {
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors select-none disabled:cursor-not-allowed disabled:opacity-60",
    variantes[variante],
    tamanos[tamano],
    extra,
  );
}

export function Boton({
  variante,
  tamano,
  className,
  ...props
}: ComponentProps<"button"> & { variante?: Variante; tamano?: Tamano }) {
  return <button className={clasesBoton(variante, tamano, className)} {...props} />;
}

export function BotonLink({
  variante,
  tamano,
  className,
  ...props
}: ComponentProps<typeof Link> & { variante?: Variante; tamano?: Tamano }) {
  return <Link className={clasesBoton(variante, tamano, className)} {...props} />;
}

export function Tarjeta({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200", className)} {...props} />;
}

export function Seccion({ titulo, accion, children }: { titulo: string; accion?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex min-h-11 items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900">{titulo}</h2>
        {accion}
      </div>
      {children}
    </section>
  );
}

const claseCampo =
  "block w-full min-h-12 rounded-xl border-0 bg-white px-3 py-2 text-slate-900 ring-1 ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-marca-600 focus:outline-none aria-invalid:ring-red-500";

export function Campo({
  etiqueta,
  error,
  ayuda,
  children,
  className,
}: {
  etiqueta: string;
  error?: string;
  ayuda?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("block space-y-1", className)}>
      <span className="text-sm font-semibold text-slate-700">{etiqueta}</span>
      {children}
      {ayuda && !error && <span className="block text-sm text-slate-500">{ayuda}</span>}
      {error && (
        <span role="alert" className="block text-sm font-medium text-red-700">
          {error}
        </span>
      )}
    </label>
  );
}

export function Entrada({ className, ...props }: ComponentProps<"input">) {
  return <input className={cx(claseCampo, className)} {...props} />;
}

export function EntradaSoles({ className, ...props }: ComponentProps<"input">) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-semibold text-slate-500">
        S/
      </span>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className={cx(claseCampo, "pl-10", className)}
        {...props}
      />
    </div>
  );
}

export function Selector({ className, ...props }: ComponentProps<"select">) {
  return <select className={cx(claseCampo, "pr-8", className)} {...props} />;
}

export function AreaTexto({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cx(claseCampo, "min-h-24", className)} {...props} />;
}

export function Aviso({
  tipo = "info",
  children,
  className,
}: {
  tipo?: "info" | "error" | "exito" | "alerta";
  children: ReactNode;
  className?: string;
}) {
  const estilos = {
    info: "bg-marca-50 text-marca-900 ring-marca-200",
    error: "bg-red-50 text-red-800 ring-red-200",
    exito: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    alerta: "bg-amber-50 text-amber-900 ring-amber-200",
  }[tipo];
  return (
    <div role={tipo === "error" ? "alert" : "status"} className={cx("rounded-xl p-3 text-sm ring-1", estilos, className)}>
      {children}
    </div>
  );
}

export function Vacio({ titulo, texto, children }: { titulo: string; texto?: string; children?: ReactNode }) {
  return (
    <Tarjeta className="flex flex-col items-center gap-3 py-10 text-center">
      <p className="text-lg font-bold text-slate-800">{titulo}</p>
      {texto && <p className="max-w-sm text-slate-600">{texto}</p>}
      {children}
    </Tarjeta>
  );
}

export function Dato({ etiqueta, valor, className }: { etiqueta: string; valor: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-sm text-slate-500">{etiqueta}</dt>
      <dd className="font-semibold text-slate-900">{valor ?? "—"}</dd>
    </div>
  );
}
