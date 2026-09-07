import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Paramètres" };

export default function SettingsIndex() {
  redirect("/settings/profile");
}
