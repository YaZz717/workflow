/**
 * Jeu de données de démonstration.
 * Lancé par `npm run db:seed` (ou `prisma migrate reset`).
 *
 * Connexion de démo : camille@studionova.fr / Password123
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  addDays,
  subDays,
  subHours,
  startOfWeek,
  setHours,
} from "date-fns";

const prisma = new PrismaClient();

const PASSWORD = "Password123";

function pick<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}
function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log("🌱 Nettoyage…");
  // Ordre inverse des dépendances (les cascades gèrent le reste).
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.document.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.task.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.project.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  console.log("👤 Utilisateurs…");
  const usersData = [
    { name: "Camille Ferrand", email: "camille@studionova.fr", globalRole: "ADMIN" as const },
    { name: "Hugo Martin", email: "hugo@studionova.fr" },
    { name: "Léa Dubois", email: "lea@studionova.fr" },
    { name: "Nadia Benali", email: "nadia@studionova.fr" },
    { name: "Thomas Klein", email: "thomas@studionova.fr" },
    { name: "Sarah Cohen", email: "sarah@studionova.fr" },
    { name: "Marc Petit", email: "marc@freelance.fr" },
  ];
  const users = await Promise.all(
    usersData.map((u) =>
      prisma.user.create({
        data: {
          ...u,
          passwordHash,
          emailVerified: new Date(),
          lastLoginAt: subHours(new Date(), randInt(1, 72)),
          image: `https://i.pravatar.cc/128?u=${encodeURIComponent(u.email)}`,
        },
      }),
    ),
  );
  const [camille, hugo, lea, nadia, thomas, sarah, marc] = users;

  console.log("🏢 Organisations…");
  const studioNova = await prisma.organization.create({
    data: {
      name: "Studio Nova",
      slug: "studio-nova",
      description: "Agence de design produit & développement web.",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=StudioNova",
      settings: { create: { allowMemberInvites: true, maxUploadMb: 10 } },
      subscription: {
        create: { plan: "BUSINESS", status: "ACTIVE", seats: 15, currentPeriodEnd: addDays(new Date(), 220) },
      },
      members: {
        create: [
          { userId: camille.id, role: "OWNER", title: "Directrice de studio" },
          { userId: hugo.id, role: "ADMIN", title: "Lead développeur" },
          { userId: lea.id, role: "MANAGER", title: "Cheffe de projet" },
          { userId: nadia.id, role: "MEMBER", title: "Designer UI" },
          { userId: thomas.id, role: "MEMBER", title: "Développeur front" },
          { userId: sarah.id, role: "MEMBER", title: "Développeuse back" },
          { userId: marc.id, role: "GUEST", title: "Consultant SEO" },
        ],
      },
    },
  });

  // Deuxième organisation pour illustrer le multi-org (et l'isolation).
  const atelierPixel = await prisma.organization.create({
    data: {
      name: "Atelier Pixel",
      slug: "atelier-pixel",
      description: "Collectif freelance — projets clients.",
      settings: { create: {} },
      subscription: { create: { plan: "PRO", status: "ACTIVE", seats: 5 } },
      members: {
        create: [
          { userId: hugo.id, role: "OWNER" },
          { userId: camille.id, role: "MEMBER" },
        ],
      },
    },
  });

  console.log("✉️  Invitation en attente…");
  await prisma.invitation.create({
    data: {
      organizationId: studioNova.id,
      email: "julien.roche@example.com",
      role: "MEMBER",
      tokenHash: "seed-invitation-hash-" + Date.now(),
      invitedById: camille.id,
      expiresAt: addDays(new Date(), 7),
    },
  });

  console.log("🏷️  Tags…");
  const tagDefs = [
    ["Bug", "#ef4444"],
    ["Feature", "#6366f1"],
    ["Design", "#ec4899"],
    ["Urgent", "#f59e0b"],
    ["Documentation", "#14b8a6"],
    ["Refactor", "#8b5cf6"],
  ];
  const tags = await Promise.all(
    tagDefs.map(([name, color]) =>
      prisma.tag.create({ data: { organizationId: studioNova.id, name, color } }),
    ),
  );

  console.log("📁 Projets…");
  const novaTeam = [camille, hugo, lea, nadia, thomas, sarah];
  const projectDefs = [
    {
      key: "SITE",
      name: "Refonte site vitrine ACME",
      description: "Nouveau site marketing pour ACME Corp : design, intégration et SEO.",
      status: "ACTIVE" as const,
      priority: "HIGH" as const,
      color: "#6366f1",
      lead: lea,
    },
    {
      key: "APP",
      name: "Application mobile Fidélité",
      description: "App iOS/Android de fidélité pour la chaîne de restaurants Bistrot&Co.",
      status: "ACTIVE" as const,
      priority: "URGENT" as const,
      color: "#ec4899",
      lead: hugo,
    },
    {
      key: "DS",
      name: "Design System interne",
      description: "Bibliothèque de composants partagée entre tous les projets du studio.",
      status: "PLANNING" as const,
      priority: "MEDIUM" as const,
      color: "#14b8a6",
      lead: nadia,
    },
    {
      key: "MIG",
      name: "Migration infrastructure Cloud",
      description: "Passage des serveurs on-premise vers une infra conteneurisée.",
      status: "ON_HOLD" as const,
      priority: "LOW" as const,
      color: "#f59e0b",
      lead: sarah,
    },
  ];

  const taskTitlesByProject: Record<string, string[]> = {
    SITE: [
      "Maquette de la page d'accueil",
      "Intégration du header responsive",
      "Section hero avec animation",
      "Page tarifs et comparatif",
      "Formulaire de contact + validation",
      "Optimisation des images (WebP)",
      "Audit SEO technique",
      "Mise en place du blog",
      "Tests cross-navigateurs",
      "Rédaction des pages légales",
    ],
    APP: [
      "Écran d'onboarding",
      "Authentification par SMS",
      "Carte de fidélité animée",
      "Notifications push promotions",
      "Historique des points",
      "Intégration paiement Apple Pay",
      "Mode hors-ligne",
      "Écran profil et préférences",
      "Crash au scroll sur Android 12",
      "Préparer la fiche App Store",
    ],
    DS: [
      "Inventaire des composants existants",
      "Définir les tokens de couleur",
      "Composant Button (variants)",
      "Composant Modal accessible",
      "Documentation Storybook",
      "Grille et espacements",
    ],
    MIG: [
      "Cartographie des services",
      "Choix de l'orchestrateur",
      "Dockeriser l'API principale",
      "Pipeline CI/CD",
      "Plan de bascule et rollback",
    ],
  };

  const STATUSES = ["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;
  const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
  const subtaskPool = [
    "Créer le composant",
    "Écrire les tests",
    "Revue de code",
    "Mettre à jour la doc",
    "Valider avec le client",
    "Responsive mobile",
  ];
  const commentPool = [
    "J'ai commencé, ça avance bien.",
    "Attention à bien respecter la charte graphique ici.",
    "Est-ce qu'on a un retour du client sur ce point ?",
    "Bloqué par la tâche précédente, je prends autre chose en attendant.",
    "C'est prêt pour la revue.",
    "Super boulot 👏",
    "J'ai poussé une correction, à re-tester.",
  ];

  const auditBuffer: Prisma.AuditLogCreateManyInput[] = [];
  const notifBuffer: Prisma.NotificationCreateManyInput[] = [];

  for (const def of projectDefs) {
    const members = pick(novaTeam, randInt(3, 5));
    if (!members.find((m) => m.id === def.lead.id)) members.push(def.lead);

    const project = await prisma.project.create({
      data: {
        organizationId: studioNova.id,
        key: def.key,
        name: def.name,
        description: def.description,
        status: def.status,
        priority: def.priority,
        color: def.color,
        startDate: subDays(new Date(), randInt(20, 60)),
        endDate: addDays(new Date(), randInt(20, 90)),
        leadId: def.lead.id,
        createdById: camille.id,
        image: `https://api.dicebear.com/9.x/glass/svg?seed=${def.key}`,
        members: { create: members.map((m) => ({ userId: m.id, role: m.id === def.lead.id ? "LEAD" : "MEMBER" })) },
        taskCounter: { create: { next: 1 } },
      },
    });

    auditBuffer.push({
      organizationId: studioNova.id,
      actorId: camille.id,
      action: "project.create",
      resourceType: "Project",
      resourceId: project.id,
      summary: `Camille Ferrand a créé le projet « ${project.name} »`,
      createdAt: subDays(new Date(), randInt(20, 60)),
    });

    const titles = taskTitlesByProject[def.key];
    let number = 1;
    for (const title of titles) {
      const status = rand([...STATUSES]);
      const isDone = status === "DONE";
      const createdAt = subDays(new Date(), randInt(1, 40));
      const assignees = pick(members, randInt(1, 2));

      const task = await prisma.task.create({
        data: {
          projectId: project.id,
          number: number++,
          title,
          description: `**Contexte**\n\n${def.description}\n\n**Objectif**\n\n${title}.`,
          status,
          priority: rand([...PRIORITIES]),
          boardOrder: number * 1000,
          estimateMinutes: rand([60, 120, 180, 240, 480]),
          dueDate: rand([addDays(new Date(), randInt(-5, 20)), addDays(new Date(), randInt(1, 30)), null]),
          startedAt: status !== "BACKLOG" && status !== "TODO" ? subDays(new Date(), randInt(1, 10)) : null,
          completedAt: isDone ? subDays(new Date(), randInt(0, 13)) : null,
          createdById: rand(members).id,
          createdAt,
          assignees: { create: assignees.map((a) => ({ userId: a.id })) },
          tags: { create: pick(tags, randInt(0, 2)).map((t) => ({ tagId: t.id })) },
          subtasks: {
            create: pick(subtaskPool, randInt(0, 4)).map((st, i) => ({
              title: st,
              position: i,
              isDone: Math.random() > 0.5,
              completedAt: Math.random() > 0.5 ? subDays(new Date(), randInt(0, 5)) : null,
            })),
          },
          activities: {
            create: [
              { field: "status", oldValue: "BACKLOG", newValue: status, actorId: rand(members).id, createdAt },
            ],
          },
        },
      });

      // Commentaires
      const commentCount = randInt(0, 3);
      for (let c = 0; c < commentCount; c++) {
        const author = rand(members);
        await prisma.comment.create({
          data: {
            taskId: task.id,
            authorId: author.id,
            body: rand(commentPool),
            createdAt: subDays(new Date(), randInt(0, 8)),
          },
        });
      }

      // Entrées de temps
      if (status !== "BACKLOG" && status !== "TODO") {
        const entryCount = randInt(1, 4);
        for (let e = 0; e < entryCount; e++) {
          const worker = rand(assignees);
          const day = subDays(new Date(), randInt(0, 13));
          const startedAt = setHours(day, randInt(9, 16));
          const durationSec = randInt(15, 180) * 60;
          await prisma.timeEntry.create({
            data: {
              taskId: task.id,
              userId: worker.id,
              startedAt,
              endedAt: new Date(startedAt.getTime() + durationSec * 1000),
              durationSec,
              isRunning: false,
              source: "timer",
            },
          });
        }
      }

      // Notifications d'assignation (pour Camille surtout)
      for (const a of assignees) {
        notifBuffer.push({
          organizationId: studioNova.id,
          recipientId: a.id,
          actorId: task.createdById,
          type: "TASK_ASSIGNED",
          title: `Nouvelle tâche : ${task.title}`,
          body: `${project.name} · ${def.key}-${task.number}`,
          link: `/projects/${project.id}/tasks/${task.id}`,
          entityType: "Task",
          entityId: task.id,
          readAt: Math.random() > 0.4 ? subDays(new Date(), randInt(0, 5)) : null,
          createdAt: task.createdAt,
        });
      }

      if (isDone) {
        auditBuffer.push({
          organizationId: studioNova.id,
          actorId: rand(assignees).id,
          action: "task.complete",
          resourceType: "Task",
          resourceId: task.id,
          summary: `${rand(assignees).name} a terminé « ${task.title} »`,
          createdAt: task.completedAt!,
        });
      }
    }

    await prisma.projectTaskCounter.update({
      where: { projectId: project.id },
      data: { next: number },
    });

    // Documents + dossiers
    const folder = await prisma.folder.create({
      data: { organizationId: studioNova.id, projectId: project.id, name: "Spécifications" },
    });
    await prisma.document.createMany({
      data: [
        {
          organizationId: studioNova.id,
          projectId: project.id,
          folderId: folder.id,
          authorId: def.lead.id,
          title: "Cahier des charges",
          content: `# Cahier des charges — ${project.name}\n\n${project.description}\n\n## Périmètre\n- ...\n\n## Livrables\n- ...`,
        },
        {
          organizationId: studioNova.id,
          projectId: project.id,
          authorId: rand(members).id,
          title: "Compte-rendu de réunion de lancement",
          content: "## Participants\n\n## Décisions\n\n## Prochaines étapes",
        },
      ],
    });

    // Événements calendrier
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    await prisma.calendarEvent.create({
      data: {
        organizationId: studioNova.id,
        projectId: project.id,
        organizerId: def.lead.id,
        title: `Point d'avancement ${def.key}`,
        description: "Revue hebdomadaire de l'équipe.",
        type: "MEETING",
        startAt: setHours(addDays(weekStart, randInt(0, 4)), 10),
        endAt: setHours(addDays(weekStart, randInt(0, 4)), 11),
        attendees: { create: members.map((m) => ({ userId: m.id, status: "accepted" })) },
      },
    });
  }

  console.log("🔔 Notifications & audit…");
  await prisma.notification.createMany({ data: notifBuffer });
  await prisma.auditLog.createMany({ data: auditBuffer });

  await prisma.notification.create({
    data: {
      organizationId: studioNova.id,
      recipientId: camille.id,
      actorId: lea.id,
      type: "MENTION",
      title: "Léa Dubois vous a mentionné",
      body: "@Camille peux-tu valider la maquette ?",
      link: "/projects",
      readAt: null,
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        organizationId: studioNova.id,
        actorId: camille.id,
        action: "member.role_change",
        resourceType: "OrganizationMember",
        resourceId: hugo.id,
        summary: "Camille Ferrand a changé le rôle de Hugo Martin de MEMBER à ADMIN",
        oldValue: { role: "MEMBER" },
        newValue: { role: "ADMIN" },
        createdAt: subDays(new Date(), 30),
      },
      {
        organizationId: studioNova.id,
        actorId: camille.id,
        action: "member.invite",
        resourceType: "Invitation",
        summary: "Camille Ferrand a invité julien.roche@example.com (MEMBER)",
        createdAt: subDays(new Date(), 2),
      },
    ],
  });

  // Atelier Pixel : un petit projet pour prouver l'isolation.
  const px = await prisma.project.create({
    data: {
      organizationId: atelierPixel.id,
      key: "CLI",
      name: "Landing page client X",
      description: "One-page pour un lancement produit.",
      status: "ACTIVE",
      priority: "MEDIUM",
      color: "#0ea5e9",
      leadId: hugo.id,
      createdById: hugo.id,
      members: { create: [{ userId: hugo.id, role: "LEAD" }, { userId: camille.id, role: "MEMBER" }] },
      taskCounter: { create: { next: 4 } },
    },
  });
  await prisma.task.createMany({
    data: [1, 2, 3].map((n) => ({
      projectId: px.id,
      number: n,
      title: ["Wireframe", "Intégration", "Mise en ligne"][n - 1],
      status: (["DONE", "IN_PROGRESS", "TODO"] as const)[n - 1],
      priority: "MEDIUM" as const,
      boardOrder: n * 1000,
      createdById: hugo.id,
    })),
  });

  console.log("\n✅ Seed terminé.");
  console.log("   Connexion : camille@studionova.fr / Password123");
  console.log(`   ${users.length} utilisateurs · 2 organisations · 5 projets\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
