# Déploiement

## Option A — Docker Compose (recommandé pour un serveur unique)

1. Sur le serveur, clonez le dépôt et créez `.env.prod` :

```bash
POSTGRES_USER=workflow
POSTGRES_PASSWORD=<mot-de-passe-fort>
POSTGRES_DB=workflow
AUTH_SECRET=<npx auth secret>
AUTH_URL=https://workflow.exemple.fr
APP_PORT=3002
RESEND_API_KEY=<clé Resend, optionnel>
EMAIL_FROM=WorkFlow <no-reply@workflow.exemple.fr>
CRON_SECRET=<chaîne aléatoire longue>
```

2. Lancez :

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Le conteneur `app` applique automatiquement les migrations (`prisma migrate deploy`)
au démarrage, puis sert l'application sur le port `APP_PORT`.

3. Placez un reverse proxy TLS devant (Caddy, Nginx, Traefik) pointant vers
   `http://<serveur>:3002`. `AUTH_URL` doit correspondre à l'URL publique HTTPS.

4. **Premier compte** : inscrivez-vous via `/register`. Le premier utilisateur
   n'est pas admin plateforme par défaut ; promouvez-le en base si besoin :

```sql
UPDATE "User" SET "globalRole" = 'ADMIN' WHERE email = 'vous@exemple.fr';
```

## Option B — Plateforme managée (Vercel, Fly, Railway…)

- Base PostgreSQL managée → renseignez `DATABASE_URL`.
- Variables d'environnement : voir `.env.example`.
- Build : `npm run build` (le `postinstall` génère le client Prisma).
- Migrations : exécutez `npx prisma migrate deploy` dans le pipeline de release.
- ⚠️ Les uploads sont stockés sur le disque local (`./uploads`). Sur une
  plateforme au système de fichiers éphémère, branchez un stockage objet
  (S3/R2) en remplaçant `src/lib/upload.ts`.

## Tâche planifiée — rappels d'échéance

Configurez un cron (côté hébergeur, GitHub Actions `schedule`, cron-job.org…)
qui appelle une fois par jour :

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
  https://workflow.exemple.fr/api/cron/deadlines
```

## Checklist de mise en production

- [ ] `AUTH_SECRET` unique et secret (32+ octets aléatoires)
- [ ] `AUTH_URL` = URL publique HTTPS exacte
- [ ] Base PostgreSQL sauvegardée (dump quotidien)
- [ ] Reverse proxy TLS + redirection HTTP→HTTPS
- [ ] `RESEND_API_KEY` configuré si vous voulez les emails de vérification/reset réels
- [ ] `CRON_SECRET` configuré + cron quotidien branché
- [ ] Volume persistant monté sur `/app/uploads`
- [ ] `npm run build`, `npm run lint`, `npm test`, `npm run test:e2e` verts en CI
- [ ] Limites de ressources et redémarrage automatique du conteneur
