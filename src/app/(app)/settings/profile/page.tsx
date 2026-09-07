import { requireUser } from "@/server/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";

export default async function ProfileSettingsPage() {
  const user = await requireUser();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil</CardTitle>
      </CardHeader>
      <CardContent>
        <ProfileForm
          defaults={{
            name: user.name ?? "",
            email: user.email,
            image: user.image ?? "",
            timezone: user.timezone,
            locale: (user.locale as "fr" | "en") ?? "fr",
          }}
        />
      </CardContent>
    </Card>
  );
}
