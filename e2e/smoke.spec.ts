import { test, expect } from "@playwright/test";

test.describe("Pages publiques", () => {
  test("la landing page s'affiche", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/projets, tâches et temps/i);
    await expect(page.getByRole("link", { name: /commencer gratuitement/i })).toBeVisible();
  });

  test("redirige vers /login quand on visite une page protégée", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("le formulaire de connexion valide les champs", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
    await page.getByLabel("Email").fill("pas-un-email");
    await page.getByLabel("Mot de passe").fill("x");
    await page.getByRole("button", { name: /se connecter/i }).click();
    // Le navigateur bloque la soumission (type=email invalide) : on reste sur /login.
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Inscription", () => {
  test("affiche les règles de mot de passe", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByText(/une majuscule/i)).toBeVisible();
  });
});
