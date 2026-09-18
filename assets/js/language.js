(() => {
  "use strict";

  const translationsElement = document.getElementById("site-translations");
  const selector = document.getElementById("language-select");
  if (!translationsElement || !selector) return;

  const translations = JSON.parse(translationsElement.textContent);
  const storageKey = "site-language";
  const supported = (language) => Object.hasOwn(translations, language);
  const pageKey = document.querySelector("[data-language-page]")?.dataset.languagePage;
  const originalTitle = document.title;

  // Only explicitly marked content and known interface components are translated.
  // In particular, bibliography titles, abstracts and article bodies are untouched.
  const mark = (query, key, attribute = "data-i18n") => {
    document.querySelectorAll(query).forEach((element) => element.setAttribute(attribute, key));
  };

  if (pageKey === "about") {
    mark(".post-header .desc", "bio_subtitle");
  } else if (["publications", "news", "not_found"].includes(pageKey)) {
    mark(".post-header .post-title", pageKey);
    mark(".post-header .post-description", `${pageKey}_description`);
  }
  mark("#bibsearch", "filter_publications", "data-i18n-placeholder");
  mark("#bibsearch", "filter_label", "data-i18n-aria-label");
  mark("#back-to-top", "back_to_top", "data-i18n-aria-label");
  mark("#back-to-top", "back_to_top", "data-i18n-title");
  mark("#toc-sidebar", "table_of_contents", "data-i18n-aria-label");
  if (pageKey === "cv") {
    mark(".post-title a", "download_cv", "data-i18n-aria-label");
    mark(".post-title a", "download_cv", "data-i18n-title");
  }

  const componentSelector = ".cv .card-title, .cv .table-cv b, .cv .language-item, .cv .language-item strong, .bibliography .links a";
  const componentLabels = Array.from(document.querySelectorAll(componentSelector))
    .flatMap((element) => Array.from(element.childNodes))
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => ({ node, label: node.textContent.trim().replace(/\s*:$/, ""), suffix: node.textContent.trim().endsWith(":") ? ": " : " " }))
    .filter(({ label }) => Object.hasOwn(translations.en.component_labels, label));

  function applyLanguage(language) {
    const locale = supported(language) ? language : "en";
    const strings = translations[locale];
    document.documentElement.lang = locale;
    selector.value = locale;

    for (const attribute of ["text", "aria-label", "title", "placeholder"]) {
      const marker = attribute === "text" ? "data-i18n" : `data-i18n-${attribute}`;
      document.querySelectorAll(`[${marker}]`).forEach((element) => {
        const key = element.getAttribute(marker);
        const value = strings[key] ?? translations.en[key];
        if (typeof value !== "string") return;
        if (attribute === "text") element.textContent = value;
        else element.setAttribute(attribute, value);
      });
    }

    componentLabels.forEach(({ node, label, suffix }) => {
      node.textContent = (strings.component_labels[label] ?? label) + suffix;
    });
    // Tocbot may build its links after this deferred script runs.
    document.querySelectorAll("#toc-sidebar .toc-link").forEach((link) => {
      const id = link.hash.slice(1);
      const heading = document.getElementById(decodeURIComponent(id));
      if (heading?.matches(".cv .card-title")) link.textContent = heading.textContent;
    });

    document.querySelectorAll("time[data-localized-date]").forEach((element) => {
      const date = new Date(`${element.dateTime}T12:00:00`);
      if (!Number.isNaN(date.getTime())) {
        element.textContent = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(date);
      }
    });
    // Keep article titles and the CV download link intact.
    if (pageKey && pageKey !== "about" && translations.en[pageKey]) {
      document.title = originalTitle.replace(translations.en[pageKey], strings[pageKey]);
    }
  }

  let preferredLanguage = "en";
  try {
    preferredLanguage = localStorage.getItem(storageKey) || "en";
  } catch {
    // Storage may be unavailable; switching still works for this page.
  }
  applyLanguage(preferredLanguage);
  selector.closest(".language-control").hidden = false;
  selector.addEventListener("change", () => {
    applyLanguage(selector.value);
    try {
      localStorage.setItem(storageKey, selector.value);
    } catch {
      // A blocked preference store must not prevent translation.
    }
  });
  window.addEventListener("storage", (event) => {
    if (event.key === storageKey || event.key === null) applyLanguage(event.newValue || "en");
  });
  window.addEventListener("load", () => applyLanguage(selector.value), { once: true });
})();
