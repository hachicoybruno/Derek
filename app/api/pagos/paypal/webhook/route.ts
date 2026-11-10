import { configPaypalDesdeEnv, ProveedorPaypal } from "@/lib/pagos/paypal";
import { proveedorPorId } from "@/lib/pagos";
import { procesarEvento } from "@/lib/pagos/servicio";
import { crearClienteAdmin } from "@/lib/supabase/admin";

/**
 * Webhook de PayPal. Configúralo en developer.paypal.com → tu app → Webhooks con la URL
 * https://TU-DOMINIO/api/pagos/paypal/webhook y los eventos BILLING.SUBSCRIPTION.* y PAYMENT.SALE.*
 */
export async function POST(request: Request) {
  const config = configPaypalDesdeEnv();
  if (!config) return Response.json({ error: "PayPal no configurado" }, { status: 503 });

  const cuerpo = await request.text();
  const paypal = new ProveedorPaypal(config);
  let resultado;
  try {
    resultado = await paypal.verificarWebhook(request.headers, cuerpo);
  } catch (e) {
    console.error("[webhook paypal] error al verificar:", e);
    return Response.json({ error: "No se pudo verificar" }, { status: 500 });
  }
  if (!resultado.valido) return Response.json({ error: "Firma inválida" }, { status: 400 });
  if (!resultado.evento) return Response.json({ ok: true, ignorado: true });

  try {
    const r = await procesarEvento(
      { db: crearClienteAdmin(), proveedor: (id) => (id === "paypal" ? paypal : proveedorPorId(id)) },
      "paypal",
      resultado.evento,
      JSON.parse(cuerpo),
    );
    return Response.json({ ok: true, ...r });
  } catch (e) {
    console.error("[webhook paypal] error al procesar:", e);
    return Response.json({ error: "Error al procesar" }, { status: 500 }); // PayPal reintentará
  }
}
