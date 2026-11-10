/**
 * Envío de correos. Implementación con Resend (https://resend.com) por HTTP, sin SDK.
 * Configurable con RESEND_API_KEY y CORREO_REMITENTE. Sin configuración, no se envía nada.
 */
export type Correo = { para: string; asunto: string; html: string; texto: string };

export interface EnviadorCorreo {
  readonly nombre: string;
  enviar(correo: Correo): Promise<void>;
}

export class CorreoResend implements EnviadorCorreo {
  readonly nombre = "resend";
  constructor(
    private readonly apiKey: string,
    private readonly remitente: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async enviar({ para, asunto, html, texto }: Correo) {
    const r = await this.fetcher("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: this.remitente, to: [para], subject: asunto, html, text: texto }),
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text().catch(() => "")}`);
  }
}

export function enviadorCorreo(env = process.env): EnviadorCorreo | null {
  if (!env.RESEND_API_KEY) return null;
  return new CorreoResend(env.RESEND_API_KEY, env.CORREO_REMITENTE || "FLIPDESK <onboarding@resend.dev>");
}

const escapar = (t: string) => t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Plantilla HTML simple y compatible con clientes de correo. */
export function htmlCorreo({ titulo, parrafos, lista, boton }: { titulo: string; parrafos: string[]; lista?: string[]; boton?: { texto: string; url: string } }) {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;padding:24px;border:1px solid #e2e8f0">
<tr><td style="font-size:20px;font-weight:900;color:#1c41b8;padding-bottom:12px">FLIPDESK</td></tr>
<tr><td style="font-size:18px;font-weight:bold;padding-bottom:8px">${escapar(titulo)}</td></tr>
${parrafos.map((p) => `<tr><td style="font-size:15px;line-height:1.5;padding-bottom:10px">${escapar(p)}</td></tr>`).join("")}
${lista?.length ? `<tr><td><ul style="padding-left:18px;margin:0 0 12px;font-size:15px;line-height:1.6">${lista.map((l) => `<li>${escapar(l)}</li>`).join("")}</ul></td></tr>` : ""}
${boton ? `<tr><td style="padding:8px 0 4px"><a href="${escapar(boton.url)}" style="display:inline-block;background:#1c41b8;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:10px">${escapar(boton.texto)}</a></td></tr>` : ""}
<tr><td style="font-size:12px;color:#64748b;padding-top:16px">Recibes este correo por tu cuenta en FLIPDESK.</td></tr>
</table></td></tr></table></body></html>`;
}
