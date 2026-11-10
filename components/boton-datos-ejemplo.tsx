"use client";
import { useActionState } from "react";
import { Sparkles } from "lucide-react";
import { cargarDatosEjemplo } from "@/app/(app)/ajustes/datos-ejemplo";
import { BotonEnviar } from "./boton-enviar";
import { Aviso } from "./ui";

export function BotonDatosEjemplo() {
  const [estado, accion] = useActionState(cargarDatosEjemplo, {});
  return (
    <form action={accion} className="w-full max-w-sm space-y-2">
      <BotonEnviar variante="secundario" className="w-full" textoCargando="Cargando autos de ejemplo…">
        <Sparkles className="size-5" aria-hidden /> Cargar 5 autos de ejemplo
      </BotonEnviar>
      {estado.error && <Aviso tipo="alerta">{estado.error}</Aviso>}
      {estado.ok && <Aviso tipo="exito">¡Listo! Se cargaron 5 autos de ejemplo.</Aviso>}
    </form>
  );
}
