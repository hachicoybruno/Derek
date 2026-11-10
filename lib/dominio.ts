/** Catálogos y etiquetas en español. */

export const ESTADOS = ["en_evaluacion", "en_stock", "reservado", "vendido"] as const;
export type Estado = (typeof ESTADOS)[number];

export const ETIQUETA_ESTADO: Record<Estado, string> = {
  en_evaluacion: "En evaluación",
  en_stock: "En stock",
  reservado: "Reservado",
  vendido: "Vendido",
};

export const COLOR_ESTADO: Record<Estado, string> = {
  en_evaluacion: "bg-slate-100 text-slate-700 ring-slate-300",
  en_stock: "bg-marca-50 text-marca-800 ring-marca-200",
  reservado: "bg-amber-50 text-amber-800 ring-amber-300",
  vendido: "bg-emerald-50 text-emerald-800 ring-emerald-300",
};

export const CATEGORIAS_GASTO = ["reparacion", "pintura", "tramite", "transporte", "lavado", "comision", "otro"] as const;
export type CategoriaGasto = (typeof CATEGORIAS_GASTO)[number];

export const ETIQUETA_CATEGORIA: Record<CategoriaGasto, string> = {
  reparacion: "Reparación",
  pintura: "Pintura",
  tramite: "Trámite",
  transporte: "Grúa / transporte",
  lavado: "Lavado",
  comision: "Comisión",
  otro: "Otro",
};

export const TIPOS_DOCUMENTO = ["soat", "revision_tecnica", "tarjeta_propiedad", "otro"] as const;
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

export const ETIQUETA_DOCUMENTO: Record<TipoDocumento, string> = {
  soat: "SOAT",
  revision_tecnica: "Revisión técnica",
  tarjeta_propiedad: "Tarjeta de propiedad",
  otro: "Otro",
};

/** Documentos que vencen y generan alertas. */
export const DOCUMENTOS_CON_VENCIMIENTO: TipoDocumento[] = ["soat", "revision_tecnica"];

export const TRANSMISIONES = ["mecanica", "automatica"] as const;
export const ETIQUETA_TRANSMISION: Record<(typeof TRANSMISIONES)[number], string> = {
  mecanica: "Mecánica",
  automatica: "Automática",
};

export const COMBUSTIBLES = ["gasolina", "diesel", "glp", "gnv", "hibrido", "electrico"] as const;
export const ETIQUETA_COMBUSTIBLE: Record<(typeof COMBUSTIBLES)[number], string> = {
  gasolina: "Gasolina",
  diesel: "Diésel",
  glp: "GLP",
  gnv: "GNV",
  hibrido: "Híbrido",
  electrico: "Eléctrico",
};

/** Marcas más comunes en el mercado de usados en Perú (sugerencias del formulario). */
export const MARCAS_COMUNES = [
  "Toyota", "Hyundai", "Kia", "Nissan", "Chevrolet", "Suzuki", "Mitsubishi", "Mazda", "Volkswagen",
  "Honda", "Renault", "Ford", "Changan", "JAC", "Great Wall", "Haval", "Geely", "Peugeot", "Subaru", "BMW",
  "Mercedes-Benz", "Audi", "Jeep", "Chery", "DFSK", "MG",
];

export function esEstado(v: unknown): v is Estado {
  return typeof v === "string" && (ESTADOS as readonly string[]).includes(v);
}
