import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ApiError } from "@/lib/http";
import { requireProjectAccess } from "@/server/context";
import { ProjectStatusBadge, PriorityBadge } from "@/components/shared/badges";
import { ProjectTabs } from "@/components/projects/project-tabs";
import type { PageParams } from "@/types/page";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: PageParams<{ projectId: string }>["params"];
}) {
  const { projectId } = await params;

  let data;
  try {
    data = await requireProjectAccess(projectId);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) notFound();
    throw err;
  }
  const { project } = data;

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/projects"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Tous les projets
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <span className="size-3 rounded-full" style={{ backgroundColor: project.color }} />
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{project.name}</h1>
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
            {project.key}
          </span>
          <ProjectStatusBadge status={project.status} />
          <PriorityBadge priority={project.priority} />
        </div>
        {project.description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{project.description}</p>
        ) : null}
      </div>

      <ProjectTabs projectId={projectId} />

      {children}
    </div>
  );
}
