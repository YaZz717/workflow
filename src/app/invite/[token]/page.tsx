import type { Metadata } from "next";
import Link from "next/link";
import { LayoutGrid, MailX } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import { getCurrentUser } from "@/server/context";
import { ORG_ROLE_LABEL } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InvitationActions } from "./invitation-actions";
import type { PageParams } from "@/types/page";

export const metadata: Metadata = { title: "Invitation" };
export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: PageParams<{ token: string }>) {
  const { token } = await params;
  const [invitation, user] = await Promise.all([
    prisma.invitation.findUnique({
      where: { tokenHash: hashToken(token) },
      include: {
        organization: { select: { name: true, description: true, _count: { select: { members: true } } } },
        invitedBy: { select: { name: true } },
      },
    }),
    getCurrentUser(),
  ]);

  const invalid =
    !invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date();

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-5 p-8 text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <LayoutGrid className="size-5" />
          </span>

          {invalid ? (
            <>
              <MailX className="mx-auto size-8 text-muted-foreground" />
              <div>
                <h1 className="text-xl font-semibold">Invitation indisponible</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ce lien est invalide, expiré ou a déjà été utilisé.
                </p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Aller à la connexion</Link>
              </Button>
            </>
          ) : (
            <>
              <div>
                <h1 className="text-xl font-semibold">
                  Rejoindre {invitation!.organization.name}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {invitation!.invitedBy.name} vous invite en tant que{" "}
                  <strong>{ORG_ROLE_LABEL[invitation!.role]}</strong>.
                  {invitation!.organization.description
                    ? ` ${invitation!.organization.description}`
                    : ""}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {invitation!.organization._count.members} membre(s) · invitation pour{" "}
                  {invitation!.email}
                </p>
              </div>

              {!user ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Connectez-vous ou créez un compte avec l&apos;adresse{" "}
                    <strong>{invitation!.email}</strong> pour accepter.
                  </p>
                  <Button asChild className="w-full">
                    <Link href={`/login?callbackUrl=/invite/${token}`}>Se connecter</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/register">Créer un compte</Link>
                  </Button>
                </div>
              ) : (
                <InvitationActions
                  token={token}
                  emailMismatch={user.email.toLowerCase() !== invitation!.email.toLowerCase()}
                  invitedEmail={invitation!.email}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
