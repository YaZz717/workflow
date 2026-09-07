import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  CalendarDays,
  Timer,
  FileText,
  Bell,
  Users,
  Settings,
  Shield,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Visible uniquement pour les administrateurs de la plateforme. */
  adminOnly?: boolean;
};

export const MAIN_NAV: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projets", href: "/projects", icon: FolderKanban },
  { label: "Mes tâches", href: "/tasks", icon: CheckSquare },
  { label: "Calendrier", href: "/calendar", icon: CalendarDays },
  { label: "Suivi du temps", href: "/time", icon: Timer },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

export const ORG_NAV: NavItem[] = [
  { label: "Équipe", href: "/team", icon: Users },
  { label: "Paramètres", href: "/settings", icon: Settings },
];

export const ADMIN_NAV: NavItem[] = [
  { label: "Administration", href: "/admin", icon: Shield, adminOnly: true },
];
