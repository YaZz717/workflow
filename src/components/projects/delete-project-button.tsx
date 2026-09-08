"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteProjectAction } from "@/app/(app)/projects/actions";

export function DeleteProjectButton({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="size-4" /> Supprimer le projet
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Supprimer « ${projectName} » ?`}
        description="Cette action est irréversible. Toutes les tâches, sous-tâches, commentaires, entrées de temps et documents du projet seront définitivement supprimés."
        confirmLabel="Supprimer définitivement"
        destructive
        onConfirm={async () => {
          const res = await deleteProjectAction(projectId);
          if (res.ok) {
            toast.success("Projet supprimé");
            router.push("/projects");
            router.refresh();
          } else {
            toast.error(res.error);
          }
        }}
      />
    </>
  );
}
