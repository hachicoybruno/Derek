import type { Metadata } from "next";
import { Bell, CreditCard, FileText, LogOut, Users } from "lucide-react";
import { FuncionPro } from "@/components/aviso-suscripcion";
import { BotonDatosEjemplo } from "@/components/boton-datos-ejemplo";
import { BotonEnviar } from "@/components/boton-enviar";
import { BotonLink, Seccion, Tarjeta } from "@/components/ui";
import { requerirUsuario } from "@/lib/auth";
import { obtenerMiPerfil, obtenerPerfil } from "@/lib/datos";
import { obtenerSuscripcion } from "@/lib/suscripcion";
import { cerrarSesion } from "../../(auth)/acciones";
import { FormularioAjustes } from "./formulario-ajustes";
import { FormularioAlertas } from "./formulario-alertas";

export const metadata: Metadata = { title: "Ajustes" };

function Cuenta({ email }: { email: string }) {
  return (
    <Seccion titulo="Cuenta">
      <Tarjeta className="space-y-3">
        <p className="text-slate-600">
          Sesión iniciada como <strong className="text-slate-900">{email}</strong>
        </p>
        <form action={cerrarSesion}>
          <BotonEnviar variante="peligro" className="w-full" textoCargando="Saliendo…">
            <LogOut className="size-5" aria-hidden /> Cerrar sesión
          </BotonEnviar>
        </form>
      </Tarjeta>
    </Seccion>
  );
}

export default async function Ajustes() {
  const [{ esDueno, email }, perfil, yo, suscripcion] = await Promise.all([requerirUsuario(), obtenerPerfil(), obtenerMiPerfil(), obtenerSuscripcion()]);

  if (!esDueno) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <h1 className="text-2xl font-bold">Ajustes</h1>
        <Tarjeta>
          <FormularioAjustes
            soloNombre
            perfil={{ nombre: yo.nombre, negocio: null, dni: null, telefono: null, direccion: null, ciudad: null, umbral_verde: 15, umbral_amarillo: 8 }}
          />
        </Tarjeta>
        <Seccion titulo="Negocio">
          <Tarjeta className="space-y-3">
            <p className="text-slate-600">
              Trabajas como <strong className="text-slate-900">vendedor</strong> en{" "}
              <strong className="text-slate-900">{perfil.negocio || perfil.nombre || "el negocio"}</strong>.
            </p>
            <BotonLink href="/equipo" variante="secundario" className="w-full">
              <Users className="size-5" aria-hidden /> Ver equipo
            </BotonLink>
          </Tarjeta>
        </Seccion>
        <Cuenta email={email} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Ajustes</h1>
      <Tarjeta>
        <FormularioAjustes
          perfil={{
            nombre: perfil.nombre ?? null,
            negocio: perfil.negocio ?? null,
            dni: perfil.dni ?? null,
            telefono: perfil.telefono ?? null,
            direccion: perfil.direccion ?? null,
            ciudad: perfil.ciudad ?? "Lima",
            umbral_verde: Number(perfil.umbral_verde ?? 15),
            umbral_amarillo: Number(perfil.umbral_amarillo ?? 8),
          }}
        />
      </Tarjeta>

      <Seccion titulo="Alertas de vencimiento">
        {suscripcion.info?.alertas ? (
          <Tarjeta>
            <FormularioAlertas
              correoCuenta={email}
              inicial={{
                alertas_email: perfil.alertas_email ?? true,
                alertas_whatsapp: perfil.alertas_whatsapp ?? false,
                correo_alertas: perfil.correo_alertas ?? null,
                whatsapp: perfil.whatsapp ?? null,
              }}
            />
          </Tarjeta>
        ) : (
          <FuncionPro titulo="Alertas por correo y WhatsApp" texto="Recibe avisos de SOAT y revisiones técnicas por vencer con el plan Pro o Concesionario." />
        )}
      </Seccion>

      <Seccion titulo="Negocio">
        <div className="grid gap-2">
          <BotonLink href="/suscripcion" variante="secundario" className="w-full">
            <CreditCard className="size-5" aria-hidden /> Mi plan y pagos
          </BotonLink>
          <BotonLink href="/equipo" variante="secundario" className="w-full">
            <Users className="size-5" aria-hidden /> Equipo (vendedores)
          </BotonLink>
          <BotonLink href="/plantillas" variante="secundario" className="w-full">
            <FileText className="size-5" aria-hidden /> Plantillas de contrato, recibo y entrega
          </BotonLink>
          <BotonLink href="/vencimientos" variante="secundario" className="w-full">
            <Bell className="size-5" aria-hidden /> Vencimientos
          </BotonLink>
        </div>
      </Seccion>

      <Seccion titulo="Datos de ejemplo">
        <Tarjeta className="space-y-3">
          <p className="text-slate-600">Carga 5 autos de ejemplo con gastos y documentos para probar la app o hacer una demo.</p>
          <BotonDatosEjemplo />
        </Tarjeta>
      </Seccion>

      <Cuenta email={email} />
    </div>
  );
}
