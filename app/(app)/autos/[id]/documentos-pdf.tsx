import Link from "next/link";
import { FileDown } from "lucide-react";
import { Aviso, Campo, clasesBoton, Entrada, EntradaSoles, Selector, AreaTexto } from "@/components/ui";
import { AVISO_LEGAL, INFO_PLANTILLA, type TipoPlantilla } from "@/lib/documentos/plantillas-base";
import { FORMAS_PAGO, type Persona } from "@/lib/documentos/variables";

type Props = {
  autoId: string;
  hoy: string;
  hora: string;
  precio: number | null;
  fechaVenta: string | null;
  kilometraje: number | null;
  yo: Persona;
  propietario: Persona | null;
  comprador: Persona | null;
};

function Faltantes({ persona, quien }: { persona: Persona | null; quien: string }) {
  const faltan = [!persona?.nombre && "nombre", !persona?.dni && "DNI", !persona?.direccion && "dirección"].filter(Boolean);
  if (!faltan.length) return null;
  return (
    <li>
      Falta {faltan.join(", ")} de {quien}.
    </li>
  );
}

function SelectorVende({ yo, propietario }: { yo: Persona; propietario: Persona | null }) {
  return (
    <Campo etiqueta="¿Quién vende?" className="col-span-2">
      <Selector name="vende" defaultValue={yo.nombre || !propietario ? "yo" : "propietario"}>
        <option value="yo">Yo{yo.nombre ? ` (${yo.nombre})` : ""}</option>
        <option value="propietario" disabled={!propietario}>
          Dueño anterior{propietario?.nombre ? ` (${propietario.nombre})` : " (regístralo abajo como vendedor)"}
        </option>
      </Selector>
    </Campo>
  );
}

function Documento({ tipo, autoId, children }: { tipo: TipoPlantilla; autoId: string; children: React.ReactNode }) {
  const info = INFO_PLANTILLA[tipo];
  return (
    <details className="group rounded-2xl bg-white ring-1 ring-slate-200">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4">
        <FileDown className="size-6 shrink-0 text-marca-700" aria-hidden />
        <span className="flex-1">
          <span className="block font-semibold">{info.nombre}</span>
          <span className="block text-sm text-slate-500">{info.descripcion}</span>
        </span>
        <span aria-hidden className="text-marca-700 transition group-open:rotate-180">▾</span>
      </summary>
      <form action={`/autos/${autoId}/pdf/${tipo}`} method="get" target="_blank" className="grid grid-cols-2 gap-3 border-t border-slate-200 p-4">
        {children}
        <button type="submit" className={clasesBoton("primario", "md", "col-span-2")}>
          <FileDown className="size-5" aria-hidden /> Generar PDF
        </button>
      </form>
    </details>
  );
}

export function DocumentosPdf({ autoId, hoy, hora, precio, fechaVenta, kilometraje, yo, propietario, comprador }: Props) {
  const precioTexto = precio ? String(precio) : "";
  return (
    <div className="space-y-3">
      <Aviso tipo="alerta">
        <strong>{AVISO_LEGAL}</strong> Puedes editar los textos en{" "}
        <Link href="/plantillas" className="font-semibold underline">Plantillas</Link>.
      </Aviso>
      {(!comprador?.dni || !yo.dni || !comprador?.nombre) && (
        <Aviso tipo="info">
          <ul className="list-inside list-disc">
            <Faltantes persona={yo} quien="ti (Ajustes)" />
            <Faltantes persona={comprador} quien="el comprador (abajo)" />
          </ul>
          <p className="mt-1">Los datos que falten quedarán como línea en blanco para llenar a mano.</p>
        </Aviso>
      )}

      <Documento tipo="contrato" autoId={autoId}>
        <SelectorVende yo={yo} propietario={propietario} />
        <Campo etiqueta="Precio de venta">
          <EntradaSoles name="monto" defaultValue={precioTexto} />
        </Campo>
        <Campo etiqueta="Fecha">
          <Entrada name="fecha" type="date" defaultValue={fechaVenta ?? hoy} />
        </Campo>
        <Campo etiqueta="Forma de pago" className="col-span-2">
          <Selector name="forma_pago" defaultValue="transferencia bancaria">
            {FORMAS_PAGO.map((f) => <option key={f} value={f}>{f[0].toUpperCase() + f.slice(1)}</option>)}
          </Selector>
        </Campo>
      </Documento>

      <Documento tipo="recibo" autoId={autoId}>
        <SelectorVende yo={yo} propietario={propietario} />
        <Campo etiqueta="Monto recibido">
          <EntradaSoles name="monto" defaultValue={precioTexto} />
        </Campo>
        <Campo etiqueta="Fecha">
          <Entrada name="fecha" type="date" defaultValue={hoy} />
        </Campo>
        <Campo etiqueta="Concepto" className="col-span-2">
          <Entrada name="concepto" list="conceptos" defaultValue="pago total por la compra del vehículo" />
        </Campo>
        <datalist id="conceptos">
          <option value="pago total por la compra del vehículo" />
          <option value="adelanto por la compra del vehículo" />
          <option value="separación del vehículo" />
          <option value="saldo por la compra del vehículo" />
        </datalist>
        <Campo etiqueta="Forma de pago" className="col-span-2">
          <Selector name="forma_pago" defaultValue="efectivo">
            {FORMAS_PAGO.map((f) => <option key={f} value={f}>{f[0].toUpperCase() + f.slice(1)}</option>)}
          </Selector>
        </Campo>
      </Documento>

      <Documento tipo="entrega" autoId={autoId}>
        <SelectorVende yo={yo} propietario={propietario} />
        <Campo etiqueta="Fecha">
          <Entrada name="fecha" type="date" defaultValue={hoy} />
        </Campo>
        <Campo etiqueta="Hora">
          <Entrada name="hora" type="time" defaultValue={hora} />
        </Campo>
        <Campo etiqueta="Kilometraje al entregar" className="col-span-2">
          <Entrada name="kilometraje" inputMode="numeric" defaultValue={kilometraje ?? ""} />
        </Campo>
        <Campo etiqueta="Observaciones (opcional)" className="col-span-2">
          <AreaTexto name="observaciones" rows={2} placeholder="Ej. rayón en parachoques posterior, se entrega con alarma" />
        </Campo>
      </Documento>
    </div>
  );
}
