import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Seccion, Tarjeta, Vacio, cx } from "@/components/ui";
import { estadoVencimiento } from "@/lib/calculos";
import { DIAS_AVISO_VENCIMIENTO, listarVencimientos, type Vencimiento } from "@/lib/datos";
import { ETIQUETA_DOCUMENTO, type TipoDocumento } from "@/lib/dominio";
import { fecha, formatoPlaca } from "@/lib/formato";
import { obtenerSuscripcion } from "@/lib/suscripcion";
import { FuncionPro } from "@/components/aviso-suscripcion";

export const metadata: Metadata = { title: "Vencimientos" };

function Fila({ doc, hoy }: { doc: Vencimiento; hoy: string }) {
  const v = estadoVencimiento(doc.fecha_vencimiento, hoy)!;
  const texto =
    v.dias < 0
      ? `Venció hace ${-v.dias} ${v.dias === -1 ? "día" : "días"}`
      : v.dias === 0
        ? "Vence hoy"
        : v.dias === 1
          ? "Vence mañana"
          : `Vence en ${v.dias} días`;
  return (
    <Link href={`/autos/${doc.autos.id}`} className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-slate-50">
      <span
        className={cx(
          "flex size-12 shrink-0 flex-col items-center justify-center rounded-xl text-center leading-none font-black",
          v.dias < 0 ? "bg-red-100 text-red-800" : v.dias <= 7 ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-700",
        )}
        aria-hidden
      >
        <span className="text-lg">{Math.abs(v.dias)}</span>
        <span className="text-[10px] font-semibold">días</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">
          {ETIQUETA_DOCUMENTO[doc.tipo as TipoDocumento]} · {doc.autos.marca} {doc.autos.modelo}
        </span>
        <span className="block text-sm text-slate-600">
          <span className="font-mono">{formatoPlaca(doc.autos.placa)}</span> · {texto} ({fecha(doc.fecha_vencimiento)})
        </span>
      </span>
      <ChevronRight className="size-5 text-slate-400" aria-hidden />
    </Link>
  );
}

export default async function Vencimientos() {
  const suscripcion = await obtenerSuscripcion();
  if (!suscripcion.info?.alertas) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold">Vencimientos</h1>
        <FuncionPro
          titulo="Alertas de SOAT y revisión técnica"
          texto="Con el plan Pro ves en un solo lugar los documentos vencidos y los que vencen en los próximos 30 días, y recibes avisos por correo y WhatsApp. En tu plan actual puedes ver la fecha de cada documento en la ficha del auto."
        />
      </div>
    );
  }
  const { hoy, documentos } = await listarVencimientos();
  const vencidos = documentos.filter((d) => d.fecha_vencimiento! < hoy);
  const proximos = documentos.filter((d) => d.fecha_vencimiento! >= hoy);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vencimientos</h1>
        <p className="text-slate-600">
          SOAT y revisiones técnicas de tus autos sin vender que vencen en los próximos {DIAS_AVISO_VENCIMIENTO} días.
        </p>
      </div>

      {documentos.length === 0 ? (
        <Vacio titulo="Todo en orden" texto="No tienes SOAT ni revisiones técnicas por vencer. Registra las fechas en la ficha de cada auto para recibir avisos aquí." />
      ) : (
        <>
          {vencidos.length > 0 && (
            <Seccion titulo={`Vencidos (${vencidos.length})`}>
              <Tarjeta className="divide-y divide-slate-100 p-0 ring-red-200">
                {vencidos.map((d) => <Fila key={d.id} doc={d} hoy={hoy} />)}
              </Tarjeta>
            </Seccion>
          )}
          {proximos.length > 0 && (
            <Seccion titulo={`Por vencer (${proximos.length})`}>
              <Tarjeta className="divide-y divide-slate-100 p-0">
                {proximos.map((d) => <Fila key={d.id} doc={d} hoy={hoy} />)}
              </Tarjeta>
            </Seccion>
          )}
        </>
      )}
    </div>
  );
}
