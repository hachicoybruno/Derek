import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Download, Plus, Search } from "lucide-react";
import { TarjetaAuto } from "@/components/tarjeta-auto";
import { BotonLink, cx, Vacio } from "@/components/ui";
import { BotonDatosEjemplo } from "@/components/boton-datos-ejemplo";
import { listarAutos, miniaturasDeAutos } from "@/lib/datos";
import { ESTADOS, ETIQUETA_ESTADO, esEstado } from "@/lib/dominio";
import { hoyLima } from "@/lib/fechas";

export const metadata: Metadata = { title: "Mis autos" };

export default async function Autos({ searchParams }: PageProps<"/autos">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const estado = typeof params.estado === "string" && esEstado(params.estado) ? params.estado : undefined;

  const autos = await listarAutos({ estado, q });
  const miniaturas = await miniaturasDeAutos(autos.map((a) => a.id));
  const hoy = hoyLima();
  const filtrado = Boolean(q || estado);

  const enlaceFiltro = (e?: string) => {
    const sp = new URLSearchParams();
    if (e) sp.set("estado", e);
    if (q) sp.set("q", q);
    const s = sp.toString();
    return s ? `/autos?${s}` : "/autos";
  };
  const exportar = `/autos/exportar${enlaceFiltro(estado).replace("/autos", "")}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">
          Mis autos <span className="text-base font-semibold text-slate-500">({autos.length})</span>
        </h1>
        <div className="flex gap-2">
          {autos.length > 0 && (
            <a href={exportar} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 font-semibold text-marca-700 hover:bg-marca-50" download>
              <Download className="size-5" aria-hidden /> Excel
            </a>
          )}
          <div className="hidden md:block">
            <BotonLink href="/autos/nuevo">
              <Plus className="size-5" aria-hidden /> Nuevo auto
            </BotonLink>
          </div>
        </div>
      </div>

      <Form action="/autos" role="search" className="relative">
        {estado && <input type="hidden" name="estado" value={estado} />}
        <label htmlFor="buscar" className="sr-only">
          Buscar por placa o modelo
        </label>
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400" />
        <input
          id="buscar"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Buscar placa, marca o modelo"
          enterKeyHint="search"
          autoComplete="off"
          className="block min-h-12 w-full rounded-xl border-0 bg-white pr-3 pl-10 ring-1 ring-slate-300 focus:ring-2 focus:ring-marca-600 focus:outline-none"
        />
      </Form>

      <nav aria-label="Filtrar por estado" className="-mx-4 overflow-x-auto px-4">
        <ul className="flex gap-2 pb-1">
          {[undefined, ...ESTADOS].map((e) => {
            const activo = e === estado;
            return (
              <li key={e ?? "todos"}>
                <Link
                  href={enlaceFiltro(e)}
                  aria-current={activo ? "page" : undefined}
                  className={cx(
                    "inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold whitespace-nowrap ring-1",
                    activo ? "bg-marca-700 text-white ring-marca-700" : "bg-white text-slate-700 ring-slate-300",
                  )}
                >
                  {e ? ETIQUETA_ESTADO[e] : "Todos"}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {autos.length === 0 ? (
        filtrado ? (
          <Vacio titulo="No hay autos con ese filtro" texto="Prueba con otra placa o modelo, o quita el filtro.">
            <BotonLink href="/autos" variante="secundario">
              Ver todos
            </BotonLink>
          </Vacio>
        ) : (
          <Vacio titulo="Aún no tienes autos" texto="Registra tu primer auto en menos de un minuto o carga autos de ejemplo para ver cómo funciona.">
            <BotonLink href="/autos/nuevo" tamano="lg">
              <Plus className="size-5" aria-hidden /> Registrar mi primer auto
            </BotonLink>
            <BotonDatosEjemplo />
          </Vacio>
        )
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {autos.map((auto) => (
            <li key={auto.id}>
              <TarjetaAuto auto={auto} hoy={hoy} miniatura={miniaturas.get(auto.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
