import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { BadgeEstado, colorGanancia } from "@/components/badges";
import { BotonConfirmar } from "@/components/boton-confirmar";
import { BotonEnviar } from "@/components/boton-enviar";
import { Aviso, BotonLink, cx, Dato, Seccion, Tarjeta } from "@/components/ui";
import { requerirUsuario } from "@/lib/auth";
import { calcularAuto, estadoVencimiento } from "@/lib/calculos";
import { obtenerAuto, obtenerPerfil } from "@/lib/datos";
import {
  ETIQUETA_CATEGORIA,
  ETIQUETA_COMBUSTIBLE,
  ETIQUETA_DOCUMENTO,
  ETIQUETA_ESTADO,
  ETIQUETA_TRANSMISION,
  type CategoriaGasto,
  type TipoDocumento,
} from "@/lib/dominio";
import { horaLima, hoyLima } from "@/lib/fechas";
import { mensajeLimitePlan } from "@/lib/planes";
import { fecha, formatoPlaca, km, porcentaje, soles, solesConSigno } from "@/lib/formato";
import { cambiarEstado } from "../acciones";
import { eliminarDocumento, eliminarGasto } from "./acciones";
import { FormularioContacto, FormularioDocumento, FormularioGasto, FormularioVenta } from "./formularios";
import { GaleriaFotos } from "./galeria-fotos";
import { GeneradorAnuncios } from "./generador-anuncios";
import { DocumentosPdf } from "./documentos-pdf";

export async function generateMetadata({ params }: PageProps<"/autos/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { auto } = await obtenerAuto(id);
  return { title: `${auto.marca} ${auto.modelo} · ${formatoPlaca(auto.placa)}` };
}

function Desplegable({ titulo, children, variante = "normal" }: { titulo: string; children: React.ReactNode; variante?: "normal" | "exito" }) {
  return (
    <details className="group rounded-2xl bg-white ring-1 ring-slate-200">
      <summary
        className={cx(
          "flex min-h-12 cursor-pointer list-none items-center justify-center gap-2 rounded-2xl px-4 font-semibold",
          variante === "exito" ? "bg-emerald-600 text-white group-open:rounded-b-none" : "text-marca-700",
        )}
      >
        <Plus className="size-5 transition group-open:rotate-45" aria-hidden /> {titulo}
      </summary>
      <div className="border-t border-slate-200 p-4">{children}</div>
    </details>
  );
}

const estilosVencimiento = {
  vencido: "bg-red-100 text-red-800",
  por_vencer: "bg-amber-100 text-amber-900",
  vigente: "bg-emerald-50 text-emerald-800",
};

