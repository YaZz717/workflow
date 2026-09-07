import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const DIACRITICS = /[̀-ͯ]/g;

/** Fusionne des classes Tailwind sans conflit. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Slug URL-safe à partir d'un texte libre. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Clé de projet (WEB, MKT…) dérivée d'un nom. */
export function projectKeyFromName(name: string): string {
  const words = name
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);
  if (words.length === 0) return "PRJ";
  if (words.length === 1) return words[0].slice(0, 4);
  return words
    .map((w) => w[0])
    .join("")
    .slice(0, 4);
}

export function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0 && m === 0) return `${totalSeconds}s`;
  if (h === 0) return `${m}min`;
  return `${h}h ${String(m).padStart(2, "0")}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
