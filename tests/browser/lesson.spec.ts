import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/software-aplicaciones/tablero-convivencia/");
});

test("assemble, hold a button, switch polarity, restart and stop", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const sim = page.locator("sim-player");
  const serial = sim.getByRole("log");
  const button = sim.locator(".sp-inputs button").first();
  await expect(button).toBeDisabled();
  await sim.locator(".sp-strip button").last().click();
  await expect(sim).not.toHaveClass(/running/);
  await sim.getByRole("button", { name: "Iniciar simulación", exact: true }).click();
  await expect(serial).toHaveText("Tablero listo\n");
  await button.focus();
  await page.keyboard.down("Space");
  await expect(serial).toContainText("bien:1");
  await expect(sim.locator(".led-lens")).toHaveCSS("fill", "rgb(40, 255, 40)");
  await page.keyboard.up("Space");
  await expect(sim.locator("[data-id='w_anode']")).toHaveAttribute("aria-hidden", "false");
  await expect(sim.locator("[data-id='w_k']")).toHaveAttribute("aria-hidden", "true");
  await sim.getByText("Configuración del experimento", { exact: true }).click();
  await sim.locator('[data-parameter="ANODO_COMUN"]').uncheck();
  await expect(serial).toHaveText("Tablero listo\n");
  await expect(sim.locator("[data-id='w_anode']")).toHaveAttribute("aria-hidden", "true");
  await expect(sim.locator("[data-id='w_k']")).toHaveAttribute("aria-hidden", "false");
  await sim.locator('[data-parameter="BUZZER_ACTIVO_ALTO"]').uncheck();
  await sim.locator('[data-parameter="MODO_DEMO"]').check();
  await expect(serial).toHaveText("Tablero listo\n");
  await sim.getByRole("tab", { name: "Código", exact: true }).click();
  await expect(sim.locator(".sp-code")).toContainText("const bool MODO_DEMO = true;");
  await button.focus();
  await page.keyboard.down("Space");
  await expect(sim.locator("[data-id='buzzer']")).toHaveClass(/sounding/);
  await sim.getByRole("button", { name: "Reiniciar", exact: true }).click();
  await page.keyboard.up("Space");
  await expect(serial).toHaveText("Tablero listo\n");
  await expect(sim.locator("[data-id='buzzer']")).not.toHaveClass(/sounding/);
  // Espera la ventana del aviso anterior: no debe aparecer un reporte tardío.
  await expect(async () => {
    await page.waitForTimeout(1300);
    expect(await serial.textContent()).toBe("Tablero listo\n");
  }).toPass({ timeout: 2000 });
  await sim.getByRole("button", { name: "Detener", exact: true }).click();
  await expect(button).toBeDisabled();
  await expect(sim.locator(".led-glow")).toHaveAttribute("opacity", "0");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  await sim.getByRole("tab", { name: "Paso a paso", exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("lesson.png"), fullPage: true });
});

test("keyboard navigation, notebook export and print content", async ({ page }) => {
  const sim = page.locator("sim-player");
  const firstTab = sim.getByRole("tab", { name: "Paso a paso", exact: true });
  await firstTab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(sim.getByRole("tab", { name: "Pieza", exact: true })).toBeFocused();
  await page.keyboard.press("End");
  await expect(sim.getByRole("tab", { name: "Código", exact: true })).toHaveAttribute("aria-selected", "true");
  const prediction = page.getByLabel("Mi predicción", { exact: true }).first();
  await prediction.fill("Un botón sostenido debe contar una sola vez.");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descargar mi registro" }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("c06-p1-registro.txt");
  expect(readFileSync((await download.path())!, "utf8")).toContain("Un botón sostenido debe contar una sola vez.");
  await page.evaluate(() => { window.print = () => {}; });
  await page.getByRole("button", { name: "Imprimir guía", exact: true }).click();
  await page.emulateMedia({ media: "print" });
  await expect(sim).not.toBeVisible();
  await expect(page.locator(".teacher-content")).toBeVisible();
  await expect(page.locator(".print-answer").first()).toContainText("Un botón sostenido");
  await expect(page.locator(".print-assembly")).toBeVisible();
});

test("pointer and touch activation register reports", async ({ page }, testInfo) => {
  const sim = page.locator("sim-player");
  await sim.getByRole("button", { name: "Iniciar simulación", exact: true }).click();
  const button = sim.locator(".sp-inputs button").first();
  await expect(button).toBeEnabled();
  if (testInfo.project.name === "mobile") await button.tap();
  else await button.click();
  await expect(sim.getByRole("log")).toContainText("bien:1");
  await sim.getByRole("button", { name: "Detener", exact: true }).click();
});

test("disconnect during firmware loading cancels the pending start", async ({ page }) => {
  await page.route("**/c06-p1.*.js", async (route) => {
    await page.evaluate(() => document.querySelector("sim-player")!.remove());
    await route.continue();
  });
  await page.evaluate(() => {
    (window as unknown as { detached: Element | null }).detached = document.querySelector("sim-player");
  });
  await page.getByRole("button", { name: "Iniciar simulación", exact: true }).click();
  await expect(page.locator("sim-player")).toHaveCount(0);
  await page.evaluate(() => {
    const sim = (window as unknown as { detached: Element }).detached;
    document.querySelector(".lab")!.append(sim);
  });
  await expect(page.locator("sim-player")).not.toHaveClass(/running/);
  await expect(page.getByRole("button", { name: "Iniciar simulación", exact: true })).toBeVisible();
});
