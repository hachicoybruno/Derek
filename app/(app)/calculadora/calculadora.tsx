"use client";
import Link from "next/link";
import { useState } from "react";
import { BadgeSemaforo } from "@/components/badges";
import { Campo, clasesBoton, cx, EntradaSoles, Tarjeta } from "@/components/ui";
import { evaluarCompra, type Umbrales } from "@/lib/calculos";
import { parsearMonto, porcentaje, soles, solesConSigno } from "@/lib/formato";

const fondo = { verde: "bg-emerald-50 ring-emerald-300", amarillo: "bg-amber-50 ring-amber-300", rojo: "bg-red-50 ring-red-300" };

export function Calculadora({ umbrales }: { umbrales: Umbrales }) {
  const [compra, setCompra] = useState("");
  const [reparaciones, setReparaciones] = useState("");
  const [venta, setVenta] = useState("");

  const precioCompra = parsearMonto(compra);
  const precioVenta = parsearMonto(venta);
  const rep = parsearMonto(reparaciones) ?? 0;
  const listo = precioCompra !== null && precioVenta !== null && precioVenta > 0;
  const r = listo ? evaluarCompra({ precioCompra, reparaciones: rep, precioVenta }, umbrales) : null;

  const registrar = new URLSearchParams({ estado: "en_evaluacion" });
  if (precioCompra !== null) registrar.set("precio_compra", String(precioCompra));
  if (precioVenta !== null) registrar.set("precio_venta_objetivo", String(precioVenta));

  return (
    <div className="space-y-4">
      <Tarjeta className="space-y-4">
        <Campo etiqueta="¿En cuánto lo compras?">
          <EntradaSoles value={compra} onChange={(e) => setCompra(e.target.value)} placeholder="28,000" autoFocus />
        </Campo>
        <Campo etiqueta="Reparaciones y gastos estimados" ayuda="Pintura, mecánica, trámites, lavado, comisión…">
          <EntradaSoles value={reparaciones} onChange={(e) => setReparaciones(e.target.value)} placeholder="2,000" />
        </Campo>
        <Campo etiqueta="¿En cuánto lo venderías?">
          <EntradaSoles value={venta} onChange={(e) => setVenta(e.target.value)} placeholder="36,000" />
        </Campo>
      </Tarjeta>

      <div aria-live="polite">
        {r ? (
          <Tarjeta className={cx("space-y-4 ring-2", fondo[r.color])}>
            <div className="flex flex-col items-center gap-2 text-center">
              <BadgeSemaforo color={r.color} />
              <p className="text-sm font-semibold text-slate-600">Ganancia estimada</p>
              <p className={cx("text-4xl font-black", r.ganancia >= 0 ? "text-emerald-700" : "text-red-700")}>{solesConSigno(r.ganancia)}</p>
              <p className="text-lg font-bold text-slate-800">Margen {porcentaje(r.margen)}</p>
            </div>
            <dl className="grid grid-cols-2 gap-3 border-t border-black/10 pt-3 text-sm">
              <div>
                <dt className="text-slate-600">Inversión total</dt>
                <dd className="font-bold">{soles(r.costo)}</dd>
              </div>
              <div>
                <dt className="text-slate-600">Para quedar en verde ({umbrales.verde} %)</dt>
                <dd className="font-bold">{r.compraMaximaVerde > 0 ? `compra hasta ${soles(r.compraMaximaVerde, { redondear: true })}` : "no alcanza"}</dd>
              </div>
            </dl>
            <Link href={`/autos/nuevo?${registrar}`} className={clasesBoton("secundario", "md", "w-full")}>
              Registrar como &quot;en evaluación&quot;
            </Link>
          </Tarjeta>
        ) : (
          <Tarjeta className="text-center text-slate-600">Ingresa el precio de compra y de venta para ver el resultado.</Tarjeta>
        )}
      </div>

      <p className="text-center text-sm text-slate-500">
        Verde ≥ {umbrales.verde} % · Amarillo {umbrales.amarillo}–{umbrales.verde} % · Rojo &lt; {umbrales.amarillo} % ·{" "}
        <Link href="/ajustes" className="font-semibold text-marca-700 underline">cambiar</Link>
      </p>
    </div>
  );
}
