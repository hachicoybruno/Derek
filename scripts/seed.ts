/**
 * Crea (o reutiliza) el usuario demo y le carga 5 autos de ejemplo.
 *   npm run seed
 * Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY en .env.local.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/tipos-db";
import { insertarDatosEjemplo } from "../lib/datos-ejemplo";
import { hoyLima } from "../lib/fechas";

config({ path: ".env.local", quiet: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secreta = process.env.SUPABASE_SECRET_KEY;
const email = process.env.SEED_EMAIL ?? "demo@flipdesk.pe";
const password = process.env.SEED_PASSWORD ?? "demo12345";

async function main() {
  if (!url || !secreta) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local");
  const admin = createClient<Database>(url, secreta, { auth: { persistSession: false, autoRefreshToken: false } });

  let userId: string | undefined;
  const creado = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: "Demo" } });
  if (creado.data.user) {
    userId = creado.data.user.id;
    console.log(`Usuario demo creado: ${email}`);
  } else {
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    userId = data.users.find((u) => u.email === email)?.id;
    if (!userId) throw new Error(`No se pudo crear ni encontrar ${email}: ${creado.error?.message}`);
    console.log(`Usuario demo ya existía: ${email}`);
  }

  const r = await insertarDatosEjemplo(admin, userId, hoyLima());
  if ("error" in r && r.error) console.log(r.error);
  else console.log("5 autos de ejemplo cargados.");
  console.log(`Inicia sesión con ${email} / ${password}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
