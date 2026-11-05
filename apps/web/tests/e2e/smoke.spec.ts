import { test, expect } from "@playwright/test";

const requiredRoutes = [
  "/",
  "/docs",
  "/privacy",
  "/terms",
  "/support",
  "/app",
  "/app/assets",
  "/app/assets/new",
  "/app/assets/sample-asset-id",
  "/app/jobs",
  "/app/jobs/new",
  "/app/jobs/sample-job-id",
  "/app/licenses",
  "/app/licenses/sample-license-id",
  "/app/runs/sample-run-id",
];

test.describe("public and app shell", () => {
  for (const route of requiredRoutes) {
    test(`renders ${route}`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status(), `HTTP status for ${route}`).toBe(200);
      await expect(page.locator("h1").first()).toBeVisible();
      await expect(page.locator("main#main-content")).toBeVisible();
    });
  }

  test("has an accessible skip link and valid public navigation", async ({ page }) => {
    await page.goto("/");
    const skip = page.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toHaveAttribute("href", "#main-content");
    await expect(
      page.getByRole("navigation", { name: "Public navigation" }),
    ).toBeVisible();
  });

  test("does not render inert href=# links", async ({ page }) => {
    for (const route of ["/", "/docs", "/privacy", "/terms", "/support", "/app"]) {
      await page.goto(route);
      const inert = await page.locator('a[href="#"]').count();
      expect(inert, `inert links on ${route}`).toBe(0);
    }
  });

  test("keeps unfinished controls visibly disabled", async ({ page }) => {
    await page.goto("/app/assets");
    await expect(page.getByRole("button", { name: /register asset/i })).toBeDisabled();
    await page.goto("/app/jobs");
    await expect(page.getByRole("button", { name: /create job/i })).toBeDisabled();
    await page.goto("/app/assets/new");
    await expect(page.getByLabel("Display name")).toBeDisabled();
    await expect(page.getByText("Form preview · Phase 3")).toBeVisible();
  });

  test("health endpoint is liveness-only", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.status).toBe("ok");
    expect(JSON.stringify(body)).not.toMatch(/DATABASE_URL|SECRET|TOKEN|PRIVATE/i);
  });

  test("serves a branded 404", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });
});
