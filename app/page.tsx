import Link from "next/link";
import { Bell, Calculator, CarFront, FileSpreadsheet, Megaphone, Wallet } from "lucide-react";
import { Logo } from "@/components/logo";
import { BotonLink } from "@/components/ui";
import { TablaPrecios } from "@/components/precios";

// Landing básica (Fase 1). La versión completa con precios y preguntas frecuentes llega después.

const beneficios = [
  {
    icono: Wallet,
    titulo: "Tu ganancia real, en soles",
    texto: "Compra + pintura + trámites + comisión… FLIPDESK suma todo y te dice cuánto ganaste de verdad con cada auto.",
  },
  {
    icono: Calculator,
    titulo: "¿Lo compro? en 10 segundos",
    texto: "Pon el precio, las reparaciones y en cuánto lo venderías. El semáforo te dice si conviene antes de cerrar el trato.",
  },
  {
    icono: Bell,
    titulo: "Que no se te pase el SOAT",
    texto: "Avisos de SOAT y revisión técnica que vencen en los próximos 30 días.",
  },
  {
    icono: CarFront,
    titulo: "Tu stock en el bolsillo",
    texto: "Fotos, gastos y documentos de cada auto desde el celular. Registras un auto en menos de un minuto.",
  },
  {
    icono: Megaphone,
    titulo: "Anuncios listos para copiar",
    texto: "Textos para Marketplace, Neoauto y TikTok creados con los datos de tu auto.",
  },
  {
    icono: FileSpreadsheet,
    titulo: "Adiós al cuaderno",
    texto: "Exporta todo a Excel cuando quieras: costos, ventas, márgenes y días en stock.",
  },
];

export default function Landing() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5">
        <Logo />
        <Link href="/login" className="inline-flex min-h-11 items-center rounded-xl px-4 font-semibold text-marca-700 hover:bg-marca-50">
          Entrar
        </Link>
      </header>

      <main className="flex-1">
        <section className="bg-gradient-to-b from-marca-50 to-white px-5 pt-10 pb-14 text-center">
          <div className="mx-auto max-w-2xl space-y-5">
            <p className="inline-block rounded-full bg-white px-3 py-1 text-sm font-semibold text-marca-800 ring-1 ring-marca-200">
              Para revendedores de autos usados en Perú 🇵🇪
            </p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Descubre cuánto ganas <span className="text-marca-700">de verdad</span> con cada auto
            </h1>
            <p className="text-lg text-slate-600">
              Deja el cuaderno y el Excel. Controla tu stock, tus gastos y tu ganancia real en soles desde el celular.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <BotonLink href="/registro" tamano="lg" className="w-full sm:w-auto">
                Crear cuenta gratis
              </BotonLink>
              <BotonLink href="/login" variante="secundario" tamano="lg" className="w-full sm:w-auto">
                Ya tengo cuenta
              </BotonLink>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-12" aria-labelledby="beneficios">
          <h2 id="beneficios" className="mb-8 text-center text-2xl font-bold">
            Todo tu negocio de autos en un solo lugar
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {beneficios.map(({ icono: Icono, titulo, texto }) => (
              <li key={titulo} className="space-y-2 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <Icono className="size-8 text-marca-700" aria-hidden />
                <h3 className="text-lg font-bold">{titulo}</h3>
                <p className="text-slate-600">{texto}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="precios" className="bg-slate-50 px-5 py-12" aria-labelledby="titulo-precios">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="text-center">
              <h2 id="titulo-precios" className="text-2xl font-bold">Precios simples, en soles</h2>
              <p className="text-slate-600">Paga con PayPal o con tu tarjeta de débito o crédito.</p>
            </div>
            <TablaPrecios
              accion={(id) => (
                <BotonLink href="/registro" variante={id === "pro" ? "primario" : "secundario"} className="w-full">
                  Probar gratis 14 días
                </BotonLink>
              )}
            />
          </div>
        </section>

        <section className="bg-marca-800 px-5 py-12 text-center text-white">
          <div className="mx-auto max-w-xl space-y-4">
            <h2 className="text-2xl font-bold">Empieza hoy, es gratis</h2>
            <p className="text-marca-100">Regístrate con tu correo o con Google y carga autos de ejemplo para probar.</p>
            <BotonLink href="/registro" tamano="lg" variante="secundario">
              Crear mi cuenta
            </BotonLink>
          </div>
        </section>
      </main>

      <footer className="px-5 py-6 text-center text-sm text-slate-500">© {new Date().getFullYear()} FLIPDESK · Hecho en Lima</footer>
    </div>
  );
}
