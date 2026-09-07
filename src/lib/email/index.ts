import { env } from "@/env";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Envoi d'email.
 * - Si `RESEND_API_KEY` est défini : envoi réel via l'API Resend.
 * - Sinon (dev) : l'email est affiché dans la console du serveur.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailInput): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.info(
      [
        "",
        "📧 ─────────────── EMAIL (mode dev) ───────────────",
        `À      : ${to}`,
        `Sujet  : ${subject}`,
        `Texte  : ${text ?? "(html uniquement)"}`,
        "──────────────────────────────────────────────────",
        "",
      ].join("\n"),
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, html, text }),
  });

  if (!res.ok) {
    throw new Error(`Échec envoi email (${res.status}): ${await res.text()}`);
  }
}

export function baseTemplate(title: string, bodyHtml: string, cta?: { label: string; url: string }) {
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;background:#f4f4f5;padding:32px">
  <div style="max-width:480px;margin:auto;background:#fff;border-radius:12px;padding:32px">
    <h1 style="font-size:18px;margin:0 0 16px">${title}</h1>
    <div style="font-size:14px;color:#3f3f46;line-height:1.6">${bodyHtml}</div>
    ${
      cta
        ? `<a href="${cta.url}" style="display:inline-block;margin-top:24px;background:#6366f1;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px">${cta.label}</a>`
        : ""
    }
    <p style="font-size:12px;color:#a1a1aa;margin-top:24px">WorkFlow — plateforme de gestion de projets</p>
  </div></body></html>`;
}
