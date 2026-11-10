/**
 * Plantillas originales de documentos. El usuario puede editarlas (tabla `plantillas`).
 * Son REFERENCIALES: deben revisarse con un abogado.
 */

export const TIPOS_PLANTILLA = ["contrato", "recibo", "entrega"] as const;
export type TipoPlantilla = (typeof TIPOS_PLANTILLA)[number];

export const AVISO_LEGAL = "Plantilla referencial, revisar con un abogado.";

export const INFO_PLANTILLA: Record<TipoPlantilla, { nombre: string; descripcion: string; archivo: string }> = {
  contrato: {
    nombre: "Contrato de compraventa",
    descripcion: "Contrato privado de compraventa del vehículo entre vendedor y comprador.",
    archivo: "contrato-compraventa",
  },
  recibo: {
    nombre: "Recibo",
    descripcion: "Constancia de pago (total, adelanto o separación).",
    archivo: "recibo",
  },
  entrega: {
    nombre: "Constancia de entrega",
    descripcion: "Acta de entrega del vehículo con fecha, hora, kilometraje y lo que se entrega.",
    archivo: "constancia-entrega",
  },
};

export type Variable = { clave: string; descripcion: string };

const COMUNES: Variable[] = [
  { clave: "vendedor.nombre", descripcion: "Nombre del vendedor" },
  { clave: "vendedor.dni", descripcion: "DNI del vendedor" },
  { clave: "vendedor.direccion", descripcion: "Dirección del vendedor" },
  { clave: "vendedor.telefono", descripcion: "Teléfono del vendedor" },
  { clave: "comprador.nombre", descripcion: "Nombre del comprador" },
  { clave: "comprador.dni", descripcion: "DNI del comprador" },
  { clave: "comprador.direccion", descripcion: "Dirección del comprador" },
  { clave: "comprador.telefono", descripcion: "Teléfono del comprador" },
  { clave: "auto.placa", descripcion: "Placa (ABC-123)" },
  { clave: "auto.marca", descripcion: "Marca" },
  { clave: "auto.modelo", descripcion: "Modelo" },
  { clave: "auto.version", descripcion: "Versión" },
  { clave: "auto.anio", descripcion: "Año de fabricación" },
  { clave: "auto.color", descripcion: "Color" },
  { clave: "auto.serie", descripcion: "N° de serie (VIN)" },
  { clave: "auto.motor", descripcion: "N° de motor" },
  { clave: "auto.kilometraje", descripcion: "Kilometraje" },
  { clave: "auto.transmision", descripcion: "Transmisión" },
  { clave: "auto.combustible", descripcion: "Combustible" },
  { clave: "ciudad", descripcion: "Ciudad (de Ajustes)" },
  { clave: "hoy", descripcion: "Fecha de hoy (DD/MM/AAAA)" },
  { clave: "hoy_largo", descripcion: "Fecha de hoy en palabras" },
];

export const VARIABLES: Record<TipoPlantilla, Variable[]> = {
  contrato: [
    ...COMUNES,
    { clave: "venta.precio", descripcion: "Precio (S/ 37,500.00)" },
    { clave: "venta.precio_letras", descripcion: "Precio en letras" },
    { clave: "venta.fecha", descripcion: "Fecha de venta (DD/MM/AAAA)" },
    { clave: "venta.fecha_larga", descripcion: "Fecha de venta en palabras" },
    { clave: "venta.forma_pago", descripcion: "Forma de pago" },
  ],
  recibo: [
    ...COMUNES,
    { clave: "recibo.numero", descripcion: "Número de recibo" },
    { clave: "recibo.monto", descripcion: "Monto (S/ 500.00)" },
    { clave: "recibo.monto_letras", descripcion: "Monto en letras" },
    { clave: "recibo.concepto", descripcion: "Concepto del pago" },
    { clave: "recibo.forma_pago", descripcion: "Forma de pago" },
    { clave: "recibo.fecha", descripcion: "Fecha (DD/MM/AAAA)" },
    { clave: "recibo.fecha_larga", descripcion: "Fecha en palabras" },
  ],
  entrega: [
    ...COMUNES,
    { clave: "entrega.fecha", descripcion: "Fecha de entrega (DD/MM/AAAA)" },
    { clave: "entrega.fecha_larga", descripcion: "Fecha de entrega en palabras" },
    { clave: "entrega.hora", descripcion: "Hora de entrega" },
    { clave: "entrega.kilometraje", descripcion: "Kilometraje al entregar" },
    { clave: "entrega.observaciones", descripcion: "Observaciones" },
  ],
};

