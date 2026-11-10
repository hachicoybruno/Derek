import type { NextRequest } from "next/server";
import { listarAutos } from "@/lib/datos";
import { excelDeAutos } from "@/lib/excel";
import { hoyLima } from "@/lib/fechas";

/** Descarga la lista de autos (con los mismos filtros de la pantalla) en Excel. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const autos = await listarAutos({
    estado: searchParams.get("estado") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  });
  const hoy = hoyLima();
  const buffer = await excelDeAutos(autos, hoy);
  const [a, m, d] = hoy.split("-");

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="flipdesk-autos-${d}-${m}-${a}.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}
