"use client";
import { Trash2 } from "lucide-react";
import { BotonEnviar } from "@/components/boton-enviar";
import { eliminarAuto } from "../acciones";

export function BotonEliminarAuto({ id }: { id: string }) {
  return (
    <form
      action={eliminarAuto}
      onSubmit={(ev) => {
        if (!confirm("¿Eliminar este auto con sus fotos, gastos y documentos? No se puede deshacer.")) ev.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <BotonEnviar variante="peligro" className="w-full" textoCargando="Eliminando…">
        <Trash2 className="size-5" aria-hidden /> Eliminar auto
      </BotonEnviar>
    </form>
  );
}
