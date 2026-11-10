import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Bell, Calculator, CarFront, Check, FileSignature, FileSpreadsheet, Megaphone, Users, Wallet, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { TablaPrecios } from "@/components/precios";
import { BotonLink } from "@/components/ui";
import { DIAS_PRUEBA } from "@/lib/planes";
import capDashboard from "@/public/capturas/dashboard.webp";
import capAutos from "@/public/capturas/autos.webp";
import capFicha from "@/public/capturas/ficha.webp";
import capCalculadora from "@/public/capturas/calculadora.webp";

export const metadata: Metadata = {
  title: "FLIPDESK — Descubre cuánto ganas de verdad con cada auto",
  description:
    "Sistema para revendedores de autos usados en Perú: stock, gastos, ganancia real en soles, calculadora ¿lo compro?, SOAT y contratos. Desde el celular.",
  openGraph: {
    title: "FLIPDESK — Descubre cuánto ganas de verdad con cada auto",
    description: "Deja el cuaderno y el Excel. Controla tu stock, tus gastos y tu ganancia real en soles desde el celular.",
    locale: "es_PE",
    type: "website",
  },
};

const problemas = [
  "Anotas los gastos en un cuaderno y al final del mes no sabes cuánto ganaste de verdad.",
  "La pintura, el trámite, la grúa y la comisión se te olvidan… y tu ganancia es menor de lo que crees.",
  "Compras un auto “porque está barato” y después el margen no da.",
  "Se te vence el SOAT o la revisión técnica de un auto que estás vendiendo.",
  "Tienes plata parada en autos que llevan meses sin venderse y no lo ves.",
];

const beneficios = [
  { icono: Wallet, titulo: "Tu ganancia real, en soles", texto: "Compra + todos los gastos = costo real. Vendes y ves al instante cuánto ganaste y tu margen." },
  { icono: Calculator, titulo: "¿Lo compro? en 10 segundos", texto: "Precio, reparaciones y precio de venta: el semáforo te dice si conviene antes de cerrar el trato." },
  { icono: Bell, titulo: "Que no se te pase el SOAT", texto: "Avisos de SOAT y revisión técnica por correo y WhatsApp antes de que venzan." },
  { icono: CarFront, titulo: "Tu stock en el bolsillo", texto: "Fotos, gastos y documentos de cada auto. Registras un auto en menos de un minuto." },
  { icono: FileSignature, titulo: "Contratos y recibos en PDF", texto: "Contrato de compraventa, recibo y constancia de entrega con los datos del auto y del comprador." },
  { icono: Megaphone, titulo: "Anuncios listos para copiar", texto: "Textos para Marketplace, Neoauto y TikTok creados con los datos de tu auto." },
  { icono: Users, titulo: "Trabaja con tu equipo", texto: "Tus vendedores registran autos y ventas; tú decides si ven tus costos y ganancias." },
  { icono: FileSpreadsheet, titulo: "Tus datos son tuyos", texto: "Exporta todo a Excel cuando quieras: costos, ventas, márgenes y días en stock." },
];

const capturas = [
  { imagen: capDashboard, titulo: "Cuánto ganaste este mes", texto: "Ganancia, stock, capital parado y avisos de vencimiento." },
  { imagen: capAutos, titulo: "Todos tus autos", texto: "Busca por placa o modelo y filtra por estado." },
  { imagen: capFicha, titulo: "La ficha de cada auto", texto: "Costo total, ganancia real, margen y días en stock." },
  { imagen: capCalculadora, titulo: "¿Lo compro?", texto: "El semáforo te dice si el negocio conviene." },
];

const preguntas = [
  {
    p: "¿Necesito tarjeta para probar?",
    r: `No. Tienes ${DIAS_PRUEBA} días gratis con todas las funciones del plan Pro. Al final eliges un plan o dejas de usarlo; tus datos se quedan guardados.`,
  },
  {
    p: "¿Cómo pago?",
    r: "Con PayPal o con tu tarjeta de débito o crédito (Visa, Mastercard), sin necesidad de tener cuenta PayPal. El cobro es mensual y automático. PayPal cobra en dólares: tu banco hace la conversión a soles.",
  },
  {
    p: "¿Puedo cancelar cuando quiera?",
    r: "Sí, desde la app y sin llamadas. Mantienes el acceso hasta el final del mes que ya pagaste y no se te vuelve a cobrar.",
  },
  {
    p: "¿Funciona en el celular?",
    r: "Está hecho para el celular. Lo abres en el navegador y lo puedes instalar como una app en tu pantalla de inicio, sin descargar nada de la tienda.",
  },
  {
    p: "¿Saca datos de Marketplace, Neoauto u otras páginas?",
    r: "No. FLIPDESK solo usa lo que tú registras: tus autos, tus gastos y tus ventas. No copiamos información de otras páginas.",
  },
  {
    p: "¿Los contratos son válidos legalmente?",
    r: "Son plantillas referenciales que puedes editar, y conviene revisarlas con un abogado. Recuerda que en Perú la transferencia del vehículo se formaliza ante notario e inscribe en SUNARP.",
  },
  {
    p: "¿Mis datos están seguros?",
    r: "Cada cuenta solo ve sus propios datos (lo controla la base de datos, no solo la app). Las fotos y documentos se guardan en almacenamiento privado. No vendemos ni compartimos tu información.",
  },
  {
    p: "Tengo vendedores, ¿pueden usarlo?",
    r: "Sí, con el plan Concesionario sumas hasta 4 vendedores. Ellos registran autos, gastos y ventas; no pueden borrar nada y, si tú quieres, no ven tus precios de compra ni tus ganancias.",
  },
];

