/**
 * WhatsApp Business Cloud API (Meta). Los mensajes iniciados por el negocio requieren una
 * PLANTILLA aprobada en Meta con un parámetro de cuerpo {{1}}. Ejemplo de cuerpo:
 *   "Hola, FLIPDESK te avisa: {{1}}. Revisa tus vencimientos en la app."
 *
 * Variables: WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_PLANTILLA (nombre),
 * WHATSAPP_IDIOMA (código de idioma de la plantilla, p. ej. "es" o "es_PE").
 */
export interface EnviadorWhatsapp {
  readonly nombre: string;
  enviarAlerta(numeroE164: string, resumen: string): Promise<void>;
}

/** Los parámetros de plantilla no admiten saltos de línea, tabs ni más de 4 espacios seguidos. */
export function limpiarParametro(texto: string, max = 900) {
  const limpio = texto.replace(/[\n\r\t]+/g, " · ").replace(/ {2,}/g, " ").trim();
  return limpio.length > max ? `${limpio.slice(0, max - 1)}…` : limpio;
}

export class WhatsappCloud implements EnviadorWhatsapp {
  readonly nombre = "whatsapp-cloud";
  constructor(
    private readonly config: { token: string; phoneNumberId: string; plantilla: string; idioma: string; version?: string },
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async enviarAlerta(numeroE164: string, resumen: string) {
    const version = this.config.version ?? "v21.0";
    const r = await this.fetcher(`https://graph.facebook.com/${version}/${this.config.phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.config.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: numeroE164.replace(/^\+/, ""),
        type: "template",
        template: {
          name: this.config.plantilla,
          language: { code: this.config.idioma },
          components: [{ type: "body", parameters: [{ type: "text", text: limpiarParametro(resumen) }] }],
        },
      }),
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`WhatsApp ${r.status}: ${await r.text().catch(() => "")}`);
  }
}

export function enviadorWhatsapp(env = process.env): EnviadorWhatsapp | null {
  if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID || !env.WHATSAPP_PLANTILLA) return null;
  return new WhatsappCloud({
    token: env.WHATSAPP_TOKEN,
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
    plantilla: env.WHATSAPP_PLANTILLA,
    idioma: env.WHATSAPP_IDIOMA || "es",
    version: env.WHATSAPP_API_VERSION || undefined,
  });
}

/** "987 654 321" → "+51987654321" (Perú por defecto). Devuelve null si no es válido. */
export function normalizarCelular(texto: string | null | undefined): string | null {
  if (!texto) return null;
  const digitos = texto.replace(/[^\d+]/g, "");
  if (/^\+[1-9]\d{7,14}$/.test(digitos)) return digitos;
  const solo = digitos.replace(/\D/g, "");
  if (/^9\d{8}$/.test(solo)) return `+51${solo}`;
  if (/^51(9\d{8})$/.test(solo)) return `+${solo}`;
  return null;
}
