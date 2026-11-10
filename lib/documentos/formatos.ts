export { fecha, formatoPlaca, numero } from "../formato";
import { fechaLarga } from "../fechas";

export function fechaLargaSegura(iso: string | null | undefined) {
  return fechaLarga(iso) || null;
}
