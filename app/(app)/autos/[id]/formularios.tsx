"use client";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { BotonEnviar } from "@/components/boton-enviar";
import { Aviso, Boton, Campo, Entrada, EntradaSoles, Selector } from "@/components/ui";
import { CATEGORIAS_GASTO, ETIQUETA_CATEGORIA, ETIQUETA_DOCUMENTO, TIPOS_DOCUMENTO } from "@/lib/dominio";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import { idAleatorio } from "@/lib/imagen";
import { guardarContacto, registrarVenta, type EstadoFormulario } from "../acciones";
import { agregarDocumento, agregarGasto } from "./acciones";

/** Limpia el formulario y cierra el <details> que lo contiene cuando la acción termina bien. */
function useCerrarAlGuardar(estado: EstadoFormulario, ref: React.RefObject<HTMLFormElement | null>) {
  useEffect(() => {
    if (!estado.ok) return;
    ref.current?.reset();
    ref.current?.closest("details")?.removeAttribute("open");
  }, [estado, ref]);
}

export function FormularioGasto({ autoId, hoy }: { autoId: string; hoy: string }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(agregarGasto, {});
  const ref = useRef<HTMLFormElement>(null);
  const e = estado.errores ?? {};
  const v = estado.valores ?? {};
  useCerrarAlGuardar(estado, ref);

  return (
    <form ref={ref} action={accion} className="grid grid-cols-2 gap-3" noValidate>
      <input type="hidden" name="auto_id" value={autoId} />
      <Campo etiqueta="Categoría" error={e.categoria} className="col-span-2">
        <Selector name="categoria" defaultValue={v.categoria ?? "reparacion"}>
          {CATEGORIAS_GASTO.map((c) => (
            <option key={c} value={c}>{ETIQUETA_CATEGORIA[c]}</option>
          ))}
        </Selector>
      </Campo>
      <Campo etiqueta="Monto" error={e.monto}>
        <EntradaSoles name="monto" placeholder="350" defaultValue={v.monto} aria-invalid={Boolean(e.monto)} />
      </Campo>
      <Campo etiqueta="Fecha" error={e.fecha}>
        <Entrada name="fecha" type="date" max={hoy} defaultValue={v.fecha ?? hoy} />
      </Campo>
      <Campo etiqueta="Descripción (opcional)" className="col-span-2">
        <Entrada name="descripcion" placeholder="Ej. cambio de pastillas" defaultValue={v.descripcion} />
      </Campo>
      {estado.error && <Aviso tipo="error" className="col-span-2">{estado.error}</Aviso>}
      <BotonEnviar className="col-span-2">Agregar gasto</BotonEnviar>
    </form>
  );
}

export function FormularioDocumento({ autoId, cuentaId }: { autoId: string; cuentaId: string }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(agregarDocumento, {});
  const [subiendo, setSubiendo] = useState(false);
  const [errorArchivo, setErrorArchivo] = useState<string>();
  const ref = useRef<HTMLFormElement>(null);
  const e = estado.errores ?? {};
  const v = estado.valores ?? {};
  useCerrarAlGuardar(estado, ref);

  async function enviar(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setErrorArchivo(undefined);
    const formData = new FormData(ev.currentTarget);
    const archivo = formData.get("archivo");
    formData.delete("archivo");

    if (archivo instanceof File && archivo.size > 0) {
      if (archivo.size > 10 * 1024 * 1024) return setErrorArchivo("El archivo pesa más de 10 MB.");
      setSubiendo(true);
      const ext = (archivo.name.split(".").pop() ?? "pdf").toLowerCase().replace(/[^a-z0-9]/g, "") || "pdf";
      const ruta = `${cuentaId}/${autoId}/doc-${idAleatorio()}.${ext}`;
      const { error } = await crearClienteNavegador()
        .storage.from("documentos")
        .upload(ruta, archivo, { contentType: archivo.type || undefined });
      setSubiendo(false);
      if (error) return setErrorArchivo("No se pudo subir el archivo. Usa PDF o foto (JPG/PNG).");
      formData.set("archivo_path", ruta);
    }
    startTransition(() => accion(formData));
  }

  return (
    <form ref={ref} onSubmit={enviar} className="grid grid-cols-2 gap-3" noValidate>
      <input type="hidden" name="auto_id" value={autoId} />
      <Campo etiqueta="Tipo" error={e.tipo}>
        <Selector name="tipo" defaultValue={v.tipo ?? "soat"}>
          {TIPOS_DOCUMENTO.map((t) => (
            <option key={t} value={t}>{ETIQUETA_DOCUMENTO[t]}</option>
          ))}
        </Selector>
      </Campo>
      <Campo etiqueta="Vence el" error={e.fecha_vencimiento}>
        <Entrada name="fecha_vencimiento" type="date" defaultValue={v.fecha_vencimiento} aria-invalid={Boolean(e.fecha_vencimiento)} />
      </Campo>
      <Campo etiqueta="Nota (opcional)" className="col-span-2">
        <Entrada name="descripcion" placeholder="Ej. Rímac, N° de póliza" defaultValue={v.descripcion} />
      </Campo>
      <Campo etiqueta="Archivo o foto (opcional)" error={errorArchivo} className="col-span-2">
        <input
          name="archivo"
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="block w-full text-sm text-slate-700 file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-marca-50 file:px-4 file:font-semibold file:text-marca-800"
        />
      </Campo>
      {estado.error && <Aviso tipo="error" className="col-span-2">{estado.error}</Aviso>}
      <BotonEnviar className="col-span-2" disabled={subiendo} textoCargando="Guardando…">
        {subiendo ? "Subiendo archivo…" : "Agregar documento"}
      </BotonEnviar>
    </form>
  );
}

