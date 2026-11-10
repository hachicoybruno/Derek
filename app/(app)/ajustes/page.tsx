import type { Metadata } from "next";
import { FileText, LogOut } from "lucide-react";
import { BotonDatosEjemplo } from "@/components/boton-datos-ejemplo";
import { BotonEnviar } from "@/components/boton-enviar";
import { BotonLink, Seccion, Tarjeta } from "@/components/ui";
import { obtenerPerfil } from "@/lib/datos";
import { cerrarSesion } from "../../(auth)/acciones";
import { FormularioAjustes } from "./formulario-ajustes";

export const metadata: Metadata = { title: "Ajustes" };

export default async function Ajustes() {
  const perfil = await obtenerPerfil();
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

      <Seccion titulo="Documentos">
        <BotonLink href="/plantillas" variante="secundario" className="w-full">
          <FileText className="size-5" aria-hidden /> Editar plantillas de contrato, recibo y entrega
        </BotonLink>
      </Seccion>

      <Seccion titulo="Datos de ejemplo">
        <Tarjeta className="space-y-3">
          <p className="text-slate-600">Carga 5 autos de ejemplo con gastos y documentos para probar la app o hacer una demo.</p>
          <BotonDatosEjemplo />
        </Tarjeta>
      </Seccion>

      <Seccion titulo="Cuenta">
        <Tarjeta className="space-y-3">
          <p className="text-slate-600">
            Sesión iniciada como <strong className="text-slate-900">{perfil.email}</strong>
          </p>
          <form action={cerrarSesion}>
            <BotonEnviar variante="peligro" className="w-full" textoCargando="Saliendo…">
              <LogOut className="size-5" aria-hidden /> Cerrar sesión
            </BotonEnviar>
          </form>
        </Tarjeta>
      </Seccion>
    </div>
  );
}
