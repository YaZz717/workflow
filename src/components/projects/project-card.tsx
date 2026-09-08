import Link from "next/link";
import { CheckCircle2, Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/ui/avatar";
import { ProjectStatusBadge, PriorityBadge } from "@/components/shared/badges";

type Project = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  color: string;
  status: "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  endDate: Date | null;
  lead: { id: string; name: string | null; image: string | null } | null;
  members: { id: string; name: string | null; image: string | null }[];
  memberCount: number;
  taskCount: number;
  doneCount: number;
  progress: number;
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="flex h-full flex-col p-5 transition-colors hover:border-primary/40">
        <div className="flex items-start gap-3">
          <span
            className="mt-1 size-3 shrink-0 rounded-full"
            style={{ backgroundColor: project.color }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                {project.key}
              </span>
              <PriorityBadge priority={project.priority} />
            </div>
            <h3 className="mt-1 truncate font-semibold">{project.name}</h3>
          </div>
          <ProjectStatusBadge status={project.status} />
        </div>

        {project.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
        ) : null}

        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="size-3.5" />
              {project.doneCount}/{project.taskCount} tâches
            </span>
            <span>{project.progress}%</span>
          </div>
          <Progress value={project.progress} />
        </div>

        <div className="mt-4 flex items-center justify-between border-t pt-3">
          <div className="flex -space-x-2">
            {project.members.slice(0, 4).map((m) => (
              <UserAvatar
                key={m.id}
                name={m.name}
                image={m.image}
                className="size-6 ring-2 ring-card"
              />
            ))}
            {project.memberCount > 4 ? (
              <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-2 ring-card">
                +{project.memberCount - 4}
              </span>
            ) : null}
            {project.memberCount === 0 ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="size-3.5" /> Aucun membre
              </span>
            ) : null}
          </div>
          {project.endDate ? (
            <span className="text-xs text-muted-foreground">
              échéance {format(project.endDate, "d MMM yyyy", { locale: fr })}
            </span>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}
