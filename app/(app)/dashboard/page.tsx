import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ChevronRight, Plus } from "lucide-react";
import { colorGanancia } from "@/components/badges";
import { BotonDatosEjemplo } from "@/components/boton-datos-ejemplo";
import { Aviso, BotonLink, cx, Seccion, Tarjeta, Vacio } from "@/components/ui";
import { calcularAuto, resumenDashboard } from "@/lib/calculos";
import { listarAutos, listarVencimientos, obtenerMiPerfil } from "@/lib/datos";
import { hoyLima } from "@/lib/fechas";
import { formatoPlaca, porcentaje, soles, solesConSigno } from "@/lib/formato";
import { obtenerSuscripcion } from "@/lib/suscripcion";
import { FuncionPro } from "@/components/aviso-suscripcion";

export const metadata: Metadata = { title: "Inicio" };

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function Kpi({ titulo, valor, detalle, className }: { titulo: string; valor: React.ReactNode; detalle?: React.ReactNode; className?: string }) {
  return (
    <Tarjeta className={cx("space-y-1", className)}>
      <p className="text-sm font-semibold text-slate-500">{titulo}</p>
      <p className="text-2xl font-black tracking-tight text-slate-900">{valor}</p>
      {detalle && <p className="text-sm text-slate-600">{detalle}</p>}
    </Tarjeta>
  );
}

