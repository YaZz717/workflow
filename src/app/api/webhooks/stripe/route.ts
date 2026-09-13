import type Stripe from "stripe";

import { handleRoute, ok, Errors } from "@/lib/http";
import { stripe } from "@/lib/stripe";
import { env } from "@/env";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

// Nécessaire pour lire le corps brut (vérification de signature) — le
// runtime Edge ne le permet pas.
export const runtime = "nodejs";

/**
 * POST /api/webhooks/stripe
 * Synchronise l'abonnement réel (mode test tant que STRIPE_SECRET_KEY est
 * une clé sk_test_) à partir des évènements Stripe. Vérifié par signature,
 * pas par authentification utilisateur (aucun utilisateur connecté ici).
 */
export const POST = handleRoute(async (req: Request) => {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    throw Errors.badRequest("Stripe non configuré");
  }

  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  if (!signature) throw Errors.badRequest("Signature manquante");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw Errors.badRequest("Signature invalide");
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.metadata?.organizationId;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (organizationId && subscriptionId) {
        await prisma.subscription.update({
          where: { organizationId },
          data: {
            plan: "PRO",
            status: "ACTIVE",
            stripeSubscriptionId: subscriptionId,
            stripePriceId: env.STRIPE_PRICE_ID_PRO || null,
          },
        });
        await recordAudit({
          organizationId,
          actorId: null,
          action: "billing.subscribed",
          resourceType: "Subscription",
          summary: "Abonnement Pro activé via Stripe Checkout",
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const organizationId = sub.metadata?.organizationId;
      const status = sub.status === "active" || sub.status === "trialing" ? "ACTIVE" : "PAST_DUE";
      const periodEnd = sub.items.data[0]?.current_period_end;
      const where = organizationId
        ? { organizationId }
        : { stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id };
      await prisma.subscription
        .update({
          where,
          data: {
            status,
            currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
          },
        })
        .catch(() => null);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const where = {
        stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      };
      const updated = await prisma.subscription
        .update({ where, data: { plan: "FREE", status: "CANCELED" } })
        .catch(() => null);
      if (updated) {
        await recordAudit({
          organizationId: updated.organizationId,
          actorId: null,
          action: "billing.canceled",
          resourceType: "Subscription",
          summary: "Abonnement Pro résilié",
        });
      }
      break;
    }

    default:
      break;
  }

  return ok({ received: true });
});
