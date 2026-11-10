"use server";
import { revalidatePath } from "next/cache";
import { requerirUsuario } from "@/lib/auth";
import { proveedorActivo, proveedorPorId, type ProveedorId } from "@/lib/pagos";
import { aplicarSuscripcion } from "@/lib/pagos/servicio";
import { esPlan } from "@/lib/planes";
import { crearClienteAdmin } from "@/lib/supabase/admin";

const deps = () => ({ db: crearClienteAdmin(), proveedor: (id: ProveedorId) => proveedorPorId(id) });

/**
 * Se llama cuando el usuario aprueba el pago en PayPal (o en el simulador).
 * No se confía en el navegador: se consulta la suscripción al proveedor y se valida que sea de este usuario.
 */
export async function confirmarSuscripcion(suscripcionId: string, planEsperado: string): Promise<{ ok?: boolean; error?: string }> {
  const { userId } = await requerirUsuario();
  const proveedor = proveedorActivo();
  if (!proveedor) return { error: "Los pagos no están configurados." };
  if (!esPlan(planEsperado)) return { error: "Plan no válido." };

  try {
    const ext = await proveedor.obtenerSuscripcion(suscripcionId);
    if (ext.usuarioId !== userId) return { error: "La suscripción no corresponde a tu cuenta." };
    if (!ext.plan) return { error: "El plan pagado no coincide con ningún plan de FLIPDESK. Escríbenos para revisarlo." };
    if (ext.estado !== "activa") return { error: "PayPal aún no confirma el pago. Recarga en unos minutos." };
    await aplicarSuscripcion(deps(), userId, ext);
  } catch (e) {
    console.error("[pagos] confirmar:", e);
    return { error: "No pudimos confirmar el pago con el proveedor. Si se te cobró, se activará en unos minutos." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function cancelarSuscripcion(): Promise<{ ok?: boolean; error?: string }> {
  const { supabase, userId } = await requerirUsuario();
  const { data: s } = await supabase.from("suscripciones").select("*").maybeSingle();
  if (!s?.proveedor_suscripcion_id || s.estado !== "activa") return { error: "No tienes una suscripción activa." };
  const proveedor = proveedorPorId(s.proveedor);
  if (!proveedor) return { error: "No se pudo contactar al proveedor de pagos." };

  try {
    await proveedor.cancelar(s.proveedor_suscripcion_id, "Cancelada por el usuario desde FLIPDESK");
    const { error } = await crearClienteAdmin()
      .from("suscripciones")
      .update({ estado: "cancelada" })
      .eq("user_id", userId)
      .eq("proveedor_suscripcion_id", s.proveedor_suscripcion_id);
    if (error) throw error;
  } catch (e) {
    console.error("[pagos] cancelar:", e);
    return { error: "No se pudo cancelar. Intenta de nuevo o cancélala desde tu cuenta de PayPal." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
