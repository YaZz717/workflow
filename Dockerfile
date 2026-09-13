# --- Image de production WorkFlow (multi-stage) -----------------------------
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# --- Dépendances -----------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# --- Build ---------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Valeurs factices pour satisfaire la validation d'env au build (src/env.ts).
# Next.js importe les modules de route (dont l'API auth) pour les analyser :
# aucune connexion réelle à la base n'est faite à ce stade.
ENV AUTH_SECRET="build-time-placeholder-secret"
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

# --- Runtime -------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Le CLI Prisma + le schéma sont nécessaires pour `prisma migrate deploy` au démarrage.
# On copie le paquet complet (pas le lien symbolique node_modules/.bin/prisma :
# une fois isolé de son dossier d'origine, le lien casse et Prisma ne retrouve
# plus ses fichiers internes) et on l'appelle par son vrai chemin.
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p uploads && chown nextjs:nodejs uploads
USER nextjs
EXPOSE 3002
ENV PORT=3002 HOSTNAME=0.0.0.0

CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node server.js"]
