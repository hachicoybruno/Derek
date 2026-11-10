"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./tipos-db";

let cliente: ReturnType<typeof createBrowserClient<Database>> | undefined;

/** Cliente de Supabase para el navegador (subida de fotos y documentos). */
export function crearClienteNavegador() {
  cliente ??= createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  return cliente;
}
