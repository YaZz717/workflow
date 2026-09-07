import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import { recordAudit } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import { ResendVerification } from "./resend";
import type { PageParams } from "@/types/page";

export const metadata: Metadata = { title: "Vérification de l'email" };

async function verify(token: string): Promise<"ok" | "invalid" | "already"> {
  const tokenHash = hashToken(token);
  const record = await prisma.verificationToken.findUnique({ where: { token: tokenHash } });
  if (!record || record.expires < new Date()) return "invalid";

  const email = record.identifier.replace(/^email-verification:/, "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return "invalid";
  if (user.emailVerified) {
    await prisma.verificationToken.delete({ where: { token: tokenHash } }).catch(() => {});
    return "already";
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } }),
    prisma.verificationToken.deleteMany({ where: { identifier: record.identifier } }),
  ]);
  await recordAudit({
    actorId: user.id,
    action: "user.email_verified",
    resourceType: "User",
    resourceId: user.id,
    summary: `${user.name ?? email} a vérifié son adresse email`,
  });
  return "ok";
}

export default async function VerifyEmailPage({ searchParams }: PageParams) {
  const { token } = await searchParams;
  const result = typeof token === "string" && token ? await verify(token) : "invalid";

  if (result === "invalid") {
    return (
      <div className="space-y-6 text-center">
        <XCircle className="mx-auto size-10 text-destructive" />
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Lien invalide ou expiré</h1>
          <p className="text-sm text-muted-foreground">
            Demandez un nouveau lien de vérification ci-dessous.
          </p>
        </div>
        <ResendVerification />
        <p className="text-sm">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <CheckCircle2 className="mx-auto size-10 text-success" />
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          {result === "already" ? "Email déjà vérifié" : "Email vérifié !"}
        </h1>
        <p className="text-sm text-muted-foreground">Votre compte est maintenant actif.</p>
      </div>
      <Button asChild className="w-full">
        <Link href="/login">Se connecter</Link>
      </Button>
    </div>
  );
}
