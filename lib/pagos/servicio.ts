/**
 * Lógica de negocio de suscripciones, independiente del proveedor.
 * Se ejecuta en el servidor con el cliente admin (escribe tablas que el usuario solo puede leer).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/tipos-db";
import type { EventoPago, ProveedorId, ProveedorPagos, SuscripcionExterna } from "./tipos";

type Db = SupabaseClient<Database>;
type Deps = { db: Db; proveedor: (id: ProveedorId) => ProveedorPagos | null };

const esUuid = (v: string | null | undefined): v is string => !!v && /^[0-9a-f-]{36}$/i.test(v);

/**
 * Guarda el estado de una suscripción del proveedor en la cuenta del usuario.
 * - Ignora eventos de una suscripción vieja (p. ej. la que se cancela al cambiar de plan).
 * - Al activar una suscripción nueva, cancela la anterior en el proveedor (cambio de plan).
 */
export async function aplicarSuscripcion(deps: Deps, usuarioId: string, ext: SuscripcionExterna) {
  if (ext.estado === "pendiente") return { aplicado: false, motivo: "pendiente" as const };

  const { data: actual } = await deps.db.from("suscripciones").select("*").eq("user_id", usuarioId).maybeSingle();
  const esOtra = actual?.proveedor_suscripcion_id && actual.proveedor_suscripcion_id !== ext.id;

  if (esOtra && ext.estado !== "activa") return { aplicado: false, motivo: "suscripcion_anterior" as const };

  if (esOtra && actual?.estado === "activa" && actual.proveedor) {
    const anterior = deps.proveedor(actual.proveedor as ProveedorId);
    await anterior?.cancelar(actual.proveedor_suscripcion_id!, "Cambio de plan en FLIPDESK").catch((e) => {
      console.error("[pagos] No se pudo cancelar la suscripción anterior:", e);
    });
  }

  const { error } = await deps.db.from("suscripciones").upsert(
    {
      user_id: usuarioId,
      plan: ext.plan ?? actual?.plan ?? "basico",
      estado: ext.estado,
      proveedor: ext.proveedor,
      proveedor_suscripcion_id: ext.id,
      periodo_hasta: ext.periodoHasta ?? (esOtra ? null : (actual?.periodo_hasta ?? null)),
      prueba_hasta: actual?.prueba_hasta ?? null,
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(`No se pudo guardar la suscripción: ${error.message}`);
  return { aplicado: true as const };
}

async function usuarioDeSuscripcion(db: Db, suscripcionId: string | null) {
  if (!suscripcionId) return null;
  const { data } = await db.from("suscripciones").select("user_id").eq("proveedor_suscripcion_id", suscripcionId).maybeSingle();
  return data?.user_id ?? null;
}

/** Procesa un webhook ya verificado. Idempotente: un evento repetido se ignora. */
export async function procesarEvento(deps: Deps, proveedorId: ProveedorId, evento: EventoPago, payload: unknown) {
  const idEvento = `${proveedorId}:${evento.id}`;
  const { error: errorDuplicado } = await deps.db
    .from("eventos_pago")
    .insert({ id: idEvento, proveedor: proveedorId, tipo: evento.tipo, payload: payload as never });
  if (errorDuplicado) {
    if (errorDuplicado.code === "23505") return { resultado: "duplicado" as const };
    throw new Error(errorDuplicado.message);
  }

  try {
    const proveedor = deps.proveedor(proveedorId);
    if (!proveedor) throw new Error(`Proveedor ${proveedorId} no configurado`);

    if (evento.tipo === "suscripcion") {
      // Siempre se consulta el estado actual al proveedor (el webhook puede llegar desordenado).
      const ext = await proveedor.obtenerSuscripcion(evento.suscripcionId);
      const usuarioId = [ext.usuarioId, evento.usuarioId].find(esUuid) ?? (await usuarioDeSuscripcion(deps.db, ext.id));
      if (!usuarioId) return { resultado: "sin_usuario" as const };
      await aplicarSuscripcion(deps, usuarioId, ext);
      return { resultado: "ok" as const };
    }

    // Pagos
    const usuarioId = (esUuid(evento.usuarioId) ? evento.usuarioId : null) ?? (await usuarioDeSuscripcion(deps.db, evento.suscripcionId));
    if (evento.estado === "reembolsado") {
      await deps.db.from("pagos").update({ estado: "reembolsado" }).eq("proveedor", proveedorId).eq("proveedor_pago_id", evento.pagoId);
      return { resultado: "ok" as const };
    }
    if (!usuarioId) return { resultado: "sin_usuario" as const };

    let plan: string | null = null;
    if (evento.suscripcionId) {
      const ext = await proveedor.obtenerSuscripcion(evento.suscripcionId);
      plan = ext.plan;
      if (evento.estado === "completado") await aplicarSuscripcion(deps, usuarioId, ext); // renueva periodo_hasta
    }
    const { error } = await deps.db.from("pagos").upsert(
      {
        user_id: usuarioId,
        proveedor: proveedorId,
        proveedor_pago_id: evento.pagoId,
        proveedor_suscripcion_id: evento.suscripcionId,
        plan,
        monto: evento.monto,
        moneda: evento.moneda,
        estado: evento.estado,
      },
      { onConflict: "proveedor,proveedor_pago_id" },
    );
    if (error) throw new Error(error.message);
    return { resultado: "ok" as const };
  } catch (e) {
    // Se borra la marca para que el reintento del proveedor vuelva a procesarlo.
    await deps.db.from("eventos_pago").delete().eq("id", idEvento);
    throw e;
  }
}
