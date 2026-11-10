import { z } from "zod";
import { esFechaISO } from "./fechas";
import { normalizarPlaca, parsearMonto } from "./formato";

/** Convierte "" en undefined para que los campos opcionales funcionen con formularios. */
const vacioAUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

export const textoOpcional = (max = 120) =>
  z.preprocess(vacioAUndefined, z.string().trim().max(max, `Máximo ${max} caracteres.`).optional());

export const textoRequerido = (mensaje: string, max = 60) =>
  z.preprocess(
    (v) => (typeof v === "string" ? v : ""),
    z.string().trim().min(1, mensaje).max(max, `Máximo ${max} caracteres.`),
  );

export const montoOpcional = z.preprocess(
  (v) => (vacioAUndefined(v) === undefined ? undefined : (parsearMonto(String(v)) ?? Number.NaN)),
  z.number({ error: "Ingresa un monto válido (ej. 25000)." }).min(0, "El monto no puede ser negativo.").max(99_999_999, "Monto demasiado alto.").optional(),
);

export const montoPositivo = z.preprocess(
  (v) => (vacioAUndefined(v) === undefined ? undefined : (parsearMonto(String(v)) ?? Number.NaN)),
  z.number({ error: "Ingresa un monto válido (ej. 350)." }).positive("El monto debe ser mayor a 0.").max(99_999_999, "Monto demasiado alto."),
);

export const fechaOpcional = z.preprocess(
  vacioAUndefined,
  z.string().refine(esFechaISO, "Fecha inválida.").optional(),
);

export const enteroOpcional = (min: number, max: number, mensaje: string) =>
  z.preprocess(
    (v) => (vacioAUndefined(v) === undefined ? undefined : Number(String(v).replace(/[\s,.]/g, ""))),
    z.number({ error: mensaje }).int(mensaje).min(min, mensaje).max(max, mensaje).optional(),
  );

export const placa = z.preprocess(
  (v) => normalizarPlaca(typeof v === "string" ? v : ""),
  z.string().min(1, "Ingresa la placa.").regex(/^[A-Z0-9]{5,8}$/, "Placa inválida (ej. ABC-123)."),
);

export const opcionDe = <T extends readonly [string, ...string[]]>(valores: T) =>
  z.preprocess(vacioAUndefined, z.enum(valores).optional());

export type ErroresCampo = Record<string, string>;

/** Primer error por campo, listo para mostrar en el formulario. */
export function erroresPorCampo(error: z.ZodError): ErroresCampo {
  const errores: ErroresCampo = {};
  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? "_");
    errores[campo] ??= issue.message;
  }
  return errores;
}

export function valoresDe(formData: FormData): Record<string, string> {
  const valores: Record<string, string> = {};
  formData.forEach((v, k) => {
    if (typeof v === "string" && !k.startsWith("$")) valores[k] = v;
  });
  return valores;
}

export function esUUID(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}
