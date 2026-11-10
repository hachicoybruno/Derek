import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./tipos-db";

/**
 * Cliente con la clave secreta: salta RLS. Úsalo SOLO en el servidor para tareas del sistema
 * (confirmar pagos, webhooks, alertas programadas). Nunca con datos que el usuario no debe tocar.
 */
export function crearClienteAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secreta = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secreta) throw new Error("Falta SUPABASE_SECRET_KEY (necesaria para pagos y alertas).");
  return createClient<Database>(url, secreta, { auth: { persistSession: false, autoRefreshToken: false } });
}
