import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "./change-password-form";

export default async function SecuritySettingsPage() {
  const user = await requireUser();
  const recentAttempts = await prisma.loginAttempt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Changer de mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connexions récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAttempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune connexion enregistrée.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentAttempts.map((a) => (
                <li key={a.id} className="flex justify-between">
                  <span className={a.success ? "" : "text-destructive"}>
                    {a.success ? "Réussie" : "Échouée"} · {a.ip}
                  </span>
                  <span className="text-muted-foreground">
                    {a.createdAt.toLocaleString("fr-FR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
