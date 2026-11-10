import { notFound } from "next/navigation";
import type { NextRequest } from "next/server";
import { documentoPdf, respuestaPdf } from "@/lib/documentos/generar";
import { esTipoPlantilla, INFO_PLANTILLA } from "@/lib/documentos/plantillas-base";
import type { Persona } from "@/lib/documentos/variables";
import { obtenerAuto, obtenerPerfil, obtenerPlantilla } from "@/lib/datos";
import { esFechaISO, hoyLima } from "@/lib/fechas";
import { parsearMonto } from "@/lib/formato";

const texto = (v: string | null, max = 200) => (v?.trim() ? v.trim().slice(0, max) : null);

/** Genera el contrato, recibo o constancia de entrega de un auto en PDF. */
export async function GET(request: NextRequest, { params }: RouteContext<"/autos/[id]/pdf/[tipo]">) {
  const { id, tipo } = await params;
  if (!esTipoPlantilla(tipo)) notFound();
  const q = request.nextUrl.searchParams;

  const [{ auto, vendedor: propietario, comprador }, perfil, plantilla] = await Promise.all([
    obtenerAuto(id),
    obtenerPerfil(),
    obtenerPlantilla(tipo),
  ]);

  const yo: Persona = { nombre: perfil.nombre, dni: perfil.dni, direccion: perfil.direccion, telefono: perfil.telefono };
  const vendedor: Persona = q.get("vende") === "propietario" ? (propietario ?? {}) : yo;
  const hoy = hoyLima();
  const fecha = q.get("fecha") && esFechaISO(q.get("fecha")!) ? q.get("fecha")! : hoy;
  const hora = q.get("hora") && /^\d{2}:\d{2}$/.test(q.get("hora")!) ? q.get("hora")! : null;
  const km = q.get("kilometraje") ? Number(q.get("kilometraje")!.replace(/[^\d]/g, "")) : null;

  const bytes = await documentoPdf(tipo, plantilla.contenido, {
    auto,
    vendedor,
    comprador: comprador ?? {},
    ciudad: perfil.ciudad ?? "Lima",
    hoy,
    params: {
      monto: parsearMonto(q.get("monto")),
      fecha,
      formaPago: texto(q.get("forma_pago"), 60),
      concepto: texto(q.get("concepto"), 160),
      hora,
      kilometraje: Number.isFinite(km) ? km : null,
      observaciones: texto(q.get("observaciones"), 600),
    },
  });

  return respuestaPdf(bytes, `${INFO_PLANTILLA[tipo].archivo}-${auto.placa}.pdf`);
}
