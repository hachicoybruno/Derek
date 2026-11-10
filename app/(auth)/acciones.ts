"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/supabase/env";
import { rutaSegura } from "@/lib/auth";

export type EstadoAuth = { error?: string; mensaje?: string; email?: string };

const credenciales = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Ingresa un correo válido.")),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

function traducirError(mensaje: string) {
  if (/invalid login credentials/i.test(mensaje)) return "Correo o contraseña incorrectos.";
  if (/email not confirmed/i.test(mensaje)) return "Confirma tu correo antes de entrar. Revisa tu bandeja de entrada.";
  if (/already registered|already exists/i.test(mensaje)) return "Ese correo ya tiene una cuenta. Inicia sesión.";
  if (/rate limit|too many/i.test(mensaje)) return "Demasiados intentos. Espera un momento y vuelve a intentar.";
  if (/password/i.test(mensaje)) return "La contraseña no cumple los requisitos (mínimo 8 caracteres).";
  return "No se pudo completar. Intenta de nuevo.";
}

export async function iniciarSesion(_: EstadoAuth, formData: FormData): Promise<EstadoAuth> {
  const email = String(formData.get("email") ?? "");
  const datos = credenciales.safeParse({ email, password: formData.get("password") });
  if (!datos.success) return { error: datos.error.issues[0].message, email };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword(datos.data);
  if (error) return { error: traducirError(error.message), email };

  redirect(rutaSegura(String(formData.get("siguiente") ?? "")));
}

export async function registrarse(_: EstadoAuth, formData: FormData): Promise<EstadoAuth> {
  const email = String(formData.get("email") ?? "");
  const datos = credenciales.safeParse({ email, password: formData.get("password") });
  if (!datos.success) return { error: datos.error.issues[0].message, email };
  const nombre = String(formData.get("nombre") ?? "").trim().slice(0, 80);

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.signUp({
    ...datos.data,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback`,
      data: nombre ? { full_name: nombre } : undefined,
    },
  });
  if (error) return { error: traducirError(error.message), email };

  // Si el proyecto exige confirmar el correo, no hay sesión todavía.
  if (!data.session) {
    return { mensaje: `Te enviamos un correo a ${datos.data.email}. Abre el enlace para activar tu cuenta.`, email };
  }
  redirect("/dashboard");
}

export async function entrarConGoogle(formData: FormData) {
  const supabase = await crearClienteServidor();
  const siguiente = rutaSegura(String(formData.get("siguiente") ?? ""));
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${siteUrl()}/auth/callback?siguiente=${encodeURIComponent(siguiente)}` },
  });
  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}
