import type { Metadata } from "next";
import { Aviso, Tarjeta } from "@/components/ui";
import { rutaSegura } from "@/lib/auth";
import { BotonGoogle } from "../boton-google";
import { FormularioAuth } from "../formulario-auth";

export const metadata: Metadata = { title: "Iniciar sesión" };

const errores: Record<string, string> = {
  enlace: "El enlace no es válido o ya expiró. Intenta iniciar sesión de nuevo.",
  google: "No se pudo iniciar sesión con Google. Intenta de nuevo o usa tu correo.",
};

export default async function Login({ searchParams }: PageProps<"/login">) {
  const { siguiente, error } = await searchParams;
  const destino = typeof siguiente === "string" ? rutaSegura(siguiente) : undefined;
  return (
    <Tarjeta className="space-y-5 p-6">
      <h1 className="text-2xl font-bold">Inicia sesión</h1>
      {typeof error === "string" && errores[error] && <Aviso tipo="error">{errores[error]}</Aviso>}
      <BotonGoogle siguiente={destino} />
      <Separador />
      <FormularioAuth modo="login" siguiente={destino} />
    </Tarjeta>
  );
}

function Separador() {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-500">
      <span className="h-px flex-1 bg-slate-200" />o con tu correo<span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}
