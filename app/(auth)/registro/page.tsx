import type { Metadata } from "next";
import { Tarjeta } from "@/components/ui";
import { rutaSegura } from "@/lib/auth";
import { BotonGoogle } from "../boton-google";
import { FormularioAuth } from "../formulario-auth";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function Registro({ searchParams }: PageProps<"/registro">) {
  const { siguiente, email } = await searchParams;
  const destino = typeof siguiente === "string" ? rutaSegura(siguiente) : undefined;
  const correo = typeof email === "string" ? email.slice(0, 120) : undefined;
  return (
    <Tarjeta className="space-y-5 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Crea tu cuenta</h1>
        <p className="text-slate-600">Descubre cuánto ganas de verdad con cada auto.</p>
      </div>
      <BotonGoogle siguiente={destino} />
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span className="h-px flex-1 bg-slate-200" />o con tu correo<span className="h-px flex-1 bg-slate-200" />
      </div>
      <FormularioAuth modo="registro" siguiente={destino} emailInicial={correo} />
    </Tarjeta>
  );
}