export function FormularioVenta({ autoId, hoy, precioSugerido }: { autoId: string; hoy: string; precioSugerido?: number | null }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(registrarVenta, {});
  const ref = useRef<HTMLFormElement>(null);
  const e = estado.errores ?? {};
  const v = estado.valores ?? {};
  useCerrarAlGuardar(estado, ref);

  return (
    <form ref={ref} action={accion} className="grid grid-cols-2 gap-3" noValidate>
      <input type="hidden" name="id" value={autoId} />
      <Campo etiqueta="Precio de venta final" error={e.precio_venta_final}>
        <EntradaSoles
          name="precio_venta_final"
          defaultValue={v.precio_venta_final ?? (precioSugerido ? String(precioSugerido) : "")}
          aria-invalid={Boolean(e.precio_venta_final)}
        />
      </Campo>
      <Campo etiqueta="Fecha de venta" error={e.fecha_venta}>
        <Entrada name="fecha_venta" type="date" max={hoy} defaultValue={v.fecha_venta ?? hoy} />
      </Campo>
      {estado.error && <Aviso tipo="error" className="col-span-2">{estado.error}</Aviso>}
      <BotonEnviar variante="exito" tamano="lg" className="col-span-2">
        Confirmar venta
      </BotonEnviar>
    </form>
  );
}

type ContactoInicial = { nombre: string; dni: string | null; telefono: string | null; direccion: string | null } | null;

export function FormularioContacto({ autoId, rol, contacto }: { autoId: string; rol: "vendedor" | "comprador"; contacto: ContactoInicial }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(guardarContacto, {});
  const [editando, setEditando] = useState(!contacto);
  const e = estado.errores ?? {};
  const v = estado.valores ?? {};

  // Al guardar con éxito, volver a la vista de lectura (ajuste de estado durante el render).
  const [ultimoEstado, setUltimoEstado] = useState(estado);
  if (estado !== ultimoEstado) {
    setUltimoEstado(estado);
    if (estado.ok) setEditando(false);
  }

  if (!editando && contacto) {
    return (
      <div className="flex items-start justify-between gap-3">
        <dl className="space-y-1 text-sm">
          <dd className="text-base font-semibold text-slate-900">{contacto.nombre}</dd>
          {contacto.dni && <dd className="text-slate-600">DNI: {contacto.dni}</dd>}
          {contacto.telefono && (
            <dd>
              <a href={`tel:${contacto.telefono.replace(/\s/g, "")}`} className="font-semibold text-marca-700 underline">
                {contacto.telefono}
              </a>
            </dd>
          )}
          {contacto.direccion && <dd className="text-slate-600">{contacto.direccion}</dd>}
        </dl>
        <Boton variante="fantasma" onClick={() => setEditando(true)}>
          Editar
        </Boton>
      </div>
    );
  }

  return (
    <form action={accion} className="grid grid-cols-2 gap-3" noValidate>
      <input type="hidden" name="auto_id" value={autoId} />
      <input type="hidden" name="rol" value={rol} />
      <Campo etiqueta="Nombre completo" error={e.nombre} className="col-span-2">
        <Entrada name="nombre" autoComplete="off" defaultValue={v.nombre ?? contacto?.nombre ?? ""} aria-invalid={Boolean(e.nombre)} />
      </Campo>
      <Campo etiqueta="DNI / CE" error={e.dni}>
        <Entrada name="dni" inputMode="numeric" maxLength={15} defaultValue={v.dni ?? contacto?.dni ?? ""} aria-invalid={Boolean(e.dni)} />
      </Campo>
      <Campo etiqueta="Teléfono" error={e.telefono}>
        <Entrada name="telefono" type="tel" inputMode="tel" defaultValue={v.telefono ?? contacto?.telefono ?? ""} />
      </Campo>
      <Campo etiqueta="Dirección" className="col-span-2">
        <Entrada name="direccion" defaultValue={v.direccion ?? contacto?.direccion ?? ""} />
      </Campo>
      {estado.error && <Aviso tipo="error" className="col-span-2">{estado.error}</Aviso>}
      <div className="col-span-2 flex gap-2">
        {contacto && (
          <Boton type="button" variante="secundario" className="flex-1" onClick={() => setEditando(false)}>
            Cancelar
          </Boton>
        )}
        <BotonEnviar className="flex-1">Guardar</BotonEnviar>
      </div>
    </form>
  );
}
