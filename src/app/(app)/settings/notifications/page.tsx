import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/context";
import { normalizePrefs } from "@/lib/notification-prefs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationPrefsForm } from "./prefs-form";

export default async function NotificationSettingsPage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: { notificationPrefs: true },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Préférences de notification</CardTitle>
      </CardHeader>
      <CardContent>
        <NotificationPrefsForm defaults={normalizePrefs(user.notificationPrefs)} />
      </CardContent>
    </Card>
  );
}