function Telefono({ imagen, alt, prioridad = false }: { imagen: typeof capDashboard; alt: string; prioridad?: boolean }) {
  return (
    <div className="rounded-[2rem] bg-slate-900 p-2 shadow-xl ring-1 ring-slate-900/10">
      <Image
        src={imagen}
        alt={alt}
        className="h-auto w-full rounded-[1.5rem]"
        sizes="(min-width: 768px) 260px, 70vw"
        placeholder="blur"
        priority={prioridad}
      />
    </div>
  );
}

export default function Landing() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5">
          <Logo />
          <nav className="flex items-center gap-1" aria-label="Principal">
            <a href="#precios" className="hidden min-h-11 items-center rounded-xl px-3 font-semibold text-slate-600 hover:bg-slate-100 sm:inline-flex">
              Precios
            </a>
            <a href="#preguntas" className="hidden min-h-11 items-center rounded-xl px-3 font-semibold text-slate-600 hover:bg-slate-100 sm:inline-flex">
              Preguntas
            </a>
            <Link href="/login" className="inline-flex min-h-11 items-center rounded-xl px-4 font-semibold text-marca-700 hover:bg-marca-50">
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-marca-50 to-white px-5 pt-10 pb-14">
          <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[1fr_280px]">
            <div className="space-y-5 text-center md:text-left">
              <p className="inline-block rounded-full bg-white px-3 py-1 text-sm font-semibold text-marca-800 ring-1 ring-marca-200">
                Para revendedores de autos usados en Perú 🇵🇪
              </p>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                Descubre cuánto ganas <span className="text-marca-700">de verdad</span> con cada auto
              </h1>
              <p className="text-lg text-slate-600">
                Deja el cuaderno y el Excel. Controla tu stock, tus gastos y tu ganancia real en soles desde el celular.
              </p>
              <div className="flex flex-col items-center gap-3 sm:flex-row md:justify-start">
                <BotonLink href="/registro" tamano="lg" className="w-full sm:w-auto">
                  Probar gratis {DIAS_PRUEBA} días
                </BotonLink>
                <BotonLink href="#como-funciona" variante="secundario" tamano="lg" className="w-full sm:w-auto">
                  Ver cómo funciona
                </BotonLink>
              </div>
              <p className="text-sm text-slate-500">Sin tarjeta para empezar · Cancela cuando quieras</p>
            </div>
            <div className="mx-auto w-60 md:w-full">
              <Telefono imagen={capDashboard} alt="Dashboard de FLIPDESK con la ganancia del mes y los autos en stock" prioridad />
            </div>
          </div>
        </section>

        {/* Problema */}
        <section className="px-5 py-14" aria-labelledby="titulo-problema">
          <div className="mx-auto max-w-3xl space-y-6">
            <h2 id="titulo-problema" className="text-center text-2xl font-bold sm:text-3xl">¿Te suena familiar?</h2>
            <ul className="space-y-3">
              {problemas.map((p) => (
                <li key={p} className="flex gap-3 rounded-2xl bg-red-50 p-4 text-slate-800 ring-1 ring-red-100">
                  <X className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
            <p className="text-center text-lg font-semibold text-slate-700">
              No es que vendas mal: es que sin números claros, la plata se va en detalles.
            </p>
          </div>
        </section>

        {/* Ejemplo en soles */}
        <section className="bg-slate-50 px-5 py-14" aria-labelledby="titulo-ejemplo">
          <div className="mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-2">
            <div className="space-y-3">
              <h2 id="titulo-ejemplo" className="text-2xl font-bold sm:text-3xl">¿Ganaste S/ 6,500… o S/ 5,170?</h2>
              <p className="text-lg text-slate-600">
                Compraste un Yaris en S/ 31,000 y lo vendiste en S/ 37,500. Parece que ganaste S/ 6,500, pero te olvidaste de la pintura, el
                trámite y el lavado. FLIPDESK suma todo por ti.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <dl className="divide-y divide-slate-100 text-base">
                {[
                  ["Precio de compra", "S/ 31,000"],
                  ["Pintura", "S/ 900"],
                  ["Trámite notarial", "S/ 350"],
                  ["Lavado y encerado", "S/ 80"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2">
                    <dt className="text-slate-600">{k}</dt>
                    <dd className="font-semibold">{v}</dd>
                  </div>
                ))}
                <div className="flex justify-between py-2">
                  <dt className="font-semibold">Costo total</dt>
                  <dd className="font-bold text-marca-800">S/ 32,330</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-slate-600">Precio de venta</dt>
                  <dd className="font-semibold">S/ 37,500</dd>
                </div>
                <div className="flex items-baseline justify-between pt-3">
                  <dt className="font-bold">Ganancia real</dt>
                  <dd className="text-2xl font-black text-emerald-700">
                    +S/ 5,170 <span className="text-sm font-semibold text-slate-500">(13.8 %)</span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* Beneficios */}
        <section className="mx-auto max-w-5xl px-5 py-14" aria-labelledby="titulo-beneficios">
          <h2 id="titulo-beneficios" className="mb-8 text-center text-2xl font-bold sm:text-3xl">
            Todo tu negocio de autos en un solo lugar
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {beneficios.map(({ icono: Icono, titulo, texto }) => (
              <li key={titulo} className="space-y-2 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <Icono className="size-8 text-marca-700" aria-hidden />
                <h3 className="text-lg font-bold">{titulo}</h3>
                <p className="text-slate-600">{texto}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Capturas */}
        <section id="como-funciona" className="scroll-mt-16 bg-marca-50 px-5 py-14" aria-labelledby="titulo-capturas">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="text-center">
              <h2 id="titulo-capturas" className="text-2xl font-bold sm:text-3xl">Así se ve en tu celular</h2>
              <p className="text-slate-600">Botones grandes, pocos pasos y todo en soles.</p>
            </div>
            <ul className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
              {capturas.map((c) => (
                <li key={c.titulo} className="w-60 shrink-0 snap-center space-y-3 md:w-auto">
                  <Telefono imagen={c.imagen} alt={`Captura: ${c.titulo}`} />
                  <div className="text-center">
                    <h3 className="font-bold">{c.titulo}</h3>
                    <p className="text-sm text-slate-600">{c.texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Precios */}
        <section id="precios" className="scroll-mt-16 px-5 py-14" aria-labelledby="titulo-precios">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="text-center">
              <h2 id="titulo-precios" className="text-2xl font-bold sm:text-3xl">Precios simples, en soles</h2>
              <p className="text-slate-600">Paga con PayPal o con tu tarjeta de débito o crédito.</p>
            </div>
            <TablaPrecios
              accion={(id) => (
                <BotonLink href="/registro" variante={id === "pro" ? "primario" : "secundario"} className="w-full">
                  Probar gratis {DIAS_PRUEBA} días
                </BotonLink>
              )}
            />
          </div>
        </section>

        {/* Preguntas frecuentes */}
        <section id="preguntas" className="scroll-mt-16 bg-slate-50 px-5 py-14" aria-labelledby="titulo-preguntas">
          <div className="mx-auto max-w-3xl space-y-6">
            <h2 id="titulo-preguntas" className="text-center text-2xl font-bold sm:text-3xl">Preguntas frecuentes</h2>
            <div className="space-y-3">
              {preguntas.map(({ p, r }) => (
                <details key={p} className="group rounded-2xl bg-white ring-1 ring-slate-200">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-semibold">
                    {p}
                    <span aria-hidden className="text-marca-700 transition group-open:rotate-45">＋</span>
                  </summary>
                  <p className="px-5 pb-4 text-slate-600">{r}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="bg-marca-800 px-5 py-14 text-center text-white">
          <div className="mx-auto max-w-xl space-y-4">
            <h2 className="text-2xl font-bold sm:text-3xl">Empieza hoy a ver tu ganancia real</h2>
            <ul className="mx-auto inline-flex flex-col gap-1 text-left text-marca-100">
              {[`${DIAS_PRUEBA} días gratis con todo incluido`, "Sin tarjeta para empezar", "Carga 5 autos de ejemplo y pruébalo en 1 minuto"].map((t) => (
                <li key={t} className="flex gap-2">
                  <Check className="mt-0.5 size-5 shrink-0 text-emerald-300" aria-hidden /> {t}
                </li>
              ))}
            </ul>
            <div>
              <BotonLink href="/registro" tamano="lg" variante="secundario">
                Crear mi cuenta gratis
              </BotonLink>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-5 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} FLIPDESK · Hecho en Lima ·{" "}
        <Link href="/login" className="underline">
          Entrar
        </Link>
      </footer>
    </div>
  );
}
