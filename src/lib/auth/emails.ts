import { env } from "@/env";
import { sendEmail, baseTemplate } from "@/lib/email";

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
  await sendEmail({
    to,
    subject: "Vérifiez votre adresse email — WorkFlow",
    text: `Confirmez votre adresse : ${url}`,
    html: baseTemplate(
      "Bienvenue sur WorkFlow 👋",
      "<p>Merci de vous être inscrit. Confirmez votre adresse email pour activer votre compte. Ce lien expire dans 24 heures.</p>",
      { label: "Confirmer mon email", url },
    ),
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
  await sendEmail({
    to,
    subject: "Réinitialisation de votre mot de passe — WorkFlow",
    text: `Réinitialisez votre mot de passe : ${url}`,
    html: baseTemplate(
      "Mot de passe oublié ?",
      "<p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>",
      { label: "Choisir un nouveau mot de passe", url },
    ),
  });
}

export async function sendInvitationEmail(params: {
  to: string;
  token: string;
  organizationName: string;
  inviterName: string;
}) {
  const url = `${env.NEXT_PUBLIC_APP_URL}/invite/${params.token}`;
  await sendEmail({
    to: params.to,
    subject: `${params.inviterName} vous invite à rejoindre ${params.organizationName} — WorkFlow`,
    text: `Rejoignez ${params.organizationName} : ${url}`,
    html: baseTemplate(
      `Invitation à rejoindre ${params.organizationName}`,
      `<p><strong>${params.inviterName}</strong> vous invite à collaborer sur WorkFlow. Cette invitation expire dans 7 jours.</p>`,
      { label: "Accepter l'invitation", url },
    ),
  });
}
