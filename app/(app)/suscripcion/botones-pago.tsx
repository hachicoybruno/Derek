"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { CreditCard } from "lucide-react";
import { Aviso, Boton } from "@/components/ui";
import type { ConfigPagoCliente } from "@/lib/pagos/tipos";
import type { Plan } from "@/lib/planes";
import { confirmarSuscripcion } from "./acciones";

type PaypalSdk = {
  FUNDING: { PAYPAL: string; CARD: string };
  Buttons: (opciones: Record<string, unknown>) => { isEligible: () => boolean; render: (el: HTMLElement) => Promise<void>; close?: () => void };
};
declare global {
  interface Window {
    paypal?: PaypalSdk;
  }
}

function cargarSdk(clientId: string): Promise<PaypalSdk> {
  if (window.paypal) return Promise.resolve(window.paypal);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&vault=true&intent=subscription&components=buttons&locale=es_PE`;
    script.async = true;
    script.onload = () => (window.paypal ? resolve(window.paypal) : reject(new Error("SDK sin cargar")));
    script.onerror = () => reject(new Error("No se pudo cargar PayPal"));
    document.head.appendChild(script);
  });
}

export function BotonesPago({ plan, config, userId }: { plan: Plan; config: ConfigPagoCliente; userId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [procesando, startTransition] = useTransition();
  const contPaypal = useRef<HTMLDivElement>(null);
  const contTarjeta = useRef<HTMLDivElement>(null);
  const planId = config.proveedor === "paypal" ? config.planes[plan] : undefined;
  const sinPlanPaypal = config.proveedor === "paypal" && !planId;
  const [cargando, setCargando] = useState(config.proveedor === "paypal" && !sinPlanPaypal);

  const confirmar = (id: string) =>
    startTransition(async () => {
      const r = await confirmarSuscripcion(id, plan);
      if (r.error) return setError(r.error);
      router.push("/suscripcion?ok=1");
      router.refresh();
    });

  useEffect(() => {
    if (config.proveedor !== "paypal" || !planId) return;
    let cancelado = false;
    const botones: { close?: () => void }[] = [];
    cargarSdk(config.clientId)
      .then(async (paypal) => {
        if (cancelado) return;
        const opciones = (fundingSource: string) => ({
          fundingSource,
          style: { layout: "vertical", shape: "rect", height: 48, label: "subscribe" },
          createSubscription: (_: unknown, actions: { subscription: { create: (d: unknown) => Promise<string> } }) =>
            actions.subscription.create({ plan_id: planId, custom_id: userId }),
          onApprove: (data: { subscriptionID: string }) => confirmar(data.subscriptionID),
          onError: () => setError("PayPal no pudo procesar el pago. Intenta de nuevo o usa otro medio."),
        });
        for (const [fuente, cont] of [
          [paypal.FUNDING.PAYPAL, contPaypal.current],
          [paypal.FUNDING.CARD, contTarjeta.current],
        ] as const) {
          const b = paypal.Buttons(opciones(fuente));
          if (cont && b.isEligible()) {
            botones.push(b);
            await b.render(cont);
          }
        }
        setCargando(false);
      })
      .catch(() => {
        setError("No se pudo cargar PayPal. Revisa tu conexión.");
        setCargando(false);
      });
    return () => {
      cancelado = true;
      botones.forEach((b) => b.close?.());
    };
    // confirmar cambia en cada render; el SDK se monta una sola vez por plan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, planId, config, userId]);

  return (
    <div className="space-y-3">
      {config.proveedor === "simulado" ? (
        <>
          <Aviso tipo="alerta">Modo de prueba: no se realiza ningún cobro real.</Aviso>
          <Boton tamano="lg" className="w-full" disabled={procesando} onClick={() => confirmar(`sim_${plan}_${userId}`)}>
            Pagar con PayPal (simulado)
          </Boton>
          <Boton tamano="lg" variante="secundario" className="w-full" disabled={procesando} onClick={() => confirmar(`sim_${plan}_${userId}`)}>
            <CreditCard className="size-5" aria-hidden /> Pagar con tarjeta (simulado)
          </Boton>
        </>
      ) : (
        <>
          {cargando && <p className="text-center text-slate-500">Cargando medios de pago…</p>}
          <div ref={contPaypal} />
          <div ref={contTarjeta} />
        </>
      )}
      {procesando && <p className="text-center font-semibold text-marca-700">Confirmando tu pago…</p>}
      {sinPlanPaypal && <Aviso tipo="error">Este plan aún no está configurado en PayPal.</Aviso>}
      {error && <Aviso tipo="error">{error}</Aviso>}
    </div>
  );
}
