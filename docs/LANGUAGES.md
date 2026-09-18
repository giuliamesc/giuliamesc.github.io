# Site languages

The language selector beside the theme control offers English, Italian and French.
English is the default and remains readable without JavaScript. The choice is saved
in this browser using the `site-language` local-storage preference and reused on
other pages. If browser storage is unavailable, switching still works on the current page.

Edit `_data/translations.yml` to update the homepage biography and interface text.
The English biography is also the source for the initial HTML in `_pages/about.md`.
Keep the same keys in all three languages. Mark translated text with
`data-i18n="key"`; accessible labels, tooltips and placeholders use
`data-i18n-aria-label`, `data-i18n-title` and `data-i18n-placeholder`.

Page front matter uses `translation_key` to opt known interface headings into
translation. `assets/js/language.js` also translates a narrow set of theme-provided
CV labels and bibliography buttons. It never translates publication titles,
abstracts, article bodies, author names, or the downloadable CV PDF. Languages are
browser preferences on the existing URLs, not separately indexed translated pages.

The `_includes/head.liquid`, `_includes/header.liquid` and `_includes/footer.liquid`
files intentionally override `al_folio_core` for this site's language controls,
assets and footer labels. They are tracked in `.al-folio-overrides.yml`. Review
upstream changes to those includes when updating the core gem and run:

```bash
bundle exec al-folio upgrade overrides audit
```

The site-specific integration checks are in `test/visual/language.spec.js`:

```bash
npx playwright test --config test/visual/playwright.config.js test/visual/language.spec.js
```
