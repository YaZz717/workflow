import type { Metadata } from "next";

import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export const metadata: Metadata = { title: "Conditions générales d'utilisation · WorkFlow" };

export default function TermsPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <article className="mx-auto max-w-2xl px-6 py-16 text-sm leading-relaxed [&_a]:underline [&_a]:underline-offset-2 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_p]:mt-3">
          <h1>Conditions générales d&apos;utilisation</h1>
          <p className="mt-2 text-muted-foreground">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</p>

          <h2>1. Objet</h2>
          <p>
            Les présentes conditions générales d&apos;utilisation (« CGU ») régissent l&apos;accès et
            l&apos;utilisation du service WorkFlow, une plateforme en ligne de gestion de projets,
            de tâches, de suivi du temps et de documents, éditée par Gaspard Rey (« l&apos;Éditeur »).
            Elles s&apos;appliquent à tout utilisateur créant un compte sur WorkFlow (« l&apos;Utilisateur »).
          </p>

          <h2>2. Acceptation</h2>
          <p>
            La création d&apos;un compte WorkFlow implique l&apos;acceptation pleine et entière des
            présentes CGU. Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser le
            service.
          </p>

          <h2>3. Description du service</h2>
          <p>
            WorkFlow permet à une organisation de créer des projets, d&apos;y associer des tâches
            organisées en tableaux Kanban, de suivre le temps passé, de partager des documents et
            un calendrier, et — pour les organisations sur le plan Pro — de définir un taux
            horaire par projet afin de calculer un montant facturable. Le service est proposé
            selon deux formules décrites sur la page{" "}
            <a href="/tarifs">Tarifs</a> : un plan Gratuit et un plan Pro payant, sans engagement.
          </p>

          <h2>4. Compte utilisateur</h2>
          <p>
            L&apos;Utilisateur est seul responsable de la confidentialité de ses identifiants de
            connexion et de toute activité effectuée depuis son compte. Il s&apos;engage à fournir
            des informations exactes lors de son inscription et à en signaler tout usage non
            autorisé à l&apos;Éditeur dans les meilleurs délais.
          </p>

          <h2>5. Abonnement et facturation</h2>
          <p>
            Le plan Pro est un abonnement mensuel sans engagement de durée, facturé via notre
            prestataire de paiement Stripe. L&apos;Utilisateur peut résilier son abonnement à tout
            moment depuis les paramètres de son organisation ; l&apos;accès aux fonctionnalités Pro
            reste actif jusqu&apos;à la fin de la période déjà payée. WorkFlow ne stocke aucune
            donnée de carte bancaire : ces données sont traitées exclusivement par Stripe.
          </p>

          <h2>6. Contenu et données de l&apos;Utilisateur</h2>
          <p>
            L&apos;Utilisateur reste propriétaire des données, documents et fichiers qu&apos;il dépose
            sur WorkFlow. Il garantit disposer des droits nécessaires sur tout contenu qu&apos;il
            importe et s&apos;engage à ne pas déposer de contenu illicite. L&apos;Utilisateur peut
            exporter ses données (projets, tâches, temps) au format CSV à tout moment depuis
            l&apos;application.
          </p>

          <h2>7. Disponibilité et responsabilité</h2>
          <p>
            L&apos;Éditeur s&apos;efforce d&apos;assurer un service disponible et fonctionnel, sans
            garantie de disponibilité continue. WorkFlow est fourni « en l&apos;état » ; l&apos;Éditeur
            ne saurait être tenu responsable des dommages indirects résultant de l&apos;utilisation
            ou de l&apos;impossibilité d&apos;utiliser le service.
          </p>

          <h2>8. Résiliation</h2>
          <p>
            L&apos;Utilisateur peut supprimer son compte à tout moment. L&apos;Éditeur se réserve le
            droit de suspendre ou résilier l&apos;accès d&apos;un compte en cas de manquement grave aux
            présentes CGU.
          </p>

          <h2>9. Droit applicable</h2>
          <p>
            Les présentes CGU sont soumises au droit français. Tout litige relatif à leur
            interprétation ou leur exécution relève de la compétence des tribunaux français
            compétents.
          </p>

          <h2>10. Contact</h2>
          <p>
            Pour toute question relative aux présentes CGU : <a href="mailto:contact@workflow-app.fr">contact@workflow-app.fr</a>.
          </p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
