"use client";
import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";
import { Boton } from "./ui";

export function BotonEnviar({
  children,
  textoCargando = "Guardando…",
  ...props
}: ComponentProps<typeof Boton> & { textoCargando?: string }) {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" disabled={pending || props.disabled} aria-busy={pending} {...props}>
      {pending ? textoCargando : children}
    </Boton>
  );
}
