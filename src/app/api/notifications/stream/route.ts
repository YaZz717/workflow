import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/context";
import { getActiveOrganization } from "@/server/organizations";

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications/stream — Server-Sent Events.
 * Le serveur interroge la base toutes les 10 s et pousse le compteur de
 * notifications non lues quand il change. Simple et sans bus de messages.
 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  let organizationId: string;
  try {
    organizationId = (await getActiveOrganization()).id;
  } catch {
    return new Response("No organization", { status: 400 });
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const readCount = () =>
        prisma.notification.count({
          where: { recipientId: user.id, organizationId, readAt: null },
        });

      let last = await readCount();
      send("unread", { count: last });

      const poll = setInterval(async () => {
        if (closed) return;
        try {
          const count = await readCount();
          if (count !== last) {
            last = count;
            send("unread", { count });
          } else {
            controller.enqueue(encoder.encode(": keep-alive\n\n"));
          }
        } catch {
          /* ignore une erreur transitoire */
        }
      }, 10_000);

      const cleanup = () => {
        closed = true;
        clearInterval(poll);
        try {
          controller.close();
        } catch {
          /* déjà fermé */
        }
      };

      req.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
