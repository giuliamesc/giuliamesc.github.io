const { test, expect } = require("@playwright/test");

async function openMenu(page) {
  const toggle = page.locator(".navbar-toggler-main");
  if ((await toggle.isVisible()) && (await toggle.getAttribute("aria-expanded")) === "false") await toggle.click();
}

test("language preference translates the biography and survives navigation and reload", async ({ page }) => {
  await page.goto("/al-folio/");
  await openMenu(page);
  const selector = page.locator("#language-select");
  await expect(selector).toHaveValue("en");
  const englishBio = await page.locator('[data-i18n="bio_intro"]').textContent();
  await selector.selectOption("it");
  await expect(page.locator("html")).toHaveAttribute("lang", "it");
  await expect(page.locator('[data-i18n="bio_intro"]')).toContainText("Sono dottoranda");
  await expect(page.locator(".post-header .desc")).toHaveText("Dottoranda all’EPFL");
  await expect(page.locator("footer")).toContainText("Ultimo aggiornamento:");
  const inheritedColors = await page
    .locator('#navbar .active .nav-link > [data-i18n], footer [data-i18n="powered_by"]')
    .evaluateAll((elements) => elements.every((element) => getComputedStyle(element).color === getComputedStyle(element.parentElement).color));
  expect(inheritedColors).toBeTruthy();

  await page.locator('#navbar a[href$="/publications/"]').click();
  await expect(page.locator(".post-title")).toHaveText("pubblicazioni");
  await expect(page.locator("#bibsearch")).toHaveAttribute("placeholder", "Digita per filtrare");
  const titles = await page.locator(".bibliography .title").allTextContents();
  expect(titles.length).toBeGreaterThan(0);
  await openMenu(page);
  await selector.selectOption("fr");
  await expect(page.locator(".post-description")).toContainText("mes prépublications");
  expect(await page.locator(".bibliography .title").allTextContents()).toEqual(titles);
  await selector.selectOption("en");
  expect(await page.locator(".bibliography .title").allTextContents()).toEqual(titles);
  await selector.selectOption("fr");
  await page.reload();
  await expect(selector).toHaveValue("fr");
  await openMenu(page);
  await page.locator('#navbar .nav-link[href="/al-folio/"]').click();
  await expect(page.locator('[data-i18n="bio_intro"]')).toContainText("Je suis doctorante");
  await openMenu(page);
  await selector.selectOption("en");
  await expect(page.locator('[data-i18n="bio_intro"]')).toHaveText(englishBio);
});

test("language and theme controls work together and CV links survive translation", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  await page.goto("/al-folio/cv/");
  await openMenu(page);
  await page.locator("#language-select").selectOption("fr");
  await expect(page.locator(".cv .card-title")).toHaveText(["Coordonnées", "Formation", "Langues"]);
  await expect(page.locator(".cv .language-item").first()).toContainText("Langue maternelle");
  const download = page.getByRole("link", { name: "Télécharger le CV (PDF)" });
  await expect(download).toHaveAttribute("href", "/al-folio/assets/pdf/Mescolini_CV.pdf");
  await expect(download.locator("i")).toHaveClass(/fa-file-pdf/);
  await page.locator("#light-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("#language-select")).toHaveValue("fr");
  const positions = await page.locator(".site-preferences").evaluate((element) => {
    const theme = element.querySelector("#light-toggle").getBoundingClientRect();
    const language = element.querySelector("#language-select").getBoundingClientRect();
    return { themeY: theme.y + theme.height / 2, languageY: language.y + language.height / 2, right: language.right };
  });
  expect(Math.abs(positions.themeY - positions.languageY)).toBeLessThan(3);
  expect(positions.right).toBeLessThanOrEqual(page.viewportSize().width);
});

test("invalid or unavailable browser storage does not break translation", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("site-language", "unsupported"));
  await page.goto("/al-folio/");
  await expect(page.locator("#language-select")).toHaveValue("en");
  await page.addInitScript(() => {
    const getItem = Storage.prototype.getItem;
    const setItem = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) {
      if (key === "site-language") throw new Error("Storage unavailable");
      return getItem.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (key === "site-language") throw new Error("Storage unavailable");
      return setItem.call(this, key, value);
    };
  });
  await page.reload();
  await openMenu(page);
  await page.locator("#language-select").selectOption("it");
  await expect(page.locator('[data-i18n="bio_intro"]')).toContainText("Sono dottoranda");
});
