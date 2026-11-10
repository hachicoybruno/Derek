"use client";
import { useActionState } from "react";
import { BotonEnviar } from "@/components/boton-enviar";
import { Aviso } from "@/components/ui";
import { aceptarInvitacion } from "@/app/(app)/equipo/acciones";

export function AceptarInvitacion({ token }: { token: string }) {
  const [estado, accion] = useActionState(aceptarInvitacion, {});
  return (
    <form action={accion} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      {estado.error && <Aviso tipo="error">{estado.error}</Aviso>}
      <BotonEnviar tamano="lg" className="w-full" textoCargando="Uniéndote…">
        Unirme al equipo
      </BotonEnviar>
    </form>
  );
}
