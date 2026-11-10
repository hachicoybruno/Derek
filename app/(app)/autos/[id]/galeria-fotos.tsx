"use client";
import { useRef, useState, useTransition } from "react";
import { Camera, ChevronLeft, ChevronRight, Star, Trash2, X } from "lucide-react";
import { Aviso, Boton, cx } from "@/components/ui";
import type { Foto } from "@/lib/datos";
import { comprimirImagen, idAleatorio } from "@/lib/imagen";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import { eliminarFoto, fotoPrincipal, registrarFotos } from "./acciones";

const MAX_FOTOS = 20;

export function GaleriaFotos({
  autoId,
  cuentaId,
  fotos,
  puedeBorrar,
}: {
  autoId: string;
  cuentaId: string;
  fotos: Foto[];
  puedeBorrar: boolean;
}) {
  const [progreso, setProgreso] = useState<string>();
  const [error, setError] = useState<string>();
  const [abierta, setAbierta] = useState<number | null>(null);
  const [pendiente, startTransition] = useTransition();
  const dialogo = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);

  async function subir(archivos: FileList | null) {
    if (!archivos?.length) return;
    setError(undefined);
    const lista = [...archivos].slice(0, Math.max(0, MAX_FOTOS - fotos.length));
    if (!lista.length) return setError(`Máximo ${MAX_FOTOS} fotos por auto.`);

    const supabase = crearClienteNavegador();
    const subidas: { path: string; miniatura: string }[] = [];
    let fallidas = 0;

    for (const [i, archivo] of lista.entries()) {
      setProgreso(`Subiendo ${i + 1} de ${lista.length}…`);
      try {
        const [grande, chica] = await Promise.all([comprimirImagen(archivo, 1600, 0.8), comprimirImagen(archivo, 400, 0.7)]);
        const base = `${cuentaId}/${autoId}/${idAleatorio()}`;
        const r1 = await supabase.storage.from("fotos-autos").upload(`${base}.jpg`, grande, { contentType: "image/jpeg" });
        const r2 = await supabase.storage.from("fotos-autos").upload(`${base}_t.jpg`, chica, { contentType: "image/jpeg" });
        if (r1.error || r2.error) throw r1.error ?? r2.error;
        subidas.push({ path: `${base}.jpg`, miniatura: `${base}_t.jpg` });
      } catch {
        fallidas += 1;
      }
    }

    if (subidas.length) {
      setProgreso("Guardando…");
      const r = await registrarFotos(autoId, subidas);
      if (r?.error) setError(r.error);
    }
    if (fallidas) setError(`${fallidas} foto(s) no se pudieron subir. Usa JPG o PNG e intenta de nuevo.`);
    setProgreso(undefined);
    if (input.current) input.current.value = "";
  }

  function abrir(i: number) {
    setAbierta(i);
    dialogo.current?.showModal();
  }
  function cerrar() {
    dialogo.current?.close();
    setAbierta(null);
  }
  const actual = abierta !== null ? fotos[abierta] : null;

  function ejecutar(accion: (fd: FormData) => Promise<void>, foto: Foto, cerrarDespues: boolean) {
    const fd = new FormData();
    fd.set("id", foto.id);
    fd.set("auto_id", autoId);
    startTransition(async () => {
      await accion(fd);
      if (cerrarDespues) cerrar();
      else setAbierta(0);
    });
  }

  return (
    <section aria-label="Fotos" className="space-y-2">
      {fotos.length > 0 && (
        <ul className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1">
          {fotos.map((f, i) => (
            <li key={f.id} className="snap-start">
              <button
                type="button"
                onClick={() => abrir(i)}
                className={cx(
                  "relative block overflow-hidden rounded-xl bg-slate-200",
                  i === 0 ? "h-44 w-64 sm:h-56 sm:w-80" : "h-44 w-32 sm:h-56 sm:w-40",
                )}
                aria-label={`Ver foto ${i + 1} de ${fotos.length}`}
              >
                {f.urlMiniatura && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i === 0 ? (f.url ?? f.urlMiniatura) : f.urlMiniatura} alt="" loading={i < 3 ? "eager" : "lazy"} decoding="async" className="size-full object-cover" />
                )}
                {i === 0 && (
                  <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">Principal</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <label
        className={cx(
          "flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-marca-200 bg-marca-50 px-4 font-semibold text-marca-800",
          (progreso || fotos.length >= MAX_FOTOS) && "pointer-events-none opacity-60",
          fotos.length === 0 && "min-h-28 flex-col",
        )}
      >
        <Camera className={fotos.length === 0 ? "size-8" : "size-5"} aria-hidden />
        {progreso ?? (fotos.length === 0 ? "Agregar fotos (cámara o galería)" : `Agregar más fotos (${fotos.length}/${MAX_FOTOS})`)}
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          disabled={Boolean(progreso)}
          onChange={(e) => subir(e.target.files)}
        />
      </label>
      {error && <Aviso tipo="error">{error}</Aviso>}

      <dialog
        ref={dialogo}
        onClose={() => setAbierta(null)}
        onClick={(e) => e.target === dialogo.current && cerrar()}
        className="m-auto w-full max-w-3xl bg-transparent p-2 backdrop:bg-black/85"
      >
        {actual && abierta !== null && (
          <div className="space-y-3">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={actual.url ?? actual.urlMiniatura ?? ""} alt={`Foto ${abierta + 1}`} className="max-h-[70vh] w-full rounded-xl object-contain" />
              <button type="button" onClick={cerrar} aria-label="Cerrar" className="absolute top-2 right-2 flex size-11 items-center justify-center rounded-full bg-black/60 text-white">
                <X className="size-6" aria-hidden />
              </button>
              {fotos.length > 1 && (
                <>
                  <button type="button" onClick={() => setAbierta((abierta - 1 + fotos.length) % fotos.length)} aria-label="Foto anterior" className="absolute top-1/2 left-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white">
                    <ChevronLeft className="size-6" aria-hidden />
                  </button>
                  <button type="button" onClick={() => setAbierta((abierta + 1) % fotos.length)} aria-label="Foto siguiente" className="absolute top-1/2 right-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white">
                    <ChevronRight className="size-6" aria-hidden />
                  </button>
                </>
              )}
            </div>
            <p className="text-center text-sm text-white">{abierta + 1} de {fotos.length}</p>
            <div className={cx("grid gap-2", puedeBorrar ? "grid-cols-2" : "grid-cols-1")}>
              <Boton variante="secundario" disabled={abierta === 0 || pendiente} onClick={() => ejecutar(fotoPrincipal, actual, false)}>
                <Star className="size-5" aria-hidden /> {abierta === 0 ? "Es la principal" : "Usar de principal"}
              </Boton>
              {puedeBorrar && (
              <Boton
                variante="peligro"
                disabled={pendiente}
                onClick={() => confirm("¿Eliminar esta foto?") && ejecutar(eliminarFoto, actual, true)}
              >
                <Trash2 className="size-5" aria-hidden /> Eliminar
              </Boton>
              )}
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
