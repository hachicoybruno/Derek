"use client";
import { useActionState, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { BotonEnviar } from "@/components/boton-enviar";
import { Aviso, Boton, Campo, Entrada } from "@/components/ui";
import { enviarAlertaPrueba, guardarAlertas, type EstadoAlertas } from "./alertas";

type Props = {
  inicial: { alertas_email: boolean; alertas_whatsapp: boolean; correo_alertas: string | null; whatsapp: string | null };
  correoCuenta: string;
};

function Interruptor({ name, etiqueta, defaultChecked }: { name: string; etiqueta: string; defaultChecked: boolean }) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3">
      <span className="font-semibold">{etiqueta}</span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span aria-hidden className="relative h-7 w-12 rounded-full bg-slate-300 transition peer-checked:bg-emerald-600 peer-focus-visible:outline-3 peer-focus-visible:outline-marca-500 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
    </label>
  );
}

export function FormularioAlertas({ inicial, correoCuenta }: Props) {
  const [estado, accion] = useActionState<EstadoAlertas, FormData>(guardarAlertas, {});
  const [prueba, setPrueba] = useState<EstadoAlertas>({});
  const [enviando, startTransition] = useTransition();
  const e = estado.errores ?? {};

  return (
    <div className="space-y-4">
      <form action={accion} className="space-y-3" noValidate>
        <Interruptor name="alertas_email" etiqueta="Avisos por correo" defaultChecked={inicial.alertas_email} />
        <Campo etiqueta="Correo para avisos (opcional)" ayuda={`Si lo dejas vacío usamos ${correoCuenta}.`} error={e.correo_alertas}>
          <Entrada name="correo_alertas" type="email" inputMode="email" defaultValue={inicial.correo_alertas ?? ""} placeholder={correoCuenta} />
        </Campo>
        <Interruptor name="alertas_whatsapp" etiqueta="Avisos por WhatsApp" defaultChecked={inicial.alertas_whatsapp} />
        <Campo etiqueta="Celular para WhatsApp" error={e.whatsapp} ayuda="Ej. 987 654 321 (Perú) o con código de país.">
          <Entrada name="whatsapp" type="tel" inputMode="tel" defaultValue={inicial.whatsapp ?? ""} placeholder="987 654 321" />
        </Campo>
        <p className="text-sm text-slate-600">Te avisamos a las 8 a. m. cuando un SOAT o revisión técnica vence en 30 días, 7 días, 1 día y el día del vencimiento.</p>
        {estado.error && <Aviso tipo="error">{estado.error}</Aviso>}
        {estado.ok && <Aviso tipo="exito">{estado.mensaje}</Aviso>}
        <BotonEnviar className="w-full">Guardar alertas</BotonEnviar>
      </form>
      <Boton
        variante="secundario"
        className="w-full"
        disabled={enviando}
        onClick={() => startTransition(async () => setPrueba(await enviarAlertaPrueba()))}
      >
        <Send className="size-5" aria-hidden /> {enviando ? "Enviando…" : "Enviar aviso de prueba ahora"}
      </Boton>
      {prueba.error && <Aviso tipo="alerta">{prueba.error}</Aviso>}
      {prueba.ok && <Aviso tipo="exito">{prueba.mensaje}</Aviso>}
    </div>
  );
}