export const PLANTILLAS_BASE: Record<TipoPlantilla, string> = {
  contrato: `# CONTRATO PRIVADO DE COMPRAVENTA DE VEHÍCULO USADO

Conste por el presente documento el contrato de compraventa de vehículo que celebran, de una parte, {{vendedor.nombre}}, identificado(a) con DNI N° {{vendedor.dni}}, con domicilio en {{vendedor.direccion}}, a quien en adelante se denominará EL VENDEDOR; y de la otra parte, {{comprador.nombre}}, identificado(a) con DNI N° {{comprador.dni}}, con domicilio en {{comprador.direccion}}, a quien en adelante se denominará EL COMPRADOR; en los términos y condiciones siguientes:

## PRIMERA: DEL VEHÍCULO
EL VENDEDOR declara ser propietario, o estar debidamente autorizado por el propietario, del vehículo de placa de rodaje {{auto.placa}}, con las siguientes características: marca {{auto.marca}}, modelo {{auto.modelo}}, año de fabricación {{auto.anio}}, color {{auto.color}}, número de serie (VIN) {{auto.serie}}, número de motor {{auto.motor}}, con un kilometraje de {{auto.kilometraje}}.

## SEGUNDA: DEL OBJETO
Por el presente contrato, EL VENDEDOR transfiere en venta real y definitiva a favor de EL COMPRADOR el vehículo descrito en la cláusula primera, incluyendo sus partes integrantes y accesorios.

## TERCERA: DEL PRECIO Y LA FORMA DE PAGO
El precio de venta pactado por las partes asciende a {{venta.precio}} ({{venta.precio_letras}}), que EL COMPRADOR paga mediante {{venta.forma_pago}}. EL VENDEDOR declara recibir dicho monto a su entera satisfacción, sirviendo el presente documento como constancia de pago.

## CUARTA: DEL ESTADO DEL VEHÍCULO
EL COMPRADOR declara haber revisado el vehículo, conocer su estado de conservación y funcionamiento, y recibirlo en el estado en que se encuentra, a su entera satisfacción.

## QUINTA: DE LAS CARGAS Y GRAVÁMENES
EL VENDEDOR declara que el vehículo se encuentra libre de cargas, gravámenes, embargos, medidas judiciales o extrajudiciales, y que las papeletas o multas generadas hasta la fecha de entrega son de su exclusiva responsabilidad.

## SEXTA: DE LA TRANSFERENCIA VEHICULAR
Las partes se obligan a suscribir el Acta de Transferencia Vehicular ante notario público y a gestionar su inscripción en los Registros Públicos (SUNARP). Los gastos notariales y registrales serán asumidos por EL COMPRADOR, salvo pacto distinto.

## SÉPTIMA: DE LA RESPONSABILIDAD
A partir de la fecha de entrega, EL COMPRADOR asume toda responsabilidad civil, administrativa y penal derivada del uso del vehículo.

## OCTAVA: DE LA JURISDICCIÓN
Para cualquier controversia derivada del presente contrato, las partes se someten a la competencia de los jueces y tribunales de {{ciudad}}.

En señal de conformidad, las partes firman el presente documento en {{ciudad}}, el {{venta.fecha_larga}}.

[[FIRMAS]]
`,

  recibo: `# RECIBO DE PAGO

N° {{recibo.numero}}

Recibí de {{comprador.nombre}}, identificado(a) con DNI N° {{comprador.dni}}, la suma de {{recibo.monto}} ({{recibo.monto_letras}}), por concepto de {{recibo.concepto}}.

## DATOS DEL VEHÍCULO
- Placa: {{auto.placa}}
- Marca y modelo: {{auto.marca}} {{auto.modelo}}
- Año: {{auto.anio}}
- Color: {{auto.color}}

Forma de pago: {{recibo.forma_pago}}.

{{ciudad}}, {{recibo.fecha_larga}}.

[[FIRMA_VENDEDOR]]
`,

  entrega: `# CONSTANCIA DE ENTREGA DE VEHÍCULO

Por medio del presente documento, {{vendedor.nombre}}, identificado(a) con DNI N° {{vendedor.dni}}, hace entrega a {{comprador.nombre}}, identificado(a) con DNI N° {{comprador.dni}}, del vehículo de placa {{auto.placa}}, marca {{auto.marca}}, modelo {{auto.modelo}}, año {{auto.anio}}, color {{auto.color}}, número de serie {{auto.serie}}, el día {{entrega.fecha_larga}} a las {{entrega.hora}} horas, con un kilometraje de {{entrega.kilometraje}}.

## SE ENTREGA JUNTO CON EL VEHÍCULO
- Tarjeta de identificación vehicular (tarjeta de propiedad)
- SOAT vigente
- Llaves: ____ juego(s)
- Llanta de repuesto, gata y llave de ruedas

## OBSERVACIONES
{{entrega.observaciones}}

EL COMPRADOR declara recibir el vehículo a su entera satisfacción y asume, desde la fecha y hora indicadas, la responsabilidad por su uso, así como por las papeletas, multas y daños que se generen en adelante.

Firmado en {{ciudad}}, el {{entrega.fecha_larga}}.

[[FIRMAS]]
`,
};

export function esTipoPlantilla(v: unknown): v is TipoPlantilla {
  return typeof v === "string" && (TIPOS_PLANTILLA as readonly string[]).includes(v);
}
