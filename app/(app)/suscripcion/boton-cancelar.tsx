"use client";
import { useState, useTransition } from "react";
import { Aviso, Boton } from "@/components/ui";
import { cancelarSuscripcion } from "./acciones";

export function BotonCancelar({ hasta }: { hasta: string | null }) {
  const [error, setError] = useState<string>();
  const [pendiente, startTransition] = useTransition();
  return (
    <div className="space-y-2">
      <Boton
        variante="peligro"
        className="w-full"
        disabled={pendiente}
        onClick={() => {
          if (!confirm(`¿Cancelar tu suscripción? No se te volverá a cobrar${hasta ? ` y tendrás acceso hasta el ${hasta}` : ""}.`)) return;
          startTransition(async () => {
            const r = await cancelarSuscripcion();
            if (r.error) setError(r.error);
          });
        }}
      >
        {pendiente ? "Cancelando…" : "Cancelar suscripción"}
      </Boton>
      {error && <Aviso tipo="error">{error}</Aviso>}
    </div>
  );
}
