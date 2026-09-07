import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  accent,
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  href?: string;
  accent?: "default" | "warning" | "success";
  hint?: string;
}) {
  const body = (
    <Card className="p-4 transition-colors hover:border-primary/40">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon
          className={cn(
            "size-4",
            accent === "warning" && "text-warning",
            accent === "success" && "text-success",
            (!accent || accent === "default") && "text-muted-foreground",
          )}
        />
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}
