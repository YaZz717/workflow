"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Rendu Markdown (GFM). react-markdown n'exécute pas de HTML brut par défaut,
 * donc pas de risque XSS via le contenu utilisateur.
 */
export function Markdown({ children, className }: { children: string; className?: string }) {
  if (!children.trim()) {
    return <p className="text-sm text-muted-foreground">Document vide.</p>;
  }
  return (
    <div
      className={cn(
        "space-y-3 text-sm leading-relaxed",
        "[&_h1]:mt-4 [&_h1]:text-xl [&_h1]:font-semibold",
        "[&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold",
        "[&_h3]:mt-3 [&_h3]:font-semibold",
        "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_a]:text-primary [&_a]:underline",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs",
        "[&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
        "[&_table]:w-full [&_table]:text-left [&_th]:border-b [&_th]:py-1 [&_th]:pr-4 [&_td]:py-1 [&_td]:pr-4",
        "[&_hr]:my-4 [&_hr]:border-border",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
