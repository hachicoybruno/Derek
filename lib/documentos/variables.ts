/** Arma las variables de una plantilla a partir de los datos del auto, las personas y el formulario. */
import { ETIQUETA_COMBUSTIBLE, ETIQUETA_TRANSMISION } from "../dominio";
import { fecha, fechaLargaSegura, formatoPlaca, numero } from "./formatos";
import { montoEnLetras } from "./letras";
import type { Variables } from "./motor";
import type { TipoPlantilla } from "./plantillas-base";

export type Persona = { nombre?: string | null; dni?: string | null; direccion?: string | null; telefono?: string | null };

export type AutoDocumento = {
  placa: string;
  marca: string;
  modelo: string;
  version?: string | null;
  anio: number;
  color?: string | null;
  numero_serie?: string | null;
  numero_motor?: string | null;
  kilometraje?: number | null;
  transmision?: string | null;
  combustible?: string | null;
};

export type ParametrosDocumento = {
  monto?: number | null;
  fecha?: string | null;
  formaPago?: string | null;
  concepto?: string | null;
  numero?: string | null;
  hora?: string | null;
  kilometraje?: number | null;
  observaciones?: string | null;
};

export const FORMAS_PAGO = ["efectivo", "transferencia bancaria", "depósito en cuenta", "Yape / Plin", "cheque de gerencia"];

const solesDoc = (n: number) =>
  `S/ ${new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`;

export function construirVariables(
  tipo: TipoPlantilla,
  datos: { auto: AutoDocumento; vendedor: Persona; comprador: Persona; ciudad: string; hoy: string; params: ParametrosDocumento },
): Variables {
  const { auto, vendedor, comprador, ciudad, hoy, params } = datos;
  const km = (v?: number | null) => (v === null || v === undefined ? null : `${numero(v)} km`);
  const v: Variables = {
    "vendedor.nombre": vendedor.nombre,
    "vendedor.dni": vendedor.dni,
    "vendedor.direccion": vendedor.direccion,
    "vendedor.telefono": vendedor.telefono,
    "comprador.nombre": comprador.nombre,
    "comprador.dni": comprador.dni,
    "comprador.direccion": comprador.direccion,
    "comprador.telefono": comprador.telefono,
    "auto.placa": formatoPlaca(auto.placa),
    "auto.marca": auto.marca,
    "auto.modelo": auto.modelo,
    "auto.version": auto.version,
    "auto.anio": String(auto.anio),
    "auto.color": auto.color,
    "auto.serie": auto.numero_serie,
    "auto.motor": auto.numero_motor,
    "auto.kilometraje": km(auto.kilometraje),
    "auto.transmision": auto.transmision ? ETIQUETA_TRANSMISION[auto.transmision as keyof typeof ETIQUETA_TRANSMISION] : null,
    "auto.combustible": auto.combustible ? ETIQUETA_COMBUSTIBLE[auto.combustible as keyof typeof ETIQUETA_COMBUSTIBLE] : null,
    ciudad,
    hoy: fecha(hoy),
    hoy_largo: fechaLargaSegura(hoy),
  };

  const monto = params.monto ?? null;
  const f = params.fecha ?? hoy;
  if (tipo === "contrato") {
    Object.assign(v, {
      "venta.precio": monto !== null ? solesDoc(monto) : null,
      "venta.precio_letras": monto !== null ? montoEnLetras(monto) : null,
      "venta.fecha": fecha(f),
      "venta.fecha_larga": fechaLargaSegura(f),
      "venta.forma_pago": params.formaPago,
    });
  } else if (tipo === "recibo") {
    Object.assign(v, {
      "recibo.numero": params.numero ?? `${f.replaceAll("-", "")}-${auto.placa}`,
      "recibo.monto": monto !== null ? solesDoc(monto) : null,
      "recibo.monto_letras": monto !== null ? montoEnLetras(monto) : null,
      "recibo.concepto": params.concepto,
      "recibo.forma_pago": params.formaPago,
      "recibo.fecha": fecha(f),
      "recibo.fecha_larga": fechaLargaSegura(f),
    });
  } else {
    Object.assign(v, {
      "entrega.fecha": fecha(f),
      "entrega.fecha_larga": fechaLargaSegura(f),
      "entrega.hora": params.hora,
      "entrega.kilometraje": km(params.kilometraje ?? auto.kilometraje),
      "entrega.observaciones": params.observaciones?.trim() || "Ninguna.",
    });
  }
  return v;
}

/** Datos ficticios para la vista previa del editor de plantillas. */
export const EJEMPLO_VISTA_PREVIA = {
  auto: {
    placa: "ABC123", marca: "Toyota", modelo: "Yaris", version: "GLI", anio: 2018, color: "Plata",
    numero_serie: "9BRBA3HE5J0123456", numero_motor: "2NZ1234567", kilometraje: 78000, transmision: "mecanica", combustible: "gasolina",
  } satisfies AutoDocumento,
  vendedor: { nombre: "Juan Pérez Quispe", dni: "40123456", direccion: "Av. Arequipa 1234, Lince", telefono: "999 111 222" },
  comprador: { nombre: "María López Torres", dni: "45678901", direccion: "Jr. Las Flores 567, San Juan de Lurigancho", telefono: "988 333 444" },
  params: {
    monto: 37500, formaPago: "transferencia bancaria", concepto: "pago total por la compra del vehículo", hora: "15:30",
    observaciones: "Se entrega con lunas polarizadas y alarma.",
  } satisfies ParametrosDocumento,
};
