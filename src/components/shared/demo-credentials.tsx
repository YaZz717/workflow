"use client";

import * as React from "react";

export function DemoCredentials() {
  const [open, setOpen] = React.useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        Voir une démonstration
      </button>
    );
  }

  return (
    <p className="mt-4 text-xs text-muted-foreground">
      Compte de démo : <code className="rounded bg-muted px-1">camille@studionova.fr</code> /{" "}
      <code className="rounded bg-muted px-1">Password123</code>
    </p>
  );
}
