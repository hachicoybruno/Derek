"use client";
import { useActionState, useState } from "react";
import { BotonEnviar } from "@/components/boton-enviar";
import { AreaTexto, Aviso, Campo, cx, Entrada, EntradaSoles, Selector } from "@/components/ui";
import {
  COMBUSTIBLES,
  ETIQUETA_COMBUSTIBLE,
  ETIQUETA_ESTADO,
  ETIQUETA_TRANSMISION,
  MARCAS_COMUNES,
  TRANSMISIONES,
  type Estado,
} from "@/lib/dominio";
import { formatoPlaca } from "@/lib/formato";
import { guardarAuto, type EstadoFormulario } from "./acciones";

export type ValoresAuto = Partial<Record<string, string | number | null>>;

const texto = (v: string | number | null | undefined) => (v === null || v === undefined ? "" : String(v));

export function FormularioAuto({
  auto,
  hoy,
  inicial = {},
}: {
  auto?: ValoresAuto & { id?: string };
  hoy: string;
  inicial?: Record<string, string>;
}) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(guardarAuto, {});
  const editando = Boolean(auto?.id);
  const v = (campo: string, porDefecto = "") =>
    estado.valores?.[campo] ?? (auto ? texto(auto[campo]) : (inicial[campo] ?? porDefecto));
  const e = estado.errores ?? {};

  const [estadoAuto, setEstadoAuto] = useState<Estado>(
    ((estado.valores?.estado ?? auto?.estado ?? inicial.estado) as Estado) ?? "en_stock",
  );
  const opcionesEstado: Estado[] = editando ? ["en_evaluacion", "en_stock", "reservado", "vendido"] : ["en_stock", "en_evaluacion", "reservado"];
  const comprado = estadoAuto !== "en_evaluacion";
  const tieneMasDatos = Boolean(
    auto?.version || auto?.color || auto?.kilometraje || auto?.transmision || auto?.combustible || auto?.notas || auto?.numero_serie || auto?.numero_motor,
  );

  return (
    <form action={accion} className="space-y-5" noValidate>
      {auto?.id && <input type="hidden" name="id" value={auto.id} />}

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-slate-700">Estado</legend>
        <div className={cx("grid gap-2", opcionesEstado.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3")}>
          {opcionesEstado.map((op) => (
            <label
              key={op}
              className={cx(
                "flex min-h-12 cursor-pointer items-center justify-center rounded-xl px-2 text-center text-sm font-semibold ring-1 transition",
                estadoAuto === op ? "bg-marca-700 text-white ring-marca-700" : "bg-white text-slate-700 ring-slate-300",
              )}
            >
              <input
                type="radio"
                name="estado"
                value={op}
                checked={estadoAuto === op}
                onChange={() => setEstadoAuto(op)}
                className="sr-only"
              />
              {ETIQUETA_ESTADO[op]}
            </label>
          ))}
        </div>
        {e.estado && <p role="alert" className="text-sm font-medium text-red-700">{e.estado}</p>}
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Placa" error={e.placa} className="col-span-2 sm:col-span-1">
          <Entrada
            name="placa"
            required
            defaultValue={auto?.placa && !estado.valores ? formatoPlaca(String(auto.placa)) : v("placa")}
            placeholder="ABC-123"
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={10}
            aria-invalid={Boolean(e.placa)}
            className="font-mono tracking-wider uppercase"
            autoFocus={!editando}
          />
        </Campo>
        <Campo etiqueta="Año" error={e.anio} className="col-span-2 sm:col-span-1">
          <Entrada name="anio" required inputMode="numeric" maxLength={4} placeholder="2018" defaultValue={v("anio")} aria-invalid={Boolean(e.anio)} />
        </Campo>
        <Campo etiqueta="Marca" error={e.marca}>
          <Entrada name="marca" required list="marcas" placeholder="Toyota" autoCapitalize="words" defaultValue={v("marca")} aria-invalid={Boolean(e.marca)} />
        </Campo>
        <Campo etiqueta="Modelo" error={e.modelo}>
          <Entrada name="modelo" required placeholder="Yaris" autoCapitalize="words" defaultValue={v("modelo")} aria-invalid={Boolean(e.modelo)} />
        </Campo>
      </div>
      <datalist id="marcas">
        {MARCAS_COMUNES.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta={comprado ? "Precio de compra" : "Precio pedido"} error={e.precio_compra}>
          <EntradaSoles name="precio_compra" placeholder="30,000" defaultValue={v("precio_compra")} aria-invalid={Boolean(e.precio_compra)} />
        </Campo>
        <Campo etiqueta="Fecha de compra" error={e.fecha_compra}>
          <Entrada
            name="fecha_compra"
            type="date"
            max={hoy}
            defaultValue={v("fecha_compra", hoy)}
            aria-invalid={Boolean(e.fecha_compra)}
          />
        </Campo>
        <Campo etiqueta="Precio de venta objetivo" error={e.precio_venta_objetivo} ayuda="Opcional" className="col-span-2">
          <EntradaSoles name="precio_venta_objetivo" placeholder="36,000" defaultValue={v("precio_venta_objetivo")} />
        </Campo>
      </div>

      {estadoAuto === "vendido" && (
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200">
          <Campo etiqueta="Precio de venta final" error={e.precio_venta_final}>
            <EntradaSoles name="precio_venta_final" defaultValue={v("precio_venta_final")} aria-invalid={Boolean(e.precio_venta_final)} />
          </Campo>
          <Campo etiqueta="Fecha de venta" error={e.fecha_venta}>
            <Entrada name="fecha_venta" type="date" max={hoy} defaultValue={v("fecha_venta", hoy)} aria-invalid={Boolean(e.fecha_venta)} />
          </Campo>
        </div>
      )}

      <details open={tieneMasDatos || Boolean(e.kilometraje)} className="group rounded-xl bg-white ring-1 ring-slate-200">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 font-semibold text-marca-700">
          Más datos (opcional)
          <span aria-hidden className="transition group-open:rotate-180">▾</span>
        </summary>
        <div className="grid grid-cols-2 gap-3 border-t border-slate-200 p-4">
          <Campo etiqueta="Versión">
            <Entrada name="version" placeholder="GLI, Full…" defaultValue={v("version")} />
          </Campo>
          <Campo etiqueta="Color">
            <Entrada name="color" placeholder="Plata" defaultValue={v("color")} />
          </Campo>
          <Campo etiqueta="Kilometraje" error={e.kilometraje}>
            <Entrada name="kilometraje" inputMode="numeric" placeholder="85,000" defaultValue={v("kilometraje")} />
          </Campo>
          <Campo etiqueta="Transmisión">
            <Selector name="transmision" defaultValue={v("transmision")}>
              <option value="">—</option>
              {TRANSMISIONES.map((t) => (
                <option key={t} value={t}>{ETIQUETA_TRANSMISION[t]}</option>
              ))}
            </Selector>
          </Campo>
          <Campo etiqueta="Combustible" className="col-span-2">
            <Selector name="combustible" defaultValue={v("combustible")}>
              <option value="">—</option>
              {COMBUSTIBLES.map((c) => (
                <option key={c} value={c}>{ETIQUETA_COMBUSTIBLE[c]}</option>
              ))}
            </Selector>
          </Campo>
          <Campo etiqueta="N° de serie (VIN)" ayuda="Para contratos">
            <Entrada name="numero_serie" autoCapitalize="characters" autoComplete="off" maxLength={30} className="uppercase" defaultValue={v("numero_serie")} />
          </Campo>
          <Campo etiqueta="N° de motor" ayuda="Para contratos">
            <Entrada name="numero_motor" autoCapitalize="characters" autoComplete="off" maxLength={30} className="uppercase" defaultValue={v("numero_motor")} />
          </Campo>
          <Campo etiqueta="Notas" className="col-span-2">
            <AreaTexto name="notas" rows={3} placeholder="Detalles del auto, estado de llantas, choques…" defaultValue={v("notas")} />
          </Campo>
        </div>
      </details>

      {estado.error && (
        <Aviso tipo={estado.limitePlan ? "alerta" : "error"}>
          {estado.error}
          {estado.limitePlan && (
            <>
              {" "}
              <a href="/suscripcion" className="font-semibold underline">Ver planes</a>
            </>
          )}
        </Aviso>
      )}
      {estado.errores && !estado.error && <Aviso tipo="error">Revisa los campos marcados en rojo.</Aviso>}

      <BotonEnviar tamano="lg" className="w-full">
        {editando ? "Guardar cambios" : "Guardar auto"}
      </BotonEnviar>
    </form>
  );
}