export default async function FichaAuto({ params, searchParams }: PageProps<"/autos/[id]">) {
  const { id } = await params;
  const { nuevo, aviso } = await searchParams;
  const { cuentaId, esDueno } = await requerirUsuario();
  const [{ auto, gastos, documentos, fotos, vendedor, comprador }, perfil] = await Promise.all([obtenerAuto(id), obtenerPerfil()]);
  const hoy = hoyLima();
  const c = calcularAuto(auto, hoy);
  const vendido = auto.estado === "vendido";
  const ganancia = vendido ? c.ganancia : c.gananciaProyectada;
  const margen = vendido ? c.margen : c.margenProyectado;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-3">
        <Link href="/autos" className="inline-flex min-h-11 items-center gap-1 font-semibold text-marca-700">
          <ChevronLeft className="size-5" aria-hidden /> Mis autos
        </Link>
        {nuevo && <Aviso tipo="exito">¡Auto registrado! Ahora puedes agregar fotos, gastos y documentos.</Aviso>}
        {(aviso === "limite" || aviso === "sin_plan") && (
          <Aviso tipo="alerta">
            {mensajeLimitePlan(aviso === "limite" ? "LIMITE_PLAN" : "SIN_PLAN")}{" "}
            <Link href="/suscripcion" className="font-semibold underline">Ver planes</Link>
          </Aviso>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold leading-tight">
              {auto.marca} {auto.modelo} <span className="font-semibold text-slate-500">{auto.anio}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-white px-2 py-0.5 font-mono font-bold tracking-wider ring-1 ring-slate-300">
                {formatoPlaca(auto.placa)}
              </span>
              <BadgeEstado estado={auto.estado} />
            </div>
          </div>
          <BotonLink href={`/autos/${id}/editar`} variante="secundario" aria-label="Editar datos del auto">
            <Pencil className="size-5" aria-hidden /> <span className="hidden sm:inline">Editar</span>
          </BotonLink>
        </div>
      </div>

      <GaleriaFotos autoId={id} cuentaId={cuentaId} fotos={fotos} puedeBorrar={esDueno} />

      <Tarjeta className="space-y-4">
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-500">{vendido ? "Ganancia real" : "Ganancia proyectada"}</p>
          <p className={cx("text-4xl font-black tracking-tight", colorGanancia(ganancia))}>
            {ganancia === null ? "—" : solesConSigno(ganancia)}
          </p>
          <p className="text-sm text-slate-600">
            {margen !== null ? `Margen ${porcentaje(margen)}` : vendido ? "" : "Agrega un precio de venta objetivo para ver la proyección"}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
          <Dato etiqueta="Precio de compra" valor={soles(auto.precio_compra)} />
          <Dato etiqueta="Gastos" valor={soles(Number(auto.total_gastos))} />
          <Dato etiqueta="Costo total" valor={<span className="text-marca-800">{soles(c.costoTotal)}</span>} />
          <Dato
            etiqueta={vendido ? "Precio de venta" : "Precio objetivo"}
            valor={soles(vendido ? auto.precio_venta_final : auto.precio_venta_objetivo)}
          />
          <Dato
            etiqueta={vendido ? "Días hasta vender" : "Días en stock"}
            valor={c.diasEnStock === null ? "—" : `${c.diasEnStock} ${c.diasEnStock === 1 ? "día" : "días"}`}
          />
          <Dato etiqueta={vendido ? "Fecha de venta" : "Fecha de compra"} valor={fecha(vendido ? auto.fecha_venta : auto.fecha_compra)} />
        </dl>
      </Tarjeta>

      {vendido ? (
        <Tarjeta className="flex flex-wrap items-center justify-between gap-3 bg-emerald-50 ring-emerald-200">
          <p className="font-semibold text-emerald-900">Vendido el {fecha(auto.fecha_venta)} en {soles(auto.precio_venta_final)}</p>
          <form action={cambiarEstado}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="estado" value="en_stock" />
            <BotonEnviar variante="secundario" textoCargando="Deshaciendo…">Deshacer venta</BotonEnviar>
          </form>
        </Tarjeta>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Cambiar estado">
            {(["en_evaluacion", "en_stock", "reservado"] as const).map((e) => (
              <form key={e} action={cambiarEstado}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="estado" value={e} />
                <button
                  type="submit"
                  aria-pressed={auto.estado === e}
                  className={cx(
                    "min-h-12 w-full rounded-xl px-1 text-sm font-semibold ring-1",
                    auto.estado === e ? "bg-marca-700 text-white ring-marca-700" : "bg-white text-slate-700 ring-slate-300",
                  )}
                >
                  {ETIQUETA_ESTADO[e]}
                </button>
              </form>
            ))}
          </div>
          <Desplegable titulo="Registrar venta" variante="exito">
            <FormularioVenta autoId={id} hoy={hoy} precioSugerido={auto.precio_venta_objetivo} />
          </Desplegable>
        </div>
      )}

      <Seccion titulo={`Gastos · ${soles(Number(auto.total_gastos))}`}>
        {gastos.length > 0 && (
          <Tarjeta className="divide-y divide-slate-100 p-0">
            {gastos.map((g) => (
              <div key={g.id} className="flex items-center gap-3 py-2 pr-1 pl-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {ETIQUETA_CATEGORIA[g.categoria as CategoriaGasto]}
                    {g.descripcion && <span className="font-normal text-slate-600"> · {g.descripcion}</span>}
                  </p>
                  <p className="text-sm text-slate-500">{fecha(g.fecha)}</p>
                </div>
                <p className={cx("font-bold whitespace-nowrap", !esDueno && "pr-3")}>{soles(g.monto)}</p>
                {esDueno && (
                <BotonConfirmar
                  accion={eliminarGasto}
                  campos={{ id: g.id, auto_id: id }}
                  mensaje="¿Eliminar este gasto?"
                  etiqueta={`Eliminar gasto de ${soles(g.monto)}`}
                >
                  <Trash2 className="size-5" aria-hidden />
                </BotonConfirmar>
                )}
              </div>
            ))}
          </Tarjeta>
        )}
        <Desplegable titulo="Agregar gasto">
          <FormularioGasto autoId={id} hoy={hoy} />
        </Desplegable>
      </Seccion>

      <Seccion titulo="Documentos">
        {documentos.length > 0 && (
          <Tarjeta className="divide-y divide-slate-100 p-0">
            {documentos.map((d) => {
              const venc = estadoVencimiento(d.fecha_vencimiento, hoy);
              return (
                <div key={d.id} className="flex items-center gap-3 py-2 pr-1 pl-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {ETIQUETA_DOCUMENTO[d.tipo as TipoDocumento]}
                      {d.descripcion && <span className="font-normal text-slate-600"> · {d.descripcion}</span>}
                    </p>
                    {venc && (
                      <span className={cx("mt-0.5 inline-block rounded-md px-2 py-0.5 text-xs font-bold", estilosVencimiento[venc.estado])}>
                        {venc.estado === "vencido"
                          ? `Venció el ${fecha(d.fecha_vencimiento)}`
                          : venc.dias === 0
                            ? "Vence hoy"
                            : `Vence el ${fecha(d.fecha_vencimiento)} (${venc.dias} ${venc.dias === 1 ? "día" : "días"})`}
                      </span>
                    )}
                  </div>
                  {d.url && (
                    <a href={d.url} target="_blank" rel="noopener noreferrer" className="inline-flex size-11 items-center justify-center rounded-full text-marca-700 hover:bg-marca-50" aria-label="Ver archivo">
                      <FileText className="size-5" aria-hidden />
                    </a>
                  )}
                  {esDueno && (
                  <BotonConfirmar
                    accion={eliminarDocumento}
                    campos={{ id: d.id, auto_id: id }}
                    mensaje="¿Eliminar este documento?"
                    etiqueta="Eliminar documento"
                  >
                    <Trash2 className="size-5" aria-hidden />
                  </BotonConfirmar>
                  )}
                </div>
              );
            })}
          </Tarjeta>
        )}
        <Desplegable titulo="Agregar documento">
          <FormularioDocumento autoId={id} cuentaId={cuentaId} />
        </Desplegable>
      </Seccion>

      {!vendido && (
        <Seccion titulo="Anuncios">
          <GeneradorAnuncios autoId={id} />
        </Seccion>
      )}

      <Seccion titulo="Datos del auto">
        <Tarjeta>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            <Dato etiqueta="Versión" valor={auto.version} />
            <Dato etiqueta="Color" valor={auto.color} />
            <Dato etiqueta="Kilometraje" valor={km(auto.kilometraje)} />
            <Dato etiqueta="Transmisión" valor={auto.transmision ? ETIQUETA_TRANSMISION[auto.transmision as "mecanica"] : null} />
            <Dato etiqueta="Combustible" valor={auto.combustible ? ETIQUETA_COMBUSTIBLE[auto.combustible as "gasolina"] : null} />
            <Dato etiqueta="Fecha de compra" valor={fecha(auto.fecha_compra)} />
            <Dato etiqueta="N° de serie (VIN)" valor={auto.numero_serie} />
            <Dato etiqueta="N° de motor" valor={auto.numero_motor} />
            {auto.notas && <Dato etiqueta="Notas" valor={<span className="font-normal whitespace-pre-line">{auto.notas}</span>} className="col-span-full" />}
          </dl>
        </Tarjeta>
      </Seccion>

      <Seccion titulo="Contratos y recibos">
        <DocumentosPdf
          autoId={id}
          hoy={hoy}
          hora={horaLima()}
          precio={auto.precio_venta_final ?? auto.precio_venta_objetivo}
          fechaVenta={auto.fecha_venta}
          kilometraje={auto.kilometraje}
          yo={{ nombre: perfil.nombre, dni: perfil.dni, direccion: perfil.direccion, telefono: perfil.telefono }}
          propietario={vendedor}
          comprador={comprador}
        />
      </Seccion>

      <div className="grid gap-6 md:grid-cols-2">
        <Seccion titulo="Vendedor (a quién le compraste)">
          <Tarjeta>
            <FormularioContacto autoId={id} rol="vendedor" contacto={vendedor} />
          </Tarjeta>
        </Seccion>
        <Seccion titulo="Comprador">
          <Tarjeta>
            <FormularioContacto autoId={id} rol="comprador" contacto={comprador} />
          </Tarjeta>
        </Seccion>
      </div>
    </div>
  );
}