export default async function Dashboard({ searchParams }: PageProps<"/dashboard">) {
  const { bienvenida } = await searchParams;
  const [autos, venc, perfil, suscripcion] = await Promise.all([listarAutos(), listarVencimientos(), obtenerMiPerfil(), obtenerSuscripcion()]);
  const completo = Boolean(suscripcion.info?.dashboardCompleto);
  // Las alertas de vencimiento son parte de los planes Pro y Concesionario.
  const documentos = suscripcion.info?.alertas ? venc.documentos : [];
  const hoy = hoyLima();
  const r = resumenDashboard(autos, hoy);
  const mes = MESES[Number(hoy.slice(5, 7)) - 1];
  const vencidos = documentos.filter((d) => d.fecha_vencimiento! < hoy).length;
  const nombre = perfil.nombre?.split(" ")[0];

  const masTiempo = autos
    .filter((a) => a.estado === "en_stock" || a.estado === "reservado")
    .map((a) => ({ auto: a, dias: calcularAuto(a, hoy).diasEnStock ?? 0 }))
    .sort((a, b) => b.dias - a.dias)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{nombre ? `Hola, ${nombre}` : "Inicio"}</h1>
      {bienvenida === "equipo" && (
        <Aviso tipo="exito">¡Te uniste al equipo! Ahora ves y registras los autos del negocio.</Aviso>
      )}

      {documentos.length > 0 && (
        <Link
          href="/vencimientos"
          className={cx(
            "flex items-center gap-3 rounded-2xl p-4 ring-1",
            vencidos ? "bg-red-50 text-red-900 ring-red-200" : "bg-amber-50 text-amber-950 ring-amber-200",
          )}
        >
          <AlertTriangle className="size-6 shrink-0" aria-hidden />
          <span className="flex-1">
            <strong>
              {documentos.length} {documentos.length === 1 ? "documento vence" : "documentos vencen"} en los próximos 30 días
            </strong>
            {vencidos > 0 && <span className="block text-sm">{vencidos} ya {vencidos === 1 ? "está vencido" : "están vencidos"}</span>}
          </span>
          <ChevronRight className="size-5" aria-hidden />
        </Link>
      )}

      {autos.length === 0 ? (
        <Vacio titulo="Bienvenido a FLIPDESK" texto="Registra tus autos y descubre cuánto ganas de verdad con cada uno.">
          <BotonLink href="/autos/nuevo" tamano="lg">
            <Plus className="size-5" aria-hidden /> Registrar mi primer auto
          </BotonLink>
          <BotonDatosEjemplo />
        </Vacio>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi
              className="col-span-2 lg:col-span-1"
              titulo={`Ganancia de ${mes}`}
              valor={<span className={colorGanancia(r.gananciaMes || null)}>{solesConSigno(r.gananciaMes, { redondear: true })}</span>}
              detalle={`${r.vendidosMes} ${r.vendidosMes === 1 ? "auto vendido" : "autos vendidos"} · ventas ${soles(r.ventasMes, { redondear: true })}`}
            />
            <Kpi
              titulo="Autos en stock"
              valor={
                suscripcion.info?.limiteStock
                  ? `${r.autosEnStock + r.autosReservados} / ${suscripcion.info.limiteStock}`
                  : r.autosEnStock + r.autosReservados
              }
              detalle={[r.autosReservados && `${r.autosReservados} reservado${r.autosReservados > 1 ? "s" : ""}`, r.autosEnEvaluacion && `${r.autosEnEvaluacion} en evaluación`].filter(Boolean).join(" · ") || undefined}
            />
            {completo && (
            <Kpi
              titulo="Días promedio en stock"
              valor={r.diasPromedioStock === null ? "—" : Math.round(r.diasPromedioStock)}
              detalle={r.diasPromedioStock === null ? undefined : "días"}
            />
            )}
            {completo && (
            <Kpi
              className="col-span-2 lg:col-span-1"
              titulo="Capital inmovilizado"
              valor={soles(r.capitalInmovilizado, { redondear: true })}
              detalle={r.gananciaProyectadaStock ? `Ganancia proyectada: ${solesConSigno(r.gananciaProyectadaStock, { redondear: true })}` : "Plata invertida en autos sin vender"}
            />
            )}
          </div>

          {!completo && (
            <FuncionPro
              titulo="Dashboard completo"
              texto="Capital inmovilizado, días promedio en stock, autos que llevan más tiempo y margen por marca y modelo están en los planes Pro y Concesionario."
            />
          )}

          {completo && masTiempo.length > 0 && masTiempo[0].dias > 0 && (
            <Seccion titulo="Llevan más tiempo en stock">
              <Tarjeta className="divide-y divide-slate-100 p-0">
                {masTiempo.map(({ auto, dias }) => (
                  <Link key={auto.id} href={`/autos/${auto.id}`} className="flex min-h-14 items-center gap-3 px-4 py-2 hover:bg-slate-50">
                    <span className="flex-1">
                      <span className="font-semibold">{auto.marca} {auto.modelo}</span>{" "}
                      <span className="font-mono text-sm text-slate-500">{formatoPlaca(auto.placa)}</span>
                    </span>
                    <span className={cx("font-bold", dias > 60 ? "text-red-700" : dias > 30 ? "text-amber-700" : "text-slate-700")}>
                      {dias} días
                    </span>
                    <ChevronRight className="size-5 text-slate-400" aria-hidden />
                  </Link>
                ))}
              </Tarjeta>
            </Seccion>
          )}

          {completo && (
          <Seccion titulo="Margen por marca y modelo">
            {r.porModelo.length === 0 ? (
              <Tarjeta className="text-slate-600">Cuando vendas tu primer auto verás aquí qué modelos te dejan más ganancia.</Tarjeta>
            ) : (
              <Tarjeta className="overflow-x-auto p-0">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">Modelo</th>
                      <th scope="col" className="px-2 py-3 text-right font-semibold">Vendidos</th>
                      <th scope="col" className="px-2 py-3 text-right font-semibold">Margen prom.</th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold">Ganancia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {r.porModelo.map((f) => (
                      <tr key={`${f.marca}-${f.modelo}`}>
                        <td className="px-4 py-3">
                          <span className="font-semibold">{f.marca} {f.modelo}</span>
                          {f.diasPromedioVenta !== null && (
                            <span className="block text-xs text-slate-500">vende en ~{Math.round(f.diasPromedioVenta)} días</span>
                          )}
                        </td>
                        <td className="px-2 py-3 text-right">{f.vendidos}</td>
                        <td className={cx("px-2 py-3 text-right font-bold", colorGanancia(f.margenPromedio))}>{porcentaje(f.margenPromedio)}</td>
                        <td className={cx("px-4 py-3 text-right font-semibold whitespace-nowrap", colorGanancia(f.gananciaTotal))}>
                          {soles(f.gananciaTotal, { redondear: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Tarjeta>
            )}
          </Seccion>
          )}
        </>
      )}
    </div>
  );
}
