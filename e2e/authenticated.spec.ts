import { test, expect, type Page } from "@playwright/test";

const DEMO_EMAIL = "camille@studionova.fr";
const DEMO_PASSWORD = "Password123";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(DEMO_EMAIL);
  await page.getByLabel("Mot de passe").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: /se connecter/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
}

test.describe("Application (connecté)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("le tableau de bord affiche les indicateurs", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /bonjour/i })).toBeVisible();
    await expect(page.getByText("Projets", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Activité récente")).toBeVisible();
  });

  test("la liste des projets et le Kanban se chargent", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.getByRole("heading", { name: "Projets" })).toBeVisible();
    const firstProject = page.locator('a[href^="/projects/"]').first();
    await firstProject.click();
    await page.getByRole("link", { name: "Tâches", exact: true }).click();
    await expect(page.getByRole("button", { name: /kanban/i })).toBeVisible();
    // Une carte de tâche référencée (ex. SITE-1) est visible sur le board.
    await expect(page.locator("text=/[A-Z]{2,6}-\\d+/").first()).toBeVisible();
  });

  test("les pages temps, calendrier et documents répondent", async ({ page }) => {
    await page.goto("/time");
    await expect(page.getByRole("heading", { name: "Suivi du temps" })).toBeVisible();
    await expect(page.getByText("Aujourd'hui").first()).toBeVisible();

    await page.goto("/calendar");
    await expect(page.getByRole("heading", { name: "Calendrier" })).toBeVisible();

    await page.goto("/documents");
    await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible();
  });

  test("la recherche globale (Ctrl+K) renvoie des résultats", async ({ page }) => {
    await page.goto("/dashboard");
    await page.keyboard.press("Control+k");
    await page.getByPlaceholder(/rechercher projets/i).fill("maquette");
    await expect(page.getByText("Maquette de la page d'accueil")).toBeVisible({ timeout: 10_000 });
  });

  test("export CSV des tâches", async ({ page }) => {
    await page.goto("/tasks");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /exporter/i }).click();
    await page.getByRole("menuitem", { name: "Tâches" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/taches.*\.csv/);
  });

  test("la page admin est accessible (compte admin plateforme)", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Administration" })).toBeVisible();
    await expect(page.getByText("Journal d'audit — global")).toBeVisible();
  });
});
