import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { TablaPrecios } from "@/components/precios";
import { Aviso, BotonLink, Seccion, Tarjeta, clasesBoton } from "@/components/ui";
import { requerirUsuario } from "@/lib/auth";
import { configPagoCliente } from "@/lib/pagos";
import { esPlan, INFO_PLANES } from "@/lib/planes";
import { obtenerSuscripcion } from "@/lib/suscripcion";
import { BotonCancelar } from "./boton-cancelar";
import { BotonesPago } from "./botones-pago";

export const metadata: Metadata = { title: "Suscripción" };

const fechaCorta = (iso: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
};

export default async function Suscripcion({ searchParams }: PageProps<"/suscripcion">) {
  const { plan: planParam, ok } = await searchParams;
  const { supabase, userId, esDueno } = await requerirUsuario();
  const [s, { data: pagos }] = await Promise.all([
    obtenerSuscripcion(),
    supabase.from("pagos").select("*").order("fecha", { ascending: false }).limit(24),
  ]);
  const config = configPagoCliente();
  const elegido = esPlan(planParam) ? planParam : null;
  const activa = s.estado === "activa" && s.planEfectivo;

  let estadoTexto: string;
  if (s.enPrueba) estadoTexto = `Prueba gratis del plan Pro: te quedan ${s.diasRestantesPrueba} días.`;
  else if (activa) estadoTexto = `Plan ${INFO_PLANES[s.plan].nombre} activo.${s.periodoHasta ? ` Próximo cobro: ${fechaCorta(s.periodoHasta)}.` : ""}`;
  else if (s.estado === "cancelada" && s.planEfectivo) estadoTexto = `Cancelaste tu plan ${INFO_PLANES[s.plan].nombre}. Tienes acceso hasta el ${fechaCorta(s.periodoHasta)}.`;
  else if (s.estado === "suspendida") estadoTexto = "Tu suscripción está suspendida porque no se pudo realizar el cobro.";
  else estadoTexto = "No tienes un plan activo. Tus datos siguen guardados: elige un plan para seguir agregando autos.";

  if (!esDueno) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="text-2xl font-bold">Suscripción</h1>
        <Tarjeta className="space-y-2">
          <p className="font-semibold">{estadoTexto}</p>
          <p className="text-slate-600">El dueño del negocio gestiona el plan y los pagos.</p>
        </Tarjeta>
      </div>
    );
  }

  if (elegido) {
    const p = INFO_PLANES[elegido];
    return (
      <div className="mx-auto max-w-md space-y-4">
        <Link href="/suscripcion" className="inline-flex min-h-11 items-center gap-1 font-semibold text-marca-700">
          <ChevronLeft className="size-5" aria-hidden /> Planes
        </Link>
        <h1 className="text-2xl font-bold">Plan {p.nombre}</h1>
        <Tarjeta className="space-y-1">
          <p className="text-3xl font-black">S/ {p.precioSoles} <span className="text-base font-semibold text-slate-500">/mes</span></p>
          <p className="text-sm text-slate-600">
            Se cobra <strong>US$ {p.precioUsd} al mes</strong> con PayPal (PayPal no cobra en soles; tu banco hace la conversión). Renovación automática, cancela cuando quieras.
          </p>
          {s.enPrueba && <p className="text-sm text-slate-600">Si te suscribes ahora, el cobro empieza hoy y tu plan queda activo de inmediato.</p>}
        </Tarjeta>
        {config ? (
          <BotonesPago plan={elegido} config={config} userId={userId} />
        ) : (
          <Aviso tipo="error">Los pagos todavía no están configurados. Escríbenos para activar tu plan.</Aviso>
        )}
        <p className="text-center text-xs text-slate-500">Pago seguro procesado por PayPal. FLIPDESK no guarda los datos de tu tarjeta.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Suscripción</h1>
      {ok && <Aviso tipo="exito">¡Listo! Tu plan está activo. Gracias por confiar en FLIPDESK.</Aviso>}

      <Tarjeta className="space-y-3">
        <p className="font-semibold">{estadoTexto}</p>
        {activa && <BotonCancelar hasta={fechaCorta(s.periodoHasta)} />}
      </Tarjeta>

      <Seccion titulo={activa ? "Cambiar de plan" : "Elige tu plan"}>
        <TablaPrecios
          planActual={activa || (s.estado === "cancelada" && s.planEfectivo) ? s.plan : null}
          accion={(id) =>
            activa && s.plan === id ? (
              <span className={clasesBoton("secundario", "md", "w-full pointer-events-none opacity-70")}>Plan actual</span>
            ) : (
              <BotonLink href={`/suscripcion?plan=${id}`} variante={INFO_PLANES[id].destacado ? "primario" : "secundario"} className="w-full">
                {activa ? `Cambiar a ${INFO_PLANES[id].nombre}` : `Elegir ${INFO_PLANES[id].nombre}`}
              </BotonLink>
            )
          }
        />
        {activa && <p className="text-sm text-slate-600">Al cambiar de plan, tu suscripción anterior se cancela automáticamente.</p>}
      </Seccion>

      {pagos && pagos.length > 0 && (
        <Seccion titulo="Historial de pagos">
          <Tarjeta className="divide-y divide-slate-100 p-0">
            {pagos.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  <span className="block font-semibold">{p.plan && esPlan(p.plan) ? `Plan ${INFO_PLANES[p.plan].nombre}` : "Suscripción"}</span>
                  <span className="text-slate-500">{fechaCorta(p.fecha)}</span>
                </span>
                <span className="text-right">
                  <span className="block font-bold">{p.moneda === "USD" ? "US$" : p.moneda} {Number(p.monto).toFixed(2)}</span>
                  <span className={p.estado === "completado" ? "text-emerald-700" : "text-red-700"}>{p.estado}</span>
                </span>
              </div>
            ))}
          </Tarjeta>
        </Seccion>
      )}
    </div>
  );
}
