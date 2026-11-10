import { test, expect } from "@playwright/test";

for (const action of ["switch", "disconnect"] as const) {
  test(`delayed import survives ${action} without stale mounting`, async ({
    page,
  }) => {
    let release!: () => void;
    let reached!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const requested = new Promise<void>((resolve) => {
      reached = resolve;
    });
    await page.route(/\/_astro\/uno\.[^/]+\.js$/, async (route) => {
      reached();
      await gate;
      await route.continue();
    });
    try {
      await page.goto("/laboratorio/");
      await page
        .getByRole("button", { name: "Activar visor 3D", exact: true })
        .click();
      await requested;
      const lab = page.locator("simulation-lab");
      if (action === "switch") {
        await page
          .getByLabel("Experiencia", { exact: true })
          .selectOption("senal-led");
        await expect(lab).toHaveAttribute("data-viewer-state", "ready");
      } else {
        await lab.evaluate((element) => {
          const parent = element.parentElement!;
          element.remove();
          parent.append(element);
        });
      }
      release();
      await page.waitForLoadState("networkidle");
      await expect(lab).toHaveAttribute(
        "data-viewer-state",
        action === "switch" ? "ready" : "idle",
      );
      await expect(page.locator("[data-viewport] canvas")).toHaveCount(
        action === "switch" ? 1 : 0,
      );
      await expect(page.getByLabel("Posición de reproducción")).toHaveValue(
        "0",
      );
      if (action === "switch")
        await expect(page.locator("[data-scene-title]")).toHaveText(
          "De una señal a la luz",
        );
    } finally {
      release();
    }
  });
}
