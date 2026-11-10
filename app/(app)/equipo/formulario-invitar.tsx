"use client";
import { useActionState, useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { BotonEnviar } from "@/components/boton-enviar";
import { Aviso, Boton, Campo, Entrada } from "@/components/ui";
import { textoWhatsappInvitacion } from "@/lib/equipo";
import { invitar, type EstadoInvitacion } from "./acciones";

export function CompartirEnlace({ enlace, negocio }: { enlace: string; negocio: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="grid grid-cols-2 gap-2">
      <Boton
        type="button"
        variante="secundario"
        onClick={async () => {
          await navigator.clipboard.writeText(enlace).catch(() => {});
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2000);
        }}
      >
        {copiado ? <Check className="size-5" aria-hidden /> : <Copy className="size-5" aria-hidden />} {copiado ? "Copiado" : "Copiar enlace"}
      </Boton>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(textoWhatsappInvitacion(negocio, enlace))}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1fa855] px-4 font-semibold text-white"
      >
        <MessageCircle className="size-5" aria-hidden /> WhatsApp
      </a>
    </div>
  );
}

export function FormularioInvitar({ negocio }: { negocio: string }) {
  const [estado, accion] = useActionState<EstadoInvitacion, FormData>(invitar, {});
  return (
    <div className="space-y-3">
      <form action={accion} className="space-y-3" noValidate>
        <Campo etiqueta="Correo del vendedor">
          <Entrada name="email" type="email" inputMode="email" autoComplete="off" placeholder="vendedor@gmail.com" defaultValue={estado.ok ? "" : estado.email} />
        </Campo>
        {estado.error && <Aviso tipo="error">{estado.error}</Aviso>}
        <BotonEnviar className="w-full" textoCargando="Creando invitación…">Invitar</BotonEnviar>
      </form>
      {estado.ok && estado.enlace && (
        <Aviso tipo="exito" className="space-y-2">
          <p>
            Invitación creada para <strong>{estado.email}</strong>.{" "}
            {estado.correoEnviado ? "Le enviamos un correo." : "Compártele el enlace (vence en 7 días):"}
          </p>
          <CompartirEnlace enlace={estado.enlace} negocio={negocio} />
        </Aviso>
      )}
    </div>
  );
}
