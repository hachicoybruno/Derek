"use client";
import { useActionState } from "react";
import { BotonEnviar } from "@/components/boton-enviar";
import { Aviso, Campo, Entrada } from "@/components/ui";
import type { EstadoFormulario } from "../autos/acciones";
import { guardarAjustes } from "./acciones";

export type PerfilAjustes = {
  nombre: string | null;
  negocio: string | null;
  dni: string | null;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  umbral_verde: number;
  umbral_amarillo: number;
};
type Perfil = PerfilAjustes;

export function FormularioAjustes({ perfil, soloNombre = false }: { perfil: Perfil; soloNombre?: boolean }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(guardarAjustes, {});
  const e = estado.errores ?? {};
  const v = (campo: keyof Perfil) => estado.valores?.[campo] ?? String(perfil[campo] ?? "");

  return (
    <form action={accion} className="space-y-5" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Tu nombre completo" ayuda={soloNombre ? undefined : "Así aparecerá en contratos y recibos."}>
          <Entrada name="nombre" defaultValue={v("nombre")} autoComplete="name" />
        </Campo>
        {!soloNombre && (
          <Campo etiqueta="Nombre del negocio (opcional)">
            <Entrada name="negocio" defaultValue={v("negocio")} placeholder="Ej. Autos Andree" />
          </Campo>
        )}
      </div>

      {!soloNombre && (
        <>
      <fieldset className="space-y-3">
        <legend className="font-bold">Tus datos para contratos y recibos</legend>
        <p className="text-sm text-slate-600">Aparecen cuando tú figuras como vendedor. Puedes dejarlos vacíos y llenarlos a mano.</p>
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="DNI / CE / RUC" error={e.dni}>
            <Entrada name="dni" inputMode="numeric" maxLength={15} defaultValue={v("dni")} aria-invalid={Boolean(e.dni)} />
          </Campo>
          <Campo etiqueta="Teléfono">
            <Entrada name="telefono" type="tel" inputMode="tel" defaultValue={v("telefono")} />
          </Campo>
          <Campo etiqueta="Dirección" className="col-span-2">
            <Entrada name="direccion" defaultValue={v("direccion")} placeholder="Av. …, distrito" />
          </Campo>
          <Campo etiqueta="Ciudad (para la firma y la jurisdicción)" className="col-span-2">
            <Entrada name="ciudad" defaultValue={v("ciudad") || "Lima"} />
          </Campo>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-bold">Semáforo de la calculadora</legend>
        <p className="text-sm text-slate-600">Margen mínimo para considerar que un auto es buen negocio.</p>
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="🟢 Verde desde (%)" error={e.umbral_verde}>
            <Entrada name="umbral_verde" inputMode="decimal" defaultValue={v("umbral_verde")} aria-invalid={Boolean(e.umbral_verde)} />
          </Campo>
          <Campo etiqueta="🟡 Amarillo desde (%)" error={e.umbral_amarillo}>
            <Entrada name="umbral_amarillo" inputMode="decimal" defaultValue={v("umbral_amarillo")} aria-invalid={Boolean(e.umbral_amarillo)} />
          </Campo>
        </div>
        <p className="text-sm text-slate-500">🔴 Rojo: por debajo del amarillo.</p>
      </fieldset>

        </>
      )}

      {estado.error && <Aviso tipo="error">{estado.error}</Aviso>}
      {estado.ok && <Aviso tipo="exito">Ajustes guardados.</Aviso>}
      <BotonEnviar className="w-full">Guardar ajustes</BotonEnviar>
    </form>
  );
}
