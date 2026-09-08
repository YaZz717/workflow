# Référence API

Toutes les réponses suivent le format :

```jsonc
// succès
{ "data": { /* ... */ } }

// erreur
{ "error": { "code": "FORBIDDEN", "message": "Accès refusé", "details": null } }
```

| Code HTTP | `error.code` | Signification |
|---|---|---|
| 400 | `BAD_REQUEST` | Requête mal formée |
| 401 | `UNAUTHORIZED` | Non authentifié |
| 403 | `FORBIDDEN` | Authentifié mais non autorisé |
| 404 | `NOT_FOUND` | Ressource inexistante ou hors périmètre |
| 409 | `CONFLICT` | Conflit (doublon…) |
| 422 | `VALIDATION_ERROR` | Échec de validation Zod (`details` = erreurs par champ) |
| 429 | `RATE_LIMITED` | Trop de requêtes |
| 500 | `INTERNAL` | Erreur serveur |

Toutes les routes exigent une session valide (cookie Auth.js) sauf `/api/auth/*`.
Le périmètre de données est l'**organisation active** (cookie `workflow.activeOrg`).

---

## Recherche

### `GET /api/search?q=<terme>`
Recherche `terme` (≥ 2 caractères) dans les projets, tâches, documents et membres
de l'organisation active.

```jsonc
{ "data": { "results": [
  { "type": "project", "id": "...", "title": "Refonte site", "subtitle": "SITE", "href": "/projects/..." },
  { "type": "task", "id": "...", "title": "...", "subtitle": "SITE-3", "href": "/projects/.../tasks/..." }
] } }
```

---

## Notifications

### `GET /api/notifications`
Paramètres : `?filter=unread`, `?page=`, `?pageSize=` (max 100).

### `GET /api/notifications?unread=preview`
Retourne les 8 dernières + le compteur de non lues (utilisé par la cloche).
```jsonc
{ "data": { "items": [ /* Notification */ ], "unread": 3 } }
```

### `PATCH /api/notifications`
Marque toutes les notifications de l'utilisateur comme lues. → `{ "data": { "updated": 3 } }`

### `PATCH /api/notifications/:id`
Corps : `{ "read": true }` ou `{ "read": false }`.

---

## Suivi du temps

### `GET /api/time/current`
```jsonc
{ "data": { "timer": { "id": "...", "taskId": "...", "taskTitle": "...", "projectId": "...", "startedAt": "2026-09-07T09:00:00.000Z" } } }
// ou { "data": { "timer": null } }
```

### `POST /api/time/start`
Corps : `{ "taskId": "<cuid>" }`. Arrête automatiquement tout timer en cours,
puis démarre un nouveau `TimeEntry` (`isRunning = true`). → `201`

### `POST /api/time/stop`
Arrête le timer en cours de l'utilisateur, calcule `durationSec`.

---

## Projets & organisation (Phase 2 — Server Actions)

Les mutations de projets et d'équipe passent par des **Server Actions** typées
(pas des routes REST), toutes avec contrôle de permissions serveur et audit :

| Action | Fichier | Permission |
|---|---|---|
| `createProjectAction` | `app/(app)/projects/actions.ts` | org ≥ MANAGER |
| `updateProjectAction` | idem | LEAD du projet ou org ≥ MANAGER |
| `deleteProjectAction` | idem | org ≥ MANAGER |
| `addProjectMemberAction` / `removeProjectMemberAction` / `updateProjectMemberRoleAction` | idem | LEAD ou org ≥ MANAGER |
| `inviteMemberAction` / `revokeInvitationAction` | `app/(app)/team/actions.ts` | org ≥ ADMIN |
| `updateMemberRoleAction` | idem | org = OWNER |
| `removeMemberAction` | idem | org ≥ ADMIN, cible de rang inférieur |
| `acceptInvitationAction` / `declineInvitationAction` | `app/invite/[token]/actions.ts` | email de l'invité = email du compte |

## Routes prévues (phases suivantes)

```
GET/POST         /api/projects/:id/tasks
GET/PATCH/DELETE  /api/tasks/:id
PATCH            /api/tasks/:id/status        (déplacement Kanban)
POST             /api/tasks/:id/comments
POST             /api/tasks/:id/subtasks
POST             /api/tasks/:id/attachments
GET/POST         /api/documents
GET/POST         /api/calendar/events
GET              /api/stats/time
```
