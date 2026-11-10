/** Contrato común para generar anuncios (plantillas hoy, IA mañana). */

export type Plataforma = "marketplace" | "neoauto" | "tiktok";

export const PLATAFORMAS: { id: Plataforma; nombre: string }[] = [
  { id: "marketplace", nombre: "Marketplace" },
  { id: "neoauto", nombre: "Neoauto" },
  { id: "tiktok", nombre: "TikTok" },
];

export type DatosAnuncio = {
  marca: string;
  modelo: string;
  anio: number;
  version?: string | null;
  color?: string | null;
  kilometraje?: number | null;
  transmision?: string | null;
  combustible?: string | null;
  precio?: number | null;
  notas?: string | null;
  soatVigente?: boolean;
  revisionVigente?: boolean;
  tieneTarjeta?: boolean;
  /** Ciudad donde se vende (por defecto Lima). */
  ciudad?: string;
};

export type Anuncio = { plataforma: Plataforma; titulo?: string; texto: string };

export interface GeneradorAnuncios {
  readonly nombre: string;
  generar(datos: DatosAnuncio): Promise<Anuncio[]>;
}
