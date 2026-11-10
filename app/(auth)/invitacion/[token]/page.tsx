import type { Metadata } from "next";
import { Aviso, BotonLink, Tarjeta } from "@/components/ui";
import { crearClienteServidor } from "@/lib/supabase/server";
import { AceptarInvitacion } from "./aceptar";

export const metadata: Metadata = { title: "Invitación" };

type Info = { email: string; negocio: string; dueno: string | null; vigente: boolean } | null;

export default async function Invitacion({ params }: PageProps<"/invitacion/[token]">) {
  const { token } = await params;
  const supabase = await crearClienteServidor();
  const [{ data }, { data: sesion }] = await Promise.all([
    /^[0-9a-f]{64}$/.test(token) ? supabase.rpc("ver_invitacion", { p_token: token }) : Promise.resolve({ data: null }),
    supabase.auth.getClaims(),
  ]);
  const info = data as Info;
  const correoSesion = (sesion?.claims?.email as string | undefined)?.toLowerCase();
  const siguiente = encodeURIComponent(`/invitacion/${token}`);

  if (!info || !info.vigente) {
    return (
      <Tarjeta className="space-y-4 p-6">
        <h1 className="text-2xl font-bold">Invitación no válida</h1>
        <Aviso tipo="error">El enlace ya se usó, expiró o no existe. Pide al dueño del negocio una nueva invitación.</Aviso>
        <BotonLink href="/" variante="secundario" className="w-full">Ir al inicio</BotonLink>
      </Tarjeta>
    );
  }

  return (
    <Tarjeta className="space-y-5 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Te invitaron a {info.negocio}</h1>
        <p className="text-slate-600">
          {info.dueno ? `${info.dueno} te invitó` : "Te invitaron"} a trabajar como <strong>vendedor</strong> en FLIPDESK con el correo{" "}
          <strong>{info.email}</strong>.
        </p>
      </div>
      {!correoSesion ? (
        <div className="space-y-3">
          <BotonLink href={`/registro?siguiente=${siguiente}&email=${encodeURIComponent(info.email)}`} tamano="lg" className="w-full">
            Crear mi cuenta
          </BotonLink>
          <BotonLink href={`/login?siguiente=${siguiente}`} variante="secundario" tamano="lg" className="w-full">
            Ya tengo cuenta
          </BotonLink>
        </div>
      ) : correoSesion !== info.email ? (
        <Aviso tipo="alerta">
          Iniciaste sesión como <strong>{correoSesion}</strong>, pero la invitación es para <strong>{info.email}</strong>. Cierra sesión en
          Ajustes y entra con el correo invitado.
        </Aviso>
      ) : (
        <AceptarInvitacion token={token} />
      )}
    </Tarjeta>
  );
}
