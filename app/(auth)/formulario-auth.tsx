"use client";
import Link from "next/link";
import { useActionState } from "react";
import { BotonEnviar } from "@/components/boton-enviar";
import { Aviso, Campo, Entrada } from "@/components/ui";
import { iniciarSesion, registrarse, type EstadoAuth } from "./acciones";

export function FormularioAuth({ modo, siguiente }: { modo: "login" | "registro"; siguiente?: string }) {
  const [estado, accion] = useActionState<EstadoAuth, FormData>(
    modo === "login" ? iniciarSesion : registrarse,
    {},
  );

  if (estado.mensaje) {
    return (
      <Aviso tipo="exito">
        <p className="font-semibold">¡Cuenta creada!</p>
        <p>{estado.mensaje}</p>
      </Aviso>
    );
  }

  return (
    <form action={accion} className="space-y-4" noValidate>
      {siguiente && <input type="hidden" name="siguiente" value={siguiente} />}
      {modo === "registro" && (
        <Campo etiqueta="Tu nombre (opcional)">
          <Entrada name="nombre" autoComplete="name" placeholder="Ej. Andree Ramos" />
        </Campo>
      )}
      <Campo etiqueta="Correo">
        <Entrada
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          defaultValue={estado.email}
          placeholder="tucorreo@gmail.com"
        />
      </Campo>
      <Campo etiqueta="Contraseña" ayuda={modo === "registro" ? "Mínimo 8 caracteres." : undefined}>
        <Entrada
          name="password"
          type="password"
          autoComplete={modo === "login" ? "current-password" : "new-password"}
          required
          minLength={8}
        />
      </Campo>
      {estado.error && <Aviso tipo="error">{estado.error}</Aviso>}
      <BotonEnviar tamano="lg" className="w-full" textoCargando={modo === "login" ? "Entrando…" : "Creando cuenta…"}>
        {modo === "login" ? "Entrar" : "Crear cuenta gratis"}
      </BotonEnviar>
      <p className="text-center text-slate-600">
        {modo === "login" ? (
          <>
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="font-semibold text-marca-700 underline">
              Regístrate
            </Link>
          </>
        ) : (
          <>
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-semibold text-marca-700 underline">
              Inicia sesión
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
