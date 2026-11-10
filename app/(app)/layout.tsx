import Link from "next/link";
import { Settings } from "lucide-react";
import { Logo } from "@/components/logo";
import { BarraInferior, MenuEscritorio } from "@/components/navegacion";
import { requerirUsuario } from "@/lib/auth";
import { contarAlertasVencimiento } from "@/lib/datos";

export default async function LayoutApp({ children }: LayoutProps<"/">) {
  await requerirUsuario();
  const alertas = await contarAlertasVencimiento();

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/dashboard" aria-label="Ir al inicio">
            <Logo />
          </Link>
          <MenuEscritorio />
          <Link
            href="/ajustes"
            className="flex size-11 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
            aria-label="Ajustes"
          >
            <Settings className="size-6" aria-hidden />
          </Link>
        </div>
      </header>
      <main className="pb-barra mx-auto w-full max-w-5xl flex-1 px-4 pt-4 md:pb-10">{children}</main>
      <BarraInferior alertas={alertas} />
    </div>
  );
}
