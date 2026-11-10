"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Calculator, CarFront, House, Plus } from "lucide-react";
import { cx } from "./ui";

const items = [
  { href: "/dashboard", texto: "Inicio", icono: House },
  { href: "/autos", texto: "Autos", icono: CarFront },
  { href: "/autos/nuevo", texto: "Nuevo", icono: Plus, destacado: true },
  { href: "/calculadora", texto: "¿Lo compro?", icono: Calculator },
  { href: "/vencimientos", texto: "Vencimientos", icono: Bell },
];

export function BarraInferior({ alertas = 0 }: { alertas?: number }) {
  const path = usePathname();
  const activo = (href: string) =>
    href === "/autos" ? path === "/autos" || (path.startsWith("/autos/") && path !== "/autos/nuevo") : path === href;

  return (
    <nav
      aria-label="Navegación principal"
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(({ href, texto, icono: Icono, destacado }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={activo(href) ? "page" : undefined}
              className={cx(
                "relative flex min-h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold",
                activo(href) ? "text-marca-700" : "text-slate-500",
              )}
            >
              {destacado ? (
                <span className="flex size-11 items-center justify-center rounded-full bg-marca-700 text-white shadow-md">
                  <Icono className="size-6" aria-hidden />
                </span>
              ) : (
                <Icono className="size-6" aria-hidden />
              )}
              <span className={destacado ? "sr-only" : undefined}>{texto}</span>
              {href === "/vencimientos" && alertas > 0 && (
                <span className="absolute top-2 right-[calc(50%-1.25rem)] min-w-5 rounded-full bg-red-600 px-1 text-center text-[11px] leading-5 text-white">
                  {alertas > 9 ? "9+" : alertas}
                  <span className="sr-only"> documentos por vencer</span>
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function MenuEscritorio() {
  const path = usePathname();
  return (
    <nav aria-label="Navegación principal" className="hidden items-center gap-1 md:flex">
      {items.map(({ href, texto }) => (
        <Link
          key={href}
          href={href}
          aria-current={path === href ? "page" : undefined}
          className={cx(
            "rounded-lg px-3 py-2 text-sm font-semibold",
            path === href ? "bg-marca-50 text-marca-800" : "text-slate-600 hover:bg-slate-100",
          )}
        >
          {href === "/autos/nuevo" ? "+ Nuevo auto" : texto}
        </Link>
      ))}
    </nav>
  );
}
