"use client";
import { useState, useTransition } from "react";
import { Check, Copy, Megaphone } from "lucide-react";
import { Aviso, Boton, cx, Tarjeta } from "@/components/ui";
import { PLATAFORMAS, type Anuncio, type Plataforma } from "@/lib/anuncios/tipos";
import { generarAnuncios } from "./acciones";

export function GeneradorAnuncios({ autoId }: { autoId: string }) {
  const [anuncios, setAnuncios] = useState<Record<Plataforma, string> | null>(null);
  const [activa, setActiva] = useState<Plataforma>("marketplace");
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState<string>();
  const [pendiente, startTransition] = useTransition();

  function generar() {
    setError(undefined);
    startTransition(async () => {
      const r = await generarAnuncios(autoId);
      if (r.error || !r.anuncios) return setError(r.error ?? "No se pudo generar.");
      setAnuncios(
        Object.fromEntries(r.anuncios.map((a: Anuncio) => [a.plataforma, a.titulo && a.plataforma !== "marketplace" ? `${a.titulo}\n\n${a.texto}` : a.texto])) as Record<Plataforma, string>,
      );
    });
  }

  async function copiar() {
    if (!anuncios) return;
    try {
      await navigator.clipboard.writeText(anuncios[activa]);
    } catch {
      // Respaldo para navegadores sin permiso de portapapeles.
      const area = document.getElementById("texto-anuncio") as HTMLTextAreaElement | null;
      area?.select();
      document.execCommand("copy");
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  if (!anuncios) {
    return (
      <div className="space-y-2">
        <Boton variante="secundario" className="w-full" onClick={generar} disabled={pendiente}>
          <Megaphone className="size-5" aria-hidden /> {pendiente ? "Generando…" : "Crear anuncios para Marketplace, Neoauto y TikTok"}
        </Boton>
        {error && <Aviso tipo="error">{error}</Aviso>}
      </div>
    );
  }

  return (
    <Tarjeta className="space-y-3">
      <div role="tablist" aria-label="Plataforma" className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
        {PLATAFORMAS.map((p) => (
          <button
            key={p.id}
            role="tab"
            type="button"
            aria-selected={activa === p.id}
            onClick={() => setActiva(p.id)}
            className={cx("min-h-11 rounded-lg text-sm font-semibold", activa === p.id ? "bg-white text-marca-800 shadow-sm" : "text-slate-600")}
          >
            {p.nombre}
          </button>
        ))}
      </div>
      <label htmlFor="texto-anuncio" className="sr-only">Texto del anuncio (puedes editarlo)</label>
      <textarea
        id="texto-anuncio"
        role="tabpanel"
        value={anuncios[activa]}
        onChange={(e) => setAnuncios({ ...anuncios, [activa]: e.target.value })}
        rows={12}
        className="block w-full rounded-xl border-0 bg-slate-50 p-3 text-[15px] leading-relaxed ring-1 ring-slate-200 focus:ring-2 focus:ring-marca-600 focus:outline-none"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-slate-500">{anuncios[activa].length} caracteres · puedes editarlo</span>
        <Boton onClick={copiar} variante={copiado ? "exito" : "primario"}>
          {copiado ? <Check className="size-5" aria-hidden /> : <Copy className="size-5" aria-hidden />}
          {copiado ? "¡Copiado!" : "Copiar"}
        </Boton>
      </div>
      <button type="button" onClick={generar} className="text-sm font-semibold text-marca-700 underline" disabled={pendiente}>
        Volver a generar con los datos actuales
      </button>
    </Tarjeta>
  );
}
