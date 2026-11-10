import { ETIQUETA_COMBUSTIBLE, ETIQUETA_TRANSMISION } from "../dominio";
import { numero, soles } from "../formato";
import type { Anuncio, DatosAnuncio, GeneradorAnuncios } from "./tipos";

const espacio = (t: string) => t.replace(/ /g, " ");
const precioTexto = (p?: number | null) => (p ? espacio(soles(p, { redondear: true })) : null);
const transmision = (t?: string | null) => (t ? ETIQUETA_TRANSMISION[t as keyof typeof ETIQUETA_TRANSMISION] : null);
const combustible = (c?: string | null) => (c ? ETIQUETA_COMBUSTIBLE[c as keyof typeof ETIQUETA_COMBUSTIBLE] : null);
const hashtag = (t: string) => `#${t.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]/g, "").toLowerCase()}`;
const lineas = (...l: (string | null | false | undefined)[]) => l.filter((x) => x !== null && x !== false && x !== undefined).join("\n");

function nombreAuto(d: DatosAnuncio) {
  return [d.marca, d.modelo, d.version, d.anio].filter(Boolean).join(" ");
}

function papeles(d: DatosAnuncio) {
  const items = [d.soatVigente && "SOAT vigente", d.revisionVigente && "revisión técnica vigente", d.tieneTarjeta && "tarjeta de propiedad"].filter(Boolean) as string[];
  return items.length ? items : null;
}

function marketplace(d: DatosAnuncio): Anuncio {
  const precio = precioTexto(d.precio);
  const docs = papeles(d);
  const titulo = `${nombreAuto(d)}${precio ? ` — ${precio}` : ""}`;
  const texto = lineas(
    `🚗 ${titulo}`,
    "",
    d.kilometraje != null && `📍 Kilometraje: ${numero(d.kilometraje)} km`,
    transmision(d.transmision) && `⚙️ Transmisión: ${transmision(d.transmision)}`,
    combustible(d.combustible) && `⛽ Combustible: ${combustible(d.combustible)}`,
    d.color && `🎨 Color: ${d.color}`,
    docs ? `📄 Papeles en regla: ${docs.join(", ")}` : "📄 Papeles en regla",
    "",
    d.notas && `✅ ${d.notas.trim()}`,
    d.notas && "",
    precio ? `💰 Precio: ${precio} (conversable)` : "💰 Precio conversable",
    `📍 ${d.ciudad ?? "Lima"}`,
    "",
    "📲 Escríbeme por interno para más fotos o para coordinar una visita. ¡Se acepta revisión mecánica!",
  );
  return { plataforma: "marketplace", titulo, texto };
}

function neoauto(d: DatosAnuncio): Anuncio {
  const precio = precioTexto(d.precio);
  const docs = papeles(d);
  const titulo = nombreAuto(d);
  const texto = lineas(
    `Vendo ${titulo} en excelente estado.`,
    "",
    "Características:",
    `- Marca: ${d.marca}`,
    `- Modelo: ${d.modelo}${d.version ? ` ${d.version}` : ""}`,
    `- Año: ${d.anio}`,
    d.kilometraje != null && `- Kilometraje: ${numero(d.kilometraje)} km`,
    transmision(d.transmision) && `- Transmisión: ${transmision(d.transmision)}`,
    combustible(d.combustible) && `- Combustible: ${combustible(d.combustible)}`,
    d.color && `- Color: ${d.color}`,
    "",
    d.notas && "Detalles:",
    d.notas && d.notas.trim(),
    d.notas && "",
    docs ? `Documentación: ${docs.join(", ")}. Transferencia inmediata.` : "Documentación en regla. Transferencia inmediata.",
    precio && `Precio: ${precio}. Ligeramente negociable.`,
    `Ubicación: ${d.ciudad ?? "Lima"}. Se puede revisar con su mecánico de confianza.`,
  );
  return { plataforma: "neoauto", titulo, texto };
}

function tiktok(d: DatosAnuncio): Anuncio {
  const precio = precioTexto(d.precio);
  const km = d.kilometraje != null ? `${numero(d.kilometraje)} km` : null;
  const detalles = [km, transmision(d.transmision)?.toLowerCase(), combustible(d.combustible)?.toLowerCase()].filter(Boolean).join(" · ");
  const tags = [hashtag(d.marca), hashtag(`${d.marca}${d.modelo}`), "#autosusados", "#autosenventa", "#lima", "#peru", "#carros"];
  const texto = lineas(
    `${d.marca} ${d.modelo} ${d.anio} ${precio ? `a ${precio}` : "en venta"} 🔥`,
    detalles && `${detalles}`,
    papeles(d) && "Papeles al día ✅",
    "¿Lo quieres? Escríbeme al DM 📩",
    "",
    [...new Set(tags)].join(" "),
  );
  return { plataforma: "tiktok", texto };
}

/** Generador sin costo basado en plantillas fijas. */
export class GeneradorPlantillas implements GeneradorAnuncios {
  readonly nombre = "plantillas";
  async generar(datos: DatosAnuncio): Promise<Anuncio[]> {
    return [marketplace(datos), neoauto(datos), tiktok(datos)];
  }
}
