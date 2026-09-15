import type { Metadata } from "next";

import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export const metadata: Metadata = { title: "Politique de confidentialité · WorkFlow" };

export default function PrivacyPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <article className="mx-auto max-w-2xl px-6 py-16 text-sm leading-relaxed [&_a]:underline [&_a]:underline-offset-2 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_p]:mt-3 [&_li]:mt-1">
          <h1>Politique de confidentialité</h1>
          <p className="mt-2 text-muted-foreground">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</p>

          <h2>1. Responsable du traitement</h2>
          <p>
            WorkFlow est édité par Gaspard Rey. Pour toute question relative à vos données
            personnelles ou pour exercer vos droits, vous pouvez nous contacter à{" "}
            <a href="mailto:contact@workflow-app.fr">contact@workflow-app.fr</a>.
          </p>

          <h2>2. Données collectées</h2>
          <p>Nous collectons les données suivantes :</p>
          <ul className="ml-5 list-disc">
            <li>Données de compte : nom, adresse email, mot de passe (stocké de façon chiffrée).</li>
            <li>
              Données d&apos;usage : projets, tâches, entrées de temps, documents et fichiers que
              vous créez ou déposez dans l&apos;application.
            </li>
            <li>
              Données de facturation (plan Pro uniquement) : gérées et stockées par notre
              prestataire de paiement Stripe. WorkFlow ne stocke jamais vos coordonnées bancaires.
            </li>
            <li>Données techniques : adresse IP et journal d&apos;audit des actions effectuées, à des fins de sécurité.</li>
          </ul>

          <h2>3. Finalités</h2>
          <p>
            Ces données sont utilisées pour fournir le service (gestion de projets, notifications,
            facturation), assurer la sécurité du compte (journal d&apos;audit, limitation des
            tentatives de connexion) et, pour le plan Pro, gérer l&apos;abonnement via Stripe.
          </p>

          <h2>4. Base légale et durée de conservation</h2>
          <p>
            Le traitement repose sur l&apos;exécution du contrat qui vous lie à WorkFlow (fourniture
            du service) et, pour la facturation, sur une obligation légale de conservation
            comptable. Vos données sont conservées tant que votre compte est actif, et supprimées
            dans un délai raisonnable après suppression du compte, sauf obligation légale contraire.
          </p>

          <h2>5. Destinataires</h2>
          <p>
            Vos données sont hébergées chez Railway (hébergement de l&apos;application et de la
            base de données) et, pour les données de paiement, chez Stripe. Aucune donnée n&apos;est
            vendue à des tiers.
          </p>

          <h2>6. Cookies</h2>
          <p>
            WorkFlow utilise uniquement un cookie de session strictement nécessaire à
            l&apos;authentification. Aucun cookie publicitaire ou de suivi tiers n&apos;est utilisé.
          </p>

          <h2>7. Vos droits</h2>
          <p>
            Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, de
            suppression, de limitation et de portabilité de vos données, ainsi que d&apos;un droit
            d&apos;opposition. Vous pouvez exporter vos données (projets, tâches, temps) directement
            depuis l&apos;application, ou nous contacter à{" "}
            <a href="mailto:contact@workflow-app.fr">contact@workflow-app.fr</a> pour toute autre
            demande. Vous disposez également d&apos;un droit de réclamation auprès de la CNIL.
          </p>

          <h2>8. Sécurité</h2>
          <p>
            Les mots de passe sont stockés de façon chiffrée, les accès aux ressources sont
            vérifiés côté serveur et limités à votre organisation, et les tentatives de connexion
            sont limitées pour prévenir les attaques par force brute.
          </p>

          <h2>9. Modifications</h2>
          <p>
            Cette politique peut être mise à jour ; la date de dernière modification en haut de
            cette page reflète la version en vigueur.
          </p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
