import Link from "next/link";
import { CarFront } from "lucide-react";
import { calcularAuto } from "@/lib/calculos";
import type { AutoResumen } from "@/lib/datos";
import { formatoPlaca, solesConSigno, soles, porcentaje } from "@/lib/formato";
import { BadgeEstado, colorGanancia } from "./badges";

export function TarjetaAuto({ auto, hoy, miniatura, verCostos = true }: { auto: AutoResumen; hoy: string; miniatura?: string; verCostos?: boolean }) {
  const c = calcularAuto(auto, hoy);
  const vendido = auto.estado === "vendido";
  const ganancia = vendido ? c.ganancia : c.gananciaProyectada;
  const margen = vendido ? c.margen : c.margenProyectado;

  return (
    <Link
      href={`/autos/${auto.id}`}
      className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 transition hover:ring-marca-300 active:bg-slate-50"
    >
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 sm:size-24">
        {miniatura ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={miniatura} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
        ) : (
          <CarFront aria-hidden className="size-9 text-slate-400" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-bold text-slate-900">
            {auto.marca} {auto.modelo} <span className="font-normal text-slate-500">{auto.anio}</span>
          </p>
          <BadgeEstado estado={auto.estado} className="shrink-0" />
        </div>
        <p className="font-mono text-sm font-semibold tracking-wider text-slate-600">{formatoPlaca(auto.placa)}</p>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 text-sm">
          {verCostos ? (
            <span className="text-slate-600">
              Costo <strong className="text-slate-900">{soles(c.costoTotal, { redondear: true })}</strong>
            </span>
          ) : (
            <span className="text-slate-600">
              {vendido ? "Vendido en" : "Precio"}{" "}
              <strong className="text-slate-900">{soles(vendido ? auto.precio_venta_final : auto.precio_venta_objetivo, { redondear: true })}</strong>
            </span>
          )}
          {verCostos && ganancia !== null && (
            <span className={colorGanancia(ganancia)}>
              {vendido ? "Ganancia" : "Proyectada"}{" "}
              <strong>{solesConSigno(ganancia, { redondear: true })}</strong>
              {margen !== null && <span className="text-xs"> ({porcentaje(margen)})</span>}
            </span>
          )}
          {c.diasEnStock !== null && (
            <span className="text-slate-600">
              {c.diasEnStock} {c.diasEnStock === 1 ? "día" : "días"}
              {vendido ? " hasta vender" : " en stock"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
