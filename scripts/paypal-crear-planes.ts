/**
 * Crea en PayPal el producto "FLIPDESK" y los 3 planes mensuales (en US$) e imprime
 * las variables PAYPAL_PLAN_* para tu .env / Vercel.
 *
 *   npx tsx scripts/paypal-crear-planes.ts
 *
 * Requiere PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET y PAYPAL_ENTORNO (sandbox | live) en .env.local.
 * Ejecútalo una vez por entorno (sandbox para pruebas, live para producción).
 */
import { config } from "dotenv";
import { INFO_PLANES, PLANES } from "../lib/planes";

config({ path: ".env.local", quiet: true });

const clientId = process.env.PAYPAL_CLIENT_ID;
const secret = process.env.PAYPAL_CLIENT_SECRET;
const base = process.env.PAYPAL_ENTORNO === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

async function main() {
  if (!clientId || !secret) throw new Error("Faltan PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET en .env.local");
  const tokenResp = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!tokenResp.ok) throw new Error(`No se pudo autenticar con PayPal: ${tokenResp.status}`);
  const { access_token } = (await tokenResp.json()) as { access_token: string };
  const api = async (ruta: string, body: unknown) => {
    const r = await fetch(`${base}${ruta}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`${ruta}: ${r.status} ${await r.text()}`);
    return r.json() as Promise<{ id: string }>;
  };

  const producto = await api("/v1/catalogs/products", {
    name: "FLIPDESK",
    description: "Sistema de gestión para revendedores de autos usados",
    type: "SERVICE",
    category: "SOFTWARE",
  });
  console.log(`Producto creado: ${producto.id}\n`);

  for (const id of PLANES) {
    const p = INFO_PLANES[id];
    const plan = await api("/v1/billing/plans", {
      product_id: producto.id,
      name: `FLIPDESK ${p.nombre}`,
      description: `Plan ${p.nombre} mensual (S/ ${p.precioSoles} referencial)`,
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: { interval_unit: "MONTH", interval_count: 1 },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: { fixed_price: { value: p.precioUsd.toFixed(2), currency_code: "USD" } },
        },
      ],
      payment_preferences: { auto_bill_outstanding: true, payment_failure_threshold: 2 },
    });
    console.log(`PAYPAL_PLAN_${id.toUpperCase()}=${plan.id}`);
  }
  console.log("\nCopia estas líneas a .env.local y a las variables de entorno de Vercel.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
