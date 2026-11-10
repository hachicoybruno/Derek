"use client";
import { useActionState, useRef, useState } from "react";
import { Eye, RotateCcw } from "lucide-react";
import { BotonEnviar } from "@/components/boton-enviar";
import { Aviso, Boton, clasesBoton, Tarjeta } from "@/components/ui";
import { variablesUsadas } from "@/lib/documentos/motor";
import type { TipoPlantilla, Variable } from "@/lib/documentos/plantillas-base";
import { guardarPlantilla, restaurarPlantilla, type EstadoPlantilla } from "../acciones";

export function EditorPlantilla({
  tipo,
  inicial,
  original,
  editada,
  variables,
}: {
  tipo: TipoPlantilla;
  inicial: string;
  original: string;
  editada: boolean;
  variables: Variable[];
}) {
  const [estado, accion] = useActionState<EstadoPlantilla, FormData>(guardarPlantilla, {});
  const [texto, setTexto] = useState(inicial);
  const area = useRef<HTMLTextAreaElement>(null);
  const claves = new Set(variables.map((v) => v.clave));
  const desconocidas = variablesUsadas(texto).filter((v) => !claves.has(v));
  const sinGuardar = texto.trim() !== inicial.trim();

  function insertar(valor: string) {
    const el = area.current;
    if (!el) return setTexto((t) => t + valor);
    // Se edita el valor real del campo (no una copia del estado) para evitar carreras con lo que se está escribiendo.
    el.focus();
    el.setRangeText(valor, el.selectionStart, el.selectionEnd, "end");
    setTexto(el.value);
  }

  return (
    <div className="space-y-4">
      <form action={accion} className="space-y-3">
        <input type="hidden" name="tipo" value={tipo} />
        <label htmlFor="contenido" className="sr-only">Texto de la plantilla</label>
        <textarea
          id="contenido"
          ref={area}
          name="contenido"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={18}
          spellCheck
          className="block w-full rounded-xl border-0 bg-white p-3 font-mono text-[14px] leading-relaxed ring-1 ring-slate-300 focus:ring-2 focus:ring-marca-600 focus:outline-none"
        />
        {desconocidas.length > 0 && (
          <Aviso tipo="alerta">
            Estas variables no existen y saldrán en blanco: {desconocidas.map((d) => `{{${d}}}`).join(", ")}
          </Aviso>
        )}
        {estado.error && <Aviso tipo="error">{estado.error}</Aviso>}
        {estado.ok && !sinGuardar && <Aviso tipo="exito">Plantilla guardada. Los próximos PDF usarán este texto.</Aviso>}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="submit"
            formAction={`/plantillas/${tipo}/vista-previa`}
            formMethod="post"
            formTarget="_blank"
            className={clasesBoton("secundario")}
          >
            <Eye className="size-5" aria-hidden /> Vista previa
          </button>
          <BotonEnviar disabled={!sinGuardar && editada}>Guardar</BotonEnviar>
        </div>
      </form>

      <Tarjeta className="space-y-3">
        <h2 className="font-bold">Insertar un dato</h2>
        <p className="text-sm text-slate-600">Toca un dato para ponerlo donde está el cursor. Se reemplaza con la información de cada auto.</p>
        <div className="flex flex-wrap gap-2">
          {variables.map((v) => (
            <button
              key={v.clave}
              type="button"
              onClick={() => insertar(`{{${v.clave}}}`)}
              className="min-h-10 rounded-full bg-marca-50 px-3 text-sm font-semibold text-marca-800 ring-1 ring-marca-200 hover:bg-marca-100"
              title={`{{${v.clave}}}`}
            >
              {v.descripcion}
            </button>
          ))}
          <button type="button" onClick={() => insertar("\n[[FIRMAS]]\n")} className="min-h-10 rounded-full bg-slate-100 px-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-300">
            Firmas (vendedor y comprador)
          </button>
        </div>
        <details className="text-sm text-slate-600">
          <summary className="cursor-pointer font-semibold text-marca-700">Formato del texto</summary>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li><code># Título</code> → título centrado</li>
            <li><code>## Subtítulo</code> → subtítulo en negrita</li>
            <li><code>- elemento</code> → viñeta</li>
            <li>Una línea en blanco separa párrafos</li>
            <li><code>[[FIRMAS]]</code>, <code>[[FIRMA_VENDEDOR]]</code>, <code>[[FIRMA_COMPRADOR]]</code> → espacios para firmar</li>
            <li>Si falta un dato, se imprime una línea <code>______________</code> para llenarlo a mano</li>
          </ul>
        </details>
      </Tarjeta>

      {(editada || texto !== original) && (
        <form
          action={async (fd) => {
            await restaurarPlantilla(fd);
            setTexto(original);
          }}
          onSubmit={(e) => {
            if (!confirm("¿Volver al texto original? Se perderán tus cambios.")) e.preventDefault();
          }}
        >
          <input type="hidden" name="tipo" value={tipo} />
          <Boton type="submit" variante="peligro" className="w-full">
            <RotateCcw className="size-5" aria-hidden /> Restaurar plantilla original
          </Boton>
        </form>
      )}
    </div>
  );
}
