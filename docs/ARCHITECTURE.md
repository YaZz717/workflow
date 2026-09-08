# Architecture

## Choix techniques

### Next.js 16 monolithe (App Router) plutôt qu'un backend séparé
Un seul déploiement, des Server Components pour le rendu de données et des
Route Handlers (`src/app/api/**`) pour l'API consommée par le client (recherche,
notifications, timer). Les mutations passent surtout par des **Server Actions**
typées (`src/app/**/actions.ts`) qui renvoient un `ActionResult` uniforme.

### Auth.js v5 plutôt qu'une implémentation maison
La demande initiale évoquait un système « JWT/sessions maison ». Écrire
soi-même la vérification d'email, le reset de mot de passe, la rotation de
session et la protection CSRF est une source classique de failles. Auth.js
fournit ces briques éprouvées. On y ajoute :

- **Provider Credentials** (email + mot de passe), hash **bcrypt** (coût 12).
- **Stratégie de session JWT** (obligatoire avec Credentials), cookie httpOnly, 30 jours.
- **Rate-limiting** des connexions via la table `LoginAttempt`
  (`src/lib/auth/rate-limit.ts`) : 5 échecs / 15 min par email **ou** IP.
- **Vérification d'email** obligatoire avant connexion (`VerificationToken`).
- **Reset de mot de passe** par token à usage unique haché en base
  (`PasswordResetToken`), expiration 1 h, réponse anti-énumération.

### Prisma 6 plutôt que 7
Prisma 7 (RC en septembre 2026) impose les *driver adapters* et un
`prisma.config.ts`. Pour un projet pédagogique et maintenable, Prisma 6.19
(stable, `url = env("DATABASE_URL")`, documentation abondante) est préférable.
La migration vers 7 pourra se faire plus tard.

### Tailwind v4
Configuration entièrement en CSS (`src/app/globals.css`), tokens de thème
clair/sombre exposés en variables CSS et mappés via `@theme inline`.

## Modèle de données

19 entités principales (+ tables de jointure et d'infrastructure auth). Points clés :

- **`Organization`** est la frontière d'isolation. Presque toutes les entités
  portent un `organizationId` (directement ou via `project`).
- **`OrganizationMember`** porte le rôle (`OWNER > ADMIN > MANAGER > MEMBER > GUEST`).
- **`ProjectMember`** porte un rôle projet (`LEAD > MEMBER > VIEWER`).
- **`ProjectTaskCounter`** : compteur séquentiel pour numéroter les tâches
  (`WEB-1`, `WEB-2`…), incrémenté en transaction.
- **`Task.boardOrder`** (float) : position dans une colonne Kanban, permet
  l'insertion entre deux cartes sans réindexer toute la colonne.
- **`TaskActivity`** : historique champ par champ (ancienne / nouvelle valeur).
- **`AuditLog`** : `actor`, `action`, `resourceType`, `resourceId`,
  `oldValue`/`newValue` (JSON), `ip`, `userAgent`, `createdAt`.
- **`TimeEntry`** : `startedAt`, `endedAt`, `durationSec`, `isRunning`
  (un seul timer actif par utilisateur, garanti applicativement).

Index composés sur les colonnes de filtrage fréquentes
(`(organizationId, status)`, `(recipientId, readAt)`, `(status, dueDate)`…).

## Sécurité

### Isolation inter-organisation (anti-IDOR)
`src/server/context.ts` centralise les gardes :

| Fonction | Vérifie |
|---|---|
| `requireUser()` | session valide + compte actif |
| `requireOrgMember(orgId)` | l'utilisateur est membre de l'organisation |
| `requireOrgRole(orgId, min)` | rôle d'organisation ≥ `min` |
| `requireOrgCapability(orgId, cap)` | matrice de permissions (`src/lib/permissions.ts`) |
| `requireProjectAccess(projectId)` | membre du projet **ou** rôle org ≥ MANAGER |
| `requireGlobalAdmin()` | `globalRole === "ADMIN"` (back-office) |

Une ressource introuvable **ou** hors périmètre renvoie `404` (on ne révèle pas
l'existence). Toutes les requêtes Prisma sont filtrées par `organizationId` —
jamais par un ID fourni par le client seul.

### Autres mesures
- Validation systématique des entrées avec **Zod** (API + Server Actions).
- Requêtes **paramétrées** via Prisma (pas de SQL brut) → pas d'injection SQL.
- `proxy.ts` (ex-`middleware.ts` en Next 16) protège toutes les routes non publiques.
- Réponses d'erreur API uniformes `{ error: { code, message } }` (`src/lib/http.ts`).
- Uploads (Phase 5) : type MIME et taille vérifiés côté serveur, stockage hors webroot.
- `src/env.ts` valide les variables d'environnement au démarrage.

## Conventions API

```
GET    /api/search?q=...              recherche globale (org active)
GET    /api/notifications             liste paginée
GET    /api/notifications?unread=preview
PATCH  /api/notifications             tout marquer comme lu
PATCH  /api/notifications/:id         { read: boolean }
GET    /api/time/current              timer en cours
POST   /api/time/start                { taskId }
POST   /api/time/stop
```

Pagination : `?page=&pageSize=` → `{ items, pagination: { page, pageSize, total, totalPages } }`.
Voir [API.md](API.md) pour le détail et les codes d'erreur.

## Roadmap

| Phase | Contenu |
|---|---|
| **1 — livrée** | Auth complète, organisations, RBAC serveur, dashboard, recherche, notifications, admin, audit, seed, tests, CI |
| **2 — livrée** | Projets : liste filtrable/triable, création/édition/suppression, dashboard par projet, onglets (tâches, documents, membres, paramètres), gestion des membres du projet et de leurs rôles ; invitations d'organisation par email + page d'acceptation `/invite/[token]` ; gestion des rôles d'organisation et retrait de membres |
| **3 — livrée** | Tâches : board Kanban avec glisser-déposer (dnd-kit) entre colonnes + réordonnancement, vue liste filtrable/triable/paginée, création via dialog, édition en ligne (statut, priorité, assignés, tags, échéance, estimation) ; sous-tâches CRUD ; commentaires avec mentions @, édition/suppression, réponses ; pièces jointes (upload validé côté serveur, téléchargement contrôlé) ; historique par tâche ; vue globale « Mes tâches » multi-projets ; notifications (assignation, mention, réponse, commentaire) |
| **4 — livrée** | Suivi du temps : chronomètre Start/Stop par tâche (compteur live + barre globale), saisie manuelle, édition/suppression des entrées, page `/time` avec totaux jour/semaine/mois, répartition par projet/tâche/personne (managers), série 14 jours, historique paginé. Calendrier : vues mois & semaine fusionnant événements et échéances de tâches, création/édition d'événements (type, projet, participants, journée entière), clic pour créer/ouvrir. Notifications d'échéance : endpoint cron `POST /api/cron/deadlines` (Bearer `CRON_SECRET`) à déclencher quotidiennement |
| **5** | Documents (éditeur, dossiers, upload), recherche plein-texte étendue |
| **6** | Peaufinage : temps réel (SSE), export, préférences de notification, thème avancé |

À chaque phase : schéma déjà prévu, ajout des routes API + Server Actions +
interfaces + tests, et entrées d'audit correspondantes.
