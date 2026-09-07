import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { NotificationsList } from "./notifications-list";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <div>
      <PageHeader title="Notifications" description="Assignations, mentions, échéances et commentaires." />
      <NotificationsList />
    </div>
  );
}
