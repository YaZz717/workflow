import Stripe from "stripe";

import { env } from "@/env";

/**
 * `null` tant que STRIPE_SECRET_KEY n'est pas configurée : l'app doit
 * démarrer et fonctionner (plan Free) même sans compte Stripe. Tout
 * appelant doit gérer ce cas.
 */
export const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;
