import type { Metadata } from "next";
import { LogOut, UserMinus } from "lucide-react";
import { FuncionPro } from "@/components/aviso-suscripcion";
import { BotonConfirmar } from "@/components/boton-confirmar";
import { BotonEnviar } from "@/components/boton-enviar";
import { Seccion, Tarjeta } from "@/components/ui";
import { requerirUsuario } from "@/lib/auth";
import { listarInvitacionesPendientes, listarMiembros, obtenerPerfil } from "@/lib/datos";
import { enlaceInvitacion } from "@/lib/equipo";
import { INFO_PLANES } from "@/lib/planes";
import { siteUrl } from "@/lib/supabase/env";
import { obtenerSuscripcion } from "@/lib/suscripcion";
import { cambiarVisibilidadCostos, quitarMiembro, revocarInvitacion, salirDelEquipo } from "./acciones";
import { CompartirEnlace, FormularioInvitar } from "./formulario-invitar";

export const metadata: Metadata = { title: "Equipo" };

export default async function Equipo() {
  const [{ esDueno, userId }, miembros, invitaciones, suscripcion, perfil] = await Promise.all([
    requerirUsuario(),
    listarMiembros(),
    listarInvitacionesPendientes(),
    obtenerSuscripcion(),
    obtenerPerfil(),
  ]);
  const cupo = INFO_PLANES.concesionario.usuarios;
  const conEquipo = suscripcion.planEfectivo === "concesionario";
  const negocio = perfil.negocio || perfil.nombre || "mi negocio";

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Equipo</h1>
        <p className="text-slate-600">
          {esDueno ? "Invita a tus vendedores para que registren autos, gastos y ventas en tu negocio." : `Trabajas como vendedor en ${negocio}.`}
        </p>
      </div>

      <Seccion titulo={`Usuarios (${miembros.length}${conEquipo ? ` de ${cupo}` : ""})`}>
        <Tarjeta className="divide-y divide-slate-100 p-0">
          {miembros.map((m) => (
            <div key={m.user_id} className="flex items-center gap-3 py-3 pr-1 pl-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{m.nombre || m.email}{m.user_id === userId && <span className="font-normal text-slate-500"> (tú)</span>}</p>
                <p className="truncate text-sm text-slate-500">{m.email}</p>
              </div>
              <span className={m.rol === "dueno" ? "rounded-full bg-marca-50 px-2.5 py-0.5 text-xs font-bold text-marca-800" : "rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700"}>
                {m.rol === "dueno" ? "Dueño" : "Vendedor"}
              </span>
              {esDueno && m.rol === "vendedor" ? (
                <BotonConfirmar accion={quitarMiembro} campos={{ user_id: m.user_id }} mensaje={`¿Quitar a ${m.email} del equipo? Dejará de ver los autos del negocio.`} etiqueta={`Quitar a ${m.email}`}>
                  <UserMinus className="size-5" aria-hidden />
                </BotonConfirmar>
              ) : (
                <span className="w-3" />
              )}
            </div>
          ))}
        </Tarjeta>
      </Seccion>

      {esDueno && !conEquipo && (
        <FuncionPro titulo="Varios usuarios" texto="Con el plan Concesionario puedes sumar hasta 4 vendedores a tu negocio, cada uno con su propio acceso." />
      )}

      {esDueno && conEquipo && (
        <>
          <Seccion titulo="Invitar a un vendedor">
            <Tarjeta>
              <FormularioInvitar negocio={negocio} />
            </Tarjeta>
          </Seccion>

          {invitaciones.length > 0 && (
            <Seccion titulo="Invitaciones pendientes">
              <Tarjeta className="divide-y divide-slate-100 p-0">
                {invitaciones.map((i) => (
                  <div key={i.id} className="space-y-2 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 flex-1 truncate font-semibold">{i.email}</p>
                      <BotonConfirmar accion={revocarInvitacion} campos={{ id: i.id }} mensaje="¿Anular esta invitación?" etiqueta={`Anular invitación de ${i.email}`}>
                        <UserMinus className="size-5" aria-hidden />
                      </BotonConfirmar>
                    </div>
                    <CompartirEnlace enlace={enlaceInvitacion(siteUrl(), i.token)} negocio={negocio} />
                  </div>
                ))}
              </Tarjeta>
            </Seccion>
          )}

          <Seccion titulo="Costos y ganancias">
            <Tarjeta className="space-y-3">
              <p className="text-slate-700">
                {perfil.vendedores_ven_costos
                  ? "Tus vendedores ven el precio de compra, los gastos, el costo total y la ganancia de cada auto."
                  : "Tus vendedores NO ven el precio de compra, los montos de gastos ni las ganancias. Sí ven el precio de venta."}
              </p>
              <form action={cambiarVisibilidadCostos}>
                <input type="hidden" name="ver" value={perfil.vendedores_ven_costos ? "no" : "si"} />
                <BotonEnviar variante="secundario" className="w-full" textoCargando="Guardando…">
                  {perfil.vendedores_ven_costos ? "Ocultar costos a los vendedores" : "Mostrar costos a los vendedores"}
                </BotonEnviar>
              </form>
            </Tarjeta>
          </Seccion>

          <Tarjeta className="space-y-1 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">¿Qué puede hacer un vendedor?</p>
            <p>Ver y registrar autos, fotos, gastos, documentos y ventas; crear anuncios y contratos; usar la calculadora.</p>
            <p>No puede eliminar registros, ni cambiar plantillas, datos del negocio, suscripción o equipo.</p>
          </Tarjeta>
        </>
      )}

      {!esDueno && (
        <form action={salirDelEquipo}>
          <BotonEnviar variante="peligro" className="w-full" textoCargando="Saliendo…">
            <LogOut className="size-5" aria-hidden /> Salir del equipo
          </BotonEnviar>
        </form>
      )}
    </div>
  );
}
