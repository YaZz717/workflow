# WorkFlow

Plateforme SaaS de gestion de projets et d'équipes : projets, tâches (Kanban),
sous-tâches, commentaires, suivi du temps, documents, calendrier, notifications,
back-office d'administration et journal d'audit.

> **État du projet** — développement par phases.
> **Phase 1 (livrée)** : fondations, authentification complète, multi-organisations,
> rôles & permissions serveur, tableau de bord, recherche globale, notifications,
> back-office admin, journal d'audit, jeu de données de démo, tests, CI.
> Les modules Projets, Kanban, Temps, Documents et Calendrier ont leur schéma et
> une partie de leur API en place ; leurs interfaces arrivent dans les phases suivantes
> (voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#roadmap)).

## Stack

| Domaine | Choix |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS v4, composants maison (Radix UI) |
| Base de données | PostgreSQL 17 |
| ORM | Prisma 6 |
| Auth | Auth.js v5 (Credentials + session JWT, vérification email, reset, rate-limiting) |
| Validation | Zod |
| Formulaires | React Hook Form + Server Actions |
| Data client | TanStack Query |
| Graphiques | Recharts |
| Drag & drop | dnd-kit |
| Tests | Vitest (unitaire) + Playwright (e2e) |
| Qualité | ESLint + Prettier |
| Dev env | Docker Compose (PostgreSQL + Adminer) |

Voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) pour les justifications de ces choix.

## Prérequis

- **Node.js 20+** (testé avec Node 24)
- **Docker Desktop** (pour la base de données)
- npm

## Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Créer le fichier d'environnement
cp .env.example .env
# (un AUTH_SECRET de démo est déjà fourni dans .env.example)

# 3. Démarrer la base de données (Docker Desktop doit être lancé)
npm run db:up

# 4. Appliquer le schéma + charger les données de démo
npm run db:setup

# 5. Lancer l'application
npm run dev
```

L'application est disponible sur **http://localhost:3002**.
Adminer (visualisation de la base) : **http://localhost:8080** — serveur `db`,
utilisateur `workflow`, mot de passe `workflow`.

### Compte de démonstration

| Email | Mot de passe | Rôle |
|---|---|---|
| `camille@studionova.fr` | `Password123` | OWNER + administrateur plateforme |
| `hugo@studionova.fr` | `Password123` | ADMIN |
| `lea@studionova.fr` | `Password123` | MANAGER |
| `nadia@studionova.fr` | `Password123` | MEMBER |

Tous les comptes de démo utilisent le mot de passe `Password123`.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Serveur de développement (port 3002) |
| `npm run build` / `npm start` | Build et lancement en production |
| `npm run lint` | ESLint |
| `npm run typecheck` | Vérification TypeScript |
| `npm run format` | Prettier (écriture) |
| `npm test` | Tests unitaires (Vitest) |
| `npm run test:e2e` | Tests end-to-end (Playwright) |
| `npm run db:up` / `db:down` | Démarre / arrête PostgreSQL + Adminer |
| `npm run db:reset` | Réinitialise complètement la base (⚠️ efface les données) |
| `npm run db:setup` | Migrations + génération client + seed |
| `npm run db:seed` | Recharge uniquement les données de démo |
| `npm run prisma:studio` | Interface Prisma Studio |

## Sans Docker

Si Docker n'est pas disponible, utilisez n'importe quelle base PostgreSQL
(locale ou hébergée, ex. [Neon](https://neon.tech)) : modifiez `DATABASE_URL`
dans `.env`, puis lancez `npm run db:setup && npm run dev`.

## Dépannage

- **Docker Desktop ne démarre pas le moteur** : ouvrez l'application Docker Desktop,
  attendez que l'icône passe au vert. Si le problème persiste : menu Docker →
  *Troubleshoot* → *Restart*, ou `wsl --update` puis redémarrez Docker Desktop.
- **`Can't reach database server`** : la base n'est pas démarrée → `npm run db:up`.
- **Les emails ne partent pas** : normal en développement. Le contenu des emails
  (vérification, reset) s'affiche **dans la console du serveur**. Renseignez
  `RESEND_API_KEY` pour un envoi réel.

## Structure

```
prisma/            schéma, migrations, seed
src/
  app/
    (auth)/        inscription, connexion, mots de passe, vérification email
    (app)/         application (sidebar + topbar) : dashboard, notifications,
                   équipe, paramètres, admin, + placeholders des modules à venir
    api/           routes API REST (search, notifications, time, auth)
  components/      ui/ (primitives), layout/, dashboard/, search/, time/
  lib/             prisma, auth, permissions, http, audit, validations, email
  server/          contexte de requête, gardes d'accès, agrégations
```

## Sécurité

Les permissions sont **appliquées côté serveur** (voir `src/lib/permissions.ts` et
`src/server/context.ts`). Chaque accès à une ressource vérifie l'appartenance à
l'organisation : un utilisateur ne peut pas accéder aux données d'une autre
organisation en modifiant un identifiant dans l'URL. Détails dans
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#sécurité).

## Licence

Projet de démonstration — usage libre.
