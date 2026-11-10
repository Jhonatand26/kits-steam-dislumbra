import { expect, test } from "@playwright/test";

test("laboratory is discoverable and preserves the portal identity", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Laboratorio 3D", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Laboratorio educativo 3D",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Experiencia", { exact: true })).toHaveValue(
    "explorar-uno",
  );
  await expect(
    page.getByRole("button", { name: "Reproducir", exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).fontFamily),
  ).toContain("Barlow");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("scene transport supports steps, seek, speed, pause and reset", async ({
  page,
}) => {
  await page.goto("/laboratorio/");
  await page
    .getByLabel("Experiencia", { exact: true })
    .selectOption("senal-led");
  await page
    .getByRole("button", { name: "Siguiente paso", exact: true })
    .click();
  await expect(page.locator("[data-signal]")).toHaveText(
    "HIGH · LED encendido",
  );
  await expect(page.getByLabel("Posición de reproducción")).toHaveValue("2");
  await page.getByLabel("Velocidad").selectOption("2");
  await page.getByLabel("Repetir").check();
  await page.getByRole("button", { name: "Reproducir", exact: true }).click();
  await page.getByRole("button", { name: "Pausar", exact: true }).click();
  await page.getByLabel("Posición de reproducción").fill("5");
  await expect(page.locator("[data-signal]")).toHaveText("LOW · LED apagado");
  await page
    .getByRole("button", { name: "Reiniciar secuencia", exact: true })
    .click();
  await expect(page.getByLabel("Posición de reproducción")).toHaveValue("0");
  await expect(
    page.getByRole("button", { name: "Reproducir", exact: true }),
  ).toBeVisible();
});

test("real WebGL viewer renders both plugins and exposes keyboard inspection", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/laboratorio/");
  await page
    .getByRole("button", { name: "Activar visor 3D", exact: true })
    .click();
  await expect(page.locator("simulation-lab")).toHaveAttribute(
    "data-viewer-state",
    "ready",
  );
  await expect(page.getByLabel("Vista 3D interactiva")).toBeVisible();
  await page
    .getByRole("button", { name: "Microcontrolador", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-inspector-title]")).toHaveText(
    "Microcontrolador",
  );
  await page
    .getByRole("button", { name: "Vista superior", exact: true })
    .click();
  await page.getByLabel("Vista expandida").check();
  await page
    .getByLabel("Experiencia", { exact: true })
    .selectOption("senal-led");
  await expect(page.locator("simulation-lab")).toHaveAttribute(
    "data-viewer-state",
    "ready",
  );
  await page.getByRole("button", { name: "LED", exact: true }).click();
  await expect(page.locator("[data-inspector-title]")).toHaveText("LED");
  await expect(page.locator("[data-viewport] canvas")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("WebGL failure preserves a usable educational player", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.startsWith("webgl")) return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto("/laboratorio/");
  await page
    .getByRole("button", { name: "Activar visor 3D", exact: true })
    .click();
  await expect(page.locator("simulation-lab")).toHaveAttribute(
    "data-viewer-state",
    "unavailable",
  );
  await expect(
    page.getByText("El visor 3D no está disponible.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Siguiente paso", exact: true })
    .click();
  await expect(page.locator("[data-chapter-title]")).toHaveText(
    "Energía y comunicación",
  );
});

test("switching and reconnecting never leaves stale canvases or active playback", async ({
  page,
}) => {
  await page.goto("/laboratorio/");
  await page
    .getByRole("button", { name: "Activar visor 3D", exact: true })
    .click();
  await page
    .getByLabel("Experiencia", { exact: true })
    .selectOption("senal-led");
  await page
    .getByLabel("Experiencia", { exact: true })
    .selectOption("explorar-uno");
  await expect(page.locator("simulation-lab")).toHaveAttribute(
    "data-viewer-state",
    "ready",
  );
  await page.getByRole("button", { name: "Reproducir", exact: true }).click();
  await page.locator("simulation-lab").evaluate((element) => {
    const parent = element.parentElement!;
    element.remove();
    parent.append(element);
  });
  await expect(
    page.getByRole("button", { name: "Reproducir", exact: true }),
  ).toBeVisible();
  await expect(page.locator("[data-viewport] canvas")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Activar visor 3D", exact: true })
    .click();
  await expect(page.locator("[data-viewport] canvas")).toHaveCount(1);
});

test("context loss pauses playback and supports an explicit clean retry", async ({
  page,
}) => {
  await page.goto("/laboratorio/");
  await page
    .getByRole("button", { name: "Activar visor 3D", exact: true })
    .click();
  await expect(page.locator("simulation-lab")).toHaveAttribute(
    "data-viewer-state",
    "ready",
  );
  await page.getByRole("button", { name: "Reproducir", exact: true }).click();
  const supported = await page
    .locator("[data-viewport] canvas")
    .evaluate((canvas) => {
      const extension = (canvas as HTMLCanvasElement)
        .getContext("webgl2")
        ?.getExtension("WEBGL_lose_context");
      extension?.loseContext();
      return Boolean(extension);
    });
  expect(supported).toBe(true);
  await expect(page.locator("simulation-lab")).toHaveAttribute(
    "data-viewer-state",
    "unavailable",
  );
  await expect(
    page.getByRole("button", { name: "Reproducir", exact: true }),
  ).toBeVisible();
  await expect(page.locator("[data-viewport] canvas")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Reintentar visor 3D", exact: true })
    .click();
  await expect(page.locator("simulation-lab")).toHaveAttribute(
    "data-viewer-state",
    "ready",
  );
  await expect(page.locator("[data-viewport] canvas")).toHaveCount(1);
});

test("learning material remains available without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/laboratorio/`);
  await page.getByText("Guía sin visor", { exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "De una señal a la luz", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Este laboratorio necesita JavaScript para el visor y los controles.",
    ),
  ).toBeVisible();
  await context.close();
});
