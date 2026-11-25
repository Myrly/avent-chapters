# Implementation Plan

**step 5.0**

## How to use this plan
- This file is split into implementation prompts. Steps 1.0 and 1.1 establish the static build and core calculation spike; complete step 1.5, then step 1.6, before moving to step 2.0.
- A `.0` step is a full feature or milestone (for example, `2.0`). A `.1`, `.2`, or later step can be a revision or a feature inserted between existing milestones; keep later step IDs unchanged unless the user requests renumbering.
- Steps 1.6 and 7.1–7.3 are explicitly inserted feature milestones, not bug-fix revisions.
- Each agent should complete only the named step unless the step explicitly says to integrate earlier work. Do not silently expand scope, and update this file's marker and the corresponding roadmap status when revising or discovering a new bug.
- Before changing code, read the project documents already listed in `AGENTS.md`, keep files within the 120-line hard target from `ARCHITECTURE.md`, and avoid new dependencies unless the step justifies one.
- The accepted architecture is a **generated static application served over HTTP**: Node.js built-in `node:http` serves files from `dist/`; there is no dynamic application backend or runtime EJS rendering. Book processing remains in the browser, and generated output remains compatible with other static hosts.
- The supported interface locales are French (`fr`, default) and English (`en`). All user-facing strings added in later steps must be available in both locales.

## Product summary
The app divides a book into a configurable number of reading days (24 by default), never splits a chapter or section, and generates:
1. a page-start plan for each day;
2. printable divider cards;
3. an optional EPUB copy containing numbered day separators; and
4. a PDF that the user can print.

EPUB metadata, chapter headings, and section/page mapping are used when available. The manual form is the fallback and must support a power-user keyboard flow.

## Assumptions to preserve
- EPUB input is optional.
- EPUBs contain navigable heading/TOC or spine data, but parsing must tolerate malformed, missing, or inconsistent metadata.
- The user supplies a print page count for manual mode.
- Page references are based on the user's physical edition; EPUB page locations are best-effort offsets, never guaranteed exact printed pages.
- Saved divisions are browser-local. Cookies are the required primary persistence mechanism for small state, with local storage reserved for non-sensitive detailed division data if cookies are insufficient.
- The static app may use a small build step for EJS, CSS, and assets, but must produce files that can be hosted anywhere as static files.
- The Node HTTP server only serves generated static assets. It must not receive or process uploaded EPUBs or saved book data.
- Language preference is browser-local: use the `lang` cookie for one year; absent or invalid values select French.
- Divider gallery designs are PNG files at `gallery/images/*.png`; the fixed circular layer is `overlay.png`. The user will supply these files before implementing the visual-design steps.
- PNG is selected over PDF for divider artwork because it supports direct browser/EPUB composition and transparency; its print sharpness depends on raster dimensions. PDF retains vector quality but requires rendering/conversion before use as a composited image.

## Recommended project shape
Create files only as needed, but prefer this structure:

- `src/data/models/` — plain data types for books, sections, parts, chapters, divisions, and EPUB metadata.
- `src/services/epub/` — ZIP reading, XHTML parsing, manifest/spine access, and EPUB rebuilding.
- `src/services/calculation/` — total days, page targets, section boundaries, and candidate scoring.
- `src/services/storage/` — cookie/local-storage serialization and migration.
- `src/services/pdf/` — card layout and PDF export adapter.
- `src/components/` — reusable form, card, table, and separator UI.
- `src/views/` — EJS views and shared partials.
- `public/styles/` — global and reusable Neobrutalist CSS.
- `public/assets/` — browser scripts, icons, and static images.
- `test/` — fixture-based unit and integration tests.

Keep every source file ideally under 100 lines and never beyond 120 lines. Split helpers instead of growing a large module.

---

## Step 1.0 — Static app foundation and pink Neobrutalist shell

**Status:** Complete.

**Goal**
Create the smallest buildable static application, including EJS entry pages, shared layout, base CSS, project scripts, and the browser icon.

**Implementation prompt**
Set up the static build/tooling only if needed to compile EJS and copy assets. EJS is compiled at build time; generated pages do not require runtime rendering. Implement a shared document layout and navigation shell. Use `./icon.png` as the favicon/browser icon, rename or move it into `public/assets/` if appropriate, and remove the original if it is the same unreferenced image. Add reusable classes for thick borders, square corners, and offset shadows using the STYLE.md palette.

**Files and responsibilities**
- Build configuration and npm scripts for `build`, `serve`, and `test` as applicable.
- `src/views/layout.ejs` or equivalent.
- Shared EJS partial for header/navigation/footer.
- `public/styles/base.css` and `public/styles/theme.css`.
- `public/assets/icon.png` and favicon declarations.

**Acceptance checks**
- The app builds from a clean checkout and produces static output.
- The favicon loads.
- Generated HTML has no runtime EJS dependency and there are no dynamic application routes.
- The home page and placeholder workflow pages share one consistent layout.
- Pink Neobrutalist components use reusable classes, not page-specific duplicate styles.
- A README command exists for build and local preview.

---

## Step 1.1 — Core data model and calculation spike

**Status:** Complete.

**Goal**
Add the plain domain models and prove the basic split algorithm on in-memory fixtures before UI or EPUB work.

**Implementation prompt**
Create minimal models for `Book`, `Section`, `DivisionDay`, and `SavedDivision`. A section has an ID, title, kind (`part`, `chapter`, `prologue`, `epilogue`, `author-note`, or `other`), and start page. A section may contain child sections; parts must not be mistaken for reading boundaries unless the book data says they are. Keep EPUB-derived and manual sections normalized to the same shape.

Implement pure calculation helpers:
- `normalizeSections()` sorts, removes invalid duplicates, and fills missing titles.
- `buildEvenTargets(totalPages, dayCount, startPage = 1)` returns target start pages within the selected story range.
- `chooseBoundary(targetPage, sectionStarts)` chooses the first valid section start no later than or as close as the algorithm permits.
- `calculateDivision()` combines the helpers and returns start/end pages plus whether each day was displaced.

The first pass should optimize for equal page counts while only changing a boundary to an included section start. By default the range is page 1 through the last page; a selected story start may move the range forward. For example, if the target is page 75 but chapters start at 70 and 82, it may choose 70 or 82 based on a documented least-distance rule. Document tie-breaking in code or tests.

**Acceptance checks**
- Models serialize and parse without external classes or framework state.
- Unit fixtures cover 24 days, 1 day, more days than chapters, duplicate starts, out-of-range pages, and missing chapter titles.
- A boundary is never a page inside a known section.
- The spike is exposed through a small script or test, not accidentally coupled to the UI.

---

## Step 1.5 — Node.js static HTTP hosting

**Status:** Complete.

**Goal**
Make the selected serving technology explicit and ensure the generated site can be hosted locally by a small Node.js server without introducing an application backend.

**Implementation prompt**
Use Node.js built-in `node:http` only; do not add Express, Fastify, or another server dependency. Review the existing `scripts/serve.js` and make it reliably serve the completed `dist/` output. The build remains separate (`npm run build`) and EJS remains build-time only. The server must not accept uploads, expose APIs, or process book/EPUB content.

Serve `/` as `index.html`, serve generated files under `dist/` with appropriate MIME types, and return a clear 404 for missing files. Restrict requests to GET and HEAD (return 405 for unsupported methods). Resolve and decode URL paths safely, reject malformed or traversal paths, and ensure the final resolved file stays under the `dist/` root. Handle query strings without treating them as part of filenames. Use `PORT` when provided and otherwise default to 4173; report startup errors rather than silently continuing. Keep the output compatible with static hosting providers that do not use this Node server.

**Files and responsibilities**
- `TECHNOLOGIES.md` — Node.js built-in HTTP for static hosting; EJS is build-time templating.
- `ARCHITECTURE.md` — document the build/serve separation and the server's static-only responsibilities.
- `scripts/serve.js` — startup, port validation, and server lifecycle.
- `scripts/static-server.js` — static HTTP handling, request validation, path containment, content types, and status codes.
- `package.json` — retain a simple `build` and `serve` command with no server framework dependency.
- `README.md` — document build, local server start, default port, and static-host deployment compatibility.

**Acceptance checks**
- After `npm run build`, `npm run serve` serves the home page and generated assets over HTTP.
- `/` and `/index.html` both return the home page; existing manual and EPUB placeholder pages load.
- CSS and favicon responses have appropriate content types.
- Missing paths return 404; unsupported methods return 405.
- Malformed, encoded, and traversal paths cannot read files outside `dist/`.
- Query strings do not alter file lookup; `PORT` overrides the default.
- The server only reads generated static files and has no API, upload, or application-data routes.
- No server framework dependency is added, and generated output remains independently deployable as static files.

---

## Step 1.6 — French/English localization

**Status:** Complete.

**Goal**
Localize the existing interface in French and English, default to French, and let users switch languages with a persistent selector.

**Implementation prompt**
Implement localization in the browser so it works with generated static HTML and build-time EJS. Add a shared, accessible language selector to the site header with French and English options. The page starts in French when no preference exists; a valid saved `lang=en` preference selects English. Switching applies translations immediately without requiring a server request or page-specific duplicate templates.

Create a small vanilla-JavaScript translation dictionary/helper. Mark existing visible strings in the shared layout, header/footer, home page, and manual/EPUB placeholder pages with stable translation keys. Translate document title, page language (`<html lang>`), navigation, headings, explanatory text, controls, and accessible names. Keep the French strings as the static HTML fallback. On selector change, update all translated nodes and the document language, then write `lang=fr` or `lang=en` with `Max-Age=31536000`, `Path=/`, and `SameSite=Lax`. Unknown cookie values fall back to French. If cookies are unavailable, the selected language must still apply for the current page; do not falsely claim it was persisted.

Do not introduce a localization package or runtime server rendering. New interface strings added in subsequent roadmap steps must be added to both dictionaries.

**Files and responsibilities**
- `src/views/layout.ejs` — document language, translation script, and localized document title.
- `src/views/partials/header.ejs` — accessible language selector with both locale labels.
- `src/views/partials/footer.ejs`, `src/views/index.ejs`, `src/views/manual.ejs`, and `src/views/epub.ejs` — stable translation keys for current page copy.
- `public/scripts/i18n.js` — cookie preference, locale application, and selector behavior.
- `public/scripts/i18n-messages.js` — French and English translation dictionaries.
- `scripts/build.js` — copy browser localization script into `dist/` if public asset copying does not already include it.
- `TECHNOLOGIES.md` / `ARCHITECTURE.md` — record client-side localization and cookie behavior.

**Acceptance checks**
- With no cookie or an invalid locale cookie, every current page displays French and sets `<html lang="fr">`.
- Selecting English updates the current page immediately and sets `<html lang="en">`.
- Reloading and navigating between home, manual, and EPUB pages preserves the selected language for one year.
- Selecting French restores French immediately and persists that selection.
- Every existing user-facing string and accessible label has French and English translations.
- The selector is keyboard accessible and has a translated accessible name.
- If cookie persistence is blocked, the current page still switches language without crashing.
- The app remains static; the HTTP server receives no locale API request and no localization package is added.

---

## Step 1.7 — Footer layout and localized credit

**Status:** Complete.

**Goal**
Keep the footer at the bottom of short pages and simplify it to one localized author credit.

**Implementation prompt**
Make the document body a column that fills at least the viewport height and let the main region grow to consume unused vertical space. The footer should follow the content on long pages and sit at the viewport bottom on short pages. Remove the footer panel appearance: no card background, border, or shadow. Show only `Made with ❤️ - by @Myrly` in English and `Fait avec le ❤️ - par @Myrly` in French, using the existing localization key and selector behavior.

**Files and responsibilities**
- `public/styles/base.css` — full-height flex-column layout, growing main region, and unboxed footer styling.
- `src/views/partials/footer.ejs` — concise French static fallback.
- `public/scripts/i18n-messages.js` — matching English and French footer copy.

**Acceptance checks**
- On a short page with a viewport taller than its content, the footer sits at the bottom.
- On long content, the footer remains after the main content without overlap.
- Footer styling has no panel background, border, or shadow.
- The footer contains only the requested localized credit in both languages.
- Selecting either locale displays the matching credit.

---

## Step 2.0 — Manual book and chapter entry form

**Status:** Complete.

**Goal**
Build the no-EPUB workflow for the last story page, chapter starts, and day count.

**Implementation prompt**
Create a power-user-oriented form with fields for title, edition label, last page of the story, desired day count (default 24), and chapter/section entries. Chapter entry should support keyboard-only add-next, edit, remove, and move actions. Provide sensible Tab/Enter behavior and never clear unrelated data on validation. Use blank rows for manual entry and support paste-friendly numeric input.

Validate:
- title and last story page are present;
- day count is a positive integer;
- section pages are positive and at or below the last story page;
- first section is allowed to start at page 1;
- duplicate page starts are reported and de-duplicated only with explicit user confirmation.

Use the core normalized data model and division calculation from step 1.1. Keep page/section parsing independent from DOM code.

**Acceptance checks**
- Enter advances or creates the next entry using the planned keyboard flow.
- The form cannot submit with invalid page ranges.
- Adding/removing sections updates a live summary.
- Manual and EPUB-derived books produce the same division input shape.
- A complete submission navigates to the division preview.

---

## Step 2.1 — Manual form revisions

**Status:** Complete.

**Goal**
Reserve a prompt for correcting issues found in step 2.0.

**Implementation prompt**
Record each bug or UX defect with its reproduction, expected behavior, and files. Fix only the manual form and its direct calculation/normalization integration. Add a focused regression test for every fixed defect. Do not introduce EPUB behavior here.

---

## Step 2.2 — Story start selection and last-page wording

**Status:** Complete.

**Goal**
Allow manual users to distinguish the first physical page of a book from the page where the story begins, and use that story start when calculating the division.

**Implementation prompt**
Rename the visible “total pages” field to “Last page of the story” in French and English while retaining `totalPages` as the internal final-page property. In the manual section list, show exactly one checkbox on the first populated page row. It asks whether the story starts on that page, defaults to checked, and moves to whichever row becomes first when rows are reordered or removed; preserve its checked state when it moves. With the box checked, use that row's page as `storyStartPage`; when unchecked or there is no populated row, use page 1.

Calculate day targets from `storyStartPage` through `totalPages`, ignore section boundaries before the selected story start, and keep the final day ending on `totalPages`. Localize the story-start label and synthetic start title in both languages. Existing EPUB/model data without an explicit story start must continue to default to page 1.

**Acceptance checks**
- The checkbox appears only once, on the first populated section row, defaults to checked, and follows that row through reorder/removal.
- Checked and unchecked submissions start the first division at the selected chapter page and page 1 respectively.
- Sections before the selected story start do not affect the resulting division; the last day still ends on the last story page.
- French and English label, preview summary, and synthetic story-start text are present.
- Tests cover target range, selection behavior, invalid start bounds, and the existing implicit page-1 behavior.

---

## Step 2.3 — Responsive width and neobrutalist checkboxes

**Status:** Complete.

**Goal**
Use more of the available desktop width without compromising small-screen layouts, and make checkbox controls match the site's visual system.

**Implementation prompt**
Raise the responsive main-content maximum width from 960px to 1200px while retaining a viewport-relative width and centered layout. Add one reusable `.brutal-checkbox` style with a thick ink border, square shape, palette fill, visible keyboard focus, and a clear checked mark. Apply it to both the story-start and duplicate-confirmation checkboxes. Give the story-start label a bordered pale panel and offset shadow so it reads like a neobrutalist control; preserve accessible native checkbox semantics.

**Acceptance checks**
- Main content grows up to 1200px on wide displays and remains within the viewport on narrow displays.
- Both checkboxes share the custom style, retain keyboard interaction and visible focus, and clearly show checked state.
- The story-start label wraps without horizontal overflow on small screens.
- Existing manual workflow behavior and translations remain unchanged.

---

## Step 2.4 — Sparse-section division and daily page goal

**Status:** Complete.

**Goal**
Avoid repeated chapter starts when section boundaries are too sparse for the requested number of days, and let users choose a daily page pace instead of a fixed day count.

**Implementation prompt**
Count unique valid section starts within the story range, including the first real section but excluding any synthetic story-start boundary. If the count is strictly below 65% of the requested `dayCount`, use the evenly spaced page targets as fallback starts. Prefer a real section boundary when it is within 20% of the ideal pages-per-day interval from its target; otherwise use the page target, allowing starts inside chapters. Keep starts increasing when the story has enough pages, preserve the last-page coverage, and keep the story-start page as the first day.

Add a division-mode selector to the manual form. Keep fixed day count as the default. The alternative accepts an integer pages-per-day goal (default 30) and derives `dayCount` by rounding `(totalPages - storyStartPage + 1) / pagesPerDayGoal` to the nearest integer, minimum 1. Retain the goal in `Book.pagesPerDayGoal` so the preview can display it alongside the derived day count. Localize mode options, labels, errors, and preview copy in French and English.

Update the input guidance in `AGENTS.md`, `STYLE.md`, `ARCHITECTURE.md`, and `NEXT.md`: future UI must use `.brutal-checkbox`, the responsive 1200px centered width, and the established neobrutalist palette/borders/focus/shadows; future division consumers must preserve this goal metadata and shared sparse-boundary behavior.

**Acceptance checks**
- Below 65%, requested days receive balanced page starts and nearby real section boundaries remain preferred; at or above 65%, starts remain at real section boundaries.
- Fixed-day mode remains the default and preserves the existing day-count behavior.
- Pages-per-day mode derives the nearest day count from the inclusive selected story range, validates positive integer goals, and reports the chosen goal in the preview.
- Day and page-goal inputs switch accessibly; both locales contain all new text.
- Tests cover threshold behavior, chapter splits, page-goal rounding, invalid goals, and existing page-range coverage.

---

## Step 3.0 — EPUB parsing

**Goal**
Read an uploaded EPUB and normalize its navigation/section structure.

**Implementation prompt**
Parse EPUB ZIP contents in the browser. Read `META-INF/container.xml` to find the package document, read the OPF to map manifest items and spine order, and parse navigation data. Prefer EPUB 3 nav headings, fall back to EPUB 2 NCX, then fall back to heading elements in spine XHTML. Normalize duplicates and sort by reading order.

Classify headings as prologue, epilogue, part, chapter, author note, or generic section using conservative title matching and document structure. Never infer exact printed page numbers from EPUBs without a supplied/known mapping. For display, store EPUB locations as percentages or spine-relative offsets. If no headings are found, preserve the file and return a clear manual-mode fallback.

**Acceptance checks**
- The parser accepts a valid EPUB fixture and finds section order.
- Tests cover EPUB 2 NCX, EPUB 3 nav, missing nav, malformed package references, and XHTML headings.
- A broken or unsupported file produces a useful error and does not corrupt state.
- Parsed output is the shared normalized section model.
- No upload leaves the user's browser.

**Step 3.0 implementation notes**
- `src/services/epub/parse.js` reads container/OPF metadata and `src/services/epub/navigation.js` prefers EPUB 3 nav, then EPUB 2 NCX, then spine XHTML headings.
- EPUB sections use the shared `Section` model with `startPage: null` and `epubOffset`; page order is not represented as a printed-page estimate. `epubOffset.characterOffset` is measured in spine reading order.
- `epub.html` reports metadata and detected sections in French/English. If no headings exist, the selected file stays in the current page and manual entry opens in a new tab.
- The parser runs in the browser, has no external package dependency, and rejects malformed/unsupported archives with localized errors. Step 4.0 still owns section editing, user-corrected physical-page mapping, and preview integration.

---

## Step 3.1 — EPUB print-page estimates and ignored sections

**Goal**
Balance EPUB reading days by readable character count, optionally estimate print-page markers, and let users skip irrelevant sections.

**Implementation prompt**
Add an optional positive integer for total pages in the printed edition. Always let users choose a day goal: reuse manual mode with 24 days by default; enable the pages-per-day goal only when a valid print-page total is supplied, deriving the day count through the shared page-goal helper.

Measure cumulative text-character offsets in spine order and retain them in each section's `epubOffset`. Without a print-page total, divide by readable characters, respecting chapter boundaries and applying the existing 65% sparse-section / 20% boundary-preference policy in character units. Do not display page numbers in this mode. With a print-page total, estimate page markers from raw whole-book character offsets and label them as estimates; edition-specific typography can change the result.

Provide an Ignore/Restore control on every detected section. Ignored rows remain visible but muted and can be restored. An ignored section's text is excluded from day-balance weights, while its raw character position remains in the full-book coordinate system used for print-page estimation.

**Acceptance checks**
- The total printed-page field is optional; blank input still produces a character-balanced plan.
- Fixed days defaults to 24. Pages-per-day is unavailable until a valid print-page total is entered.
- Supplied page totals produce estimated, not exact, printed-page markers based on character positions.
- Ignoring and restoring sections updates the plan immediately; ignored text is skipped in reading weights but retained in physical-page offsets.
- Ignoring every section produces a clear prompt to restore at least one.
- All controls, status messages, and day-plan output have French and English translations.
- Tests cover character-weighted boundaries, page estimates, ignored ranges, restore behavior, invalid goals, and localization.
- Browser checks confirm the selected EPUB remains local and the page has no narrow-screen overflow.

**Implementation notes**
- Reuse `deriveDayCountFromPages()` from `src/services/calculation/page-goal.js` and `shouldUsePageSplits()` from the shared calculation service.
- `Section.startPage` remains `null` for parsed EPUB content. Estimated print-page starts belong to the EPUB day-plan output and must not overwrite parser offsets.
- The user selected: fixed days defaulting to 24; pages-per-day mode only when print-page total exists; ignored section text excluded from balance while its raw position remains for print-page mapping.

---

## Step 4.0 — EPUB/manual workflow integration

**Goal**
Create the upload entry flow and merge EPUB metadata with user-provided values.

**Implementation prompt**
Build a page where the user can upload an EPUB or choose manual entry. After EPUB parsing, show detected title/author/sections and allow corrections or removal of false headings. When a physical page count is available, map EPUB section offsets to the book's numbered pages; otherwise retain spine-relative section positions and explain that page markers are estimates.

Add EPUB and manual submit paths to the same preview route. Keep an EPUB draft in same-tab `sessionStorage` so edits and form goals survive navigation and refresh; do not serialize the uploaded `File` or its bytes. This temporary draft is separate from step 5.0 saved divisions.

For EPUBs, always request an optional total print-page count. Without it, balance by readable character positions and do not display printed page numbers. With it, show estimated page markers and let the user enter an exact printed start page for each detected section; blank overrides keep the estimate. Validate exact pages as positive, within the print-page total, and increasing in section order.

Allow section titles to be edited, ignored/restored, or removed. If parsing finds no usable headings, or the user removes all sections, offer manual entry in the same tab and prefill the detected title and author. Add an optional author field to manual entry and show it in the shared preview.

**Acceptance checks**
- EPUB upload is optional and manual mode remains fully usable.
- Detected section titles can be edited; ignored sections remain visible and restorable; removed sections are excluded.
- Exact per-section page overrides validate range and reading order; blank overrides retain interpolated estimates.
- A missing print-page count leaves EPUB page markers unset and still produces a character-weighted plan.
- Missing headings or removal of every section offers same-tab manual entry with title/author prefilled.
- Manual and EPUB workflows produce the shared preview day shape from step 1.1, with source-appropriate copy.
- EPUB edits, goals, and page overrides survive same-tab refresh/back navigation without retaining the uploaded file.
- The browser never sends EPUB content to a server.

**Step 4.0 implementation notes**
- `src/services/epub/page-map.js` validates exact section starts and interpolates estimated print-page positions between exact anchors. `Section.startPage` contains only user-entered exact overrides; estimates remain derived values.
- `src/services/calculation/book-division.js` dispatches both manual and EPUB books to the common preview contract.
- `livrent.epub-draft` and `livrent.epub-preview` are transient `sessionStorage` handoffs. The draft stores parsed book/form state, never the `File`; persistent saved divisions remain step 5.0 work.
- The EPUB page can return to editing from the preview. If no sections remain, manual entry receives the EPUB title and author. Manual submissions use the same preview page and include the optional author in its summary.
- Focused tests cover page mapping, override order, shared day shape, and manual author parsing; browser checks cover import, edits, ignore/restore/remove, preview, fallback, refresh/back, localization, and narrow-screen overflow.

---

## Step 4.1 — Reading-plan statistics

**Goal**
Summarize how many printed pages each day covers in the shared preview.

**Implementation prompt**
For every day, calculate its inclusive page count as `endPage - startPage + 1`. In the shared preview, show the arithmetic average, standard median (mean of the middle two values for an even day count), maximum, and minimum. Format values with locale-aware digits and at most one decimal place.

For median, maximum, and minimum, provide a hover tooltip and keyboard-focusable equivalent listing every corresponding day, including ties. The average has no corresponding day. For EPUB, use the displayed character-to-print-page estimates when a total printed page count is available. If it is absent, hide the statistics box and explain that printed-page statistics require that total; do not present character counts as page counts.

**Acceptance checks**
- Manual previews show all four statistics using inclusive page ranges.
- EPUB previews with a print-page total show statistics computed from their estimated page ranges.
- EPUB previews without a print-page total hide the statistics and show a localized explanation.
- Median, maximum, and minimum tooltip day lists match the values and include ties; values remain keyboard accessible.
- French and English labels, explanations, and tooltip text are available.
- The statistics box follows the existing Neobrutalist style and causes no narrow-screen horizontal overflow.

**Step 4.1 implementation notes**
- `src/services/calculation/reading-statistics.js` is the pure page-range statistics helper. Its median day list includes all days matching either central value when the median falls between two values.
- `public/scripts/preview-statistics.js` renders summary values and accessible hover/focus day lists. EPUB statistics are hidden unless `Book.totalPages` is present; their ranges reuse the existing estimated/exact page mapping.
- `preview-days.js` keeps day-row formatting separate from preview orchestration so the small-file limit remains intact.

---

## Step 5.0 — Browser-local saved divisions

**Goal**
List saved divisions and open division details.

**Implementation prompt**
Create cookie/local-storage services that save a compact division summary and can recover detailed state. Cookies should hold only a small index or short metadata; use local storage for the larger full record if cookie size limits are reached. Implement versioned serialization, JSON validation, corrupt-data cleanup, and a migration hook.

The divisions page lists title, day count, source (EPUB/manual), updated time, and actions. Cards open a details route/page. Provide delete and duplicate actions. All state is browser-local and that limitation is visible in the UI.

**Acceptance checks**
- Saving a division survives a refresh.
- Corrupt records cannot break the list.
- Saved data has a schema version.
- A division can be reopened and deleted.
- Cookie/local-storage access failures degrade to in-memory operation with a warning.

---

## Step 5.1 — Storage revisions

**Goal**
Reserve a prompt for storage and privacy edge cases found in step 5.0.

**Implementation prompt**
Fix cookie/local-storage defects and add focused tests for blocked storage, quota failures, corrupt entries, stale schema versions, and duplicate IDs. Do not alter EPUB/PDF behavior unless the saved record directly prevents one of those flows.

---

## Step 6.0 — Equitable division calculation

**Goal**
Implement and verify the production division algorithm.

**Implementation prompt**
Replace or extend the step 1.1 spike. For a selected day count, generate ideal page targets evenly across the range from `storyStartPage` through `totalPages`. For each day start, choose a section boundary near that target. Use a least-squares or least-total-deviation score across the resulting page ranges, with strict penalties for chapter splitting. Include tie-breaking and an optional tolerance if no exact section boundary is within a useful range.

Recommended result fields:
- day number;
- start page;
- end page;
- section title;
- EPUB offset if known;
- target page;
- `adjusted` and adjustment reason.

Do not calculate by chapter count alone. Sections are boundaries, not guaranteed day contents. Final day count must match the user selection.

**Acceptance checks**
- Unit tests prove even distribution and no midpoint cuts.
- More days than section starts are handled deterministically.
- Total covered range begins at `storyStartPage` and ends at/near `totalPages`.
- The selected boundaries are documented and reproducible.
- Large and tiny books finish quickly with pure functions.

---

## Step 6.1 — Calculation revisions

**Goal**
Fix algorithm defects discovered in step 6.0.

**Implementation prompt**
Add a fixture for every reported defect. Preserve the least-displacement rule unless the fix changes that explicit contract. Update tests and UI labels to explain any newly visible behavior.

---

## Step 7.0 — Division preview and separator display

**Goal**
Display the generated day plan clearly and allow review before export.

**Implementation prompt**
Build a card or table for all divisions. Each day shows day number, start/end pages, chapter/section title, and whether the algorithm adjusted the target. Clicking a card opens details. Make each row printable in-browser or provide a print preview. Include edit controls for day count and regenerate; the original saved record remains unchanged until save.

**Acceptance checks**
- Every day is visible and no duplicate or missing day exists.
- Details expose target versus actual start.
- Keyboard and pointer navigation both work.
- Mobile and desktop layouts remain usable.
- Invalid stale division data returns to the input page rather than crashing.

---

## Step 7.1 — Selecting divider artwork and transparency

**Goal**
Let the user choose a built-in PNG design or upload a custom PNG for the divider background.

**Implementation prompt**
Create a design selector associated with a division. List built-in PNGs from `gallery/images/*.png` and allow one custom PNG upload as an alternative. Since static browsers cannot enumerate directories, make the build emit a small manifest from the available filenames and copy those images into static output. Keep filenames/IDs stable and show useful names or thumbnails in the gallery.

Render the selected artwork as the divider background using cover-and-crop behavior. Add an accessible 0–100% transparency slider: 0% means fully opaque and is the default; 100% means fully transparent. Apply this setting to the background artwork only. Preview the selected design and percentage immediately. Validate uploaded file type and successful image decoding; report invalid images clearly. Do not send uploads to the server.

The supplied art files are not currently present in the workspace. Do not create substitute artwork. The page/build must have a clear empty-gallery or missing-overlay state and remain usable for development; design export must not pretend to succeed without required artwork.

**Files and responsibilities**
- `gallery/images/*.png` — user-supplied built-in design assets.
- `scripts/build.js` — generate a static gallery manifest and copy available designs.
- `public/scripts/divider-design.js` — select a preset or uploaded PNG, preview it, and update transparency.
- `src/views/` — add accessible gallery, upload, and transparency controls to the division design view.
- `public/styles/` — gallery previews, crop behavior, and reusable range-control styling.

**Acceptance checks**
- Gallery choices come from the generated manifest, not runtime directory access.
- The user can choose a preset or upload a valid PNG, but only one background is active at a time.
- Uploaded non-PNG, malformed, or undecodable files produce visible localized errors.
- Background rendering uses cover/crop and reacts immediately to the transparency slider.
- 0% transparency is fully opaque and selected by default; 100% is fully transparent.
- The overlay and day number are not affected by background transparency.
- No custom file bytes are sent to the HTTP server.

---

## Step 7.2 — Static overlay and dynamic day number

**Goal**
Compose the fixed circular overlay and the current day's number above the selected background.

**Implementation prompt**
Use the supplied `overlay.png` as a fixed image layer centered over each selected background. Place the current division's day number as real, selectable text at the center of the overlay's circular area. Keep both overlay and number fully opaque regardless of the background transparency setting. Reuse this same composition in the interactive preview; do not bake the number into the selected background.

The root `overlay.png` asset is expected to be supplied by the user. Copy it into static output through the build. If it is absent or invalid, show a clear unavailable-overlay state and prevent a success-shaped preview/export.

**Files and responsibilities**
- `overlay.png` — user-supplied fixed overlay image.
- `scripts/build.js` — copy the overlay into static output when supplied.
- `public/scripts/divider-design.js` — render the current day number in the centered overlay layer.
- `src/views/` and `public/styles/` — semantic day-number element and layered positioning.

**Acceptance checks**
- Every day preview shows its own day number centered over the overlay's circle.
- The overlay remains centered and opaque when the background transparency changes.
- The day number remains live text in the browser preview and is not part of the background bitmap.
- Missing/invalid overlay assets are reported; no blank or falsely successful export is presented.
- Composition remains usable at narrow and wide viewport sizes.

---

## Step 7.3 — Persisting custom divider artwork

**Goal**
Reopen a saved division with the same selected design, transparency, and custom uploaded image.

**Implementation prompt**
Persist design settings with the saved division: selected preset ID or a custom-image reference, background transparency, and the design schema version. Store custom image bytes as a `Blob` in browser-local IndexedDB, keyed by saved division ID; store only the reference and small settings in the saved division record. Do not store image bytes in cookies or localStorage.

Restore the preset/custom image and transparency when reopening a division. Clone a custom image when duplicating its division and remove its stored blob when deleting that division. Handle unavailable IndexedDB and quota/transaction errors explicitly: keep the current editing session usable, but do not claim a custom design was saved when its blob was not persisted. Add migration behavior for existing saved-division records with no design settings.

**Files and responsibilities**
- `src/services/storage/divider-image-store.js` — IndexedDB operations for per-division PNG blobs.
- `src/services/storage/` — versioned design settings in saved division records and migration.
- `src/services/storage/` callers — duplicate, reopen, and delete image lifecycle.
- `test/` — persistence, migration, unavailable-storage, quota, and lifecycle coverage.

**Acceptance checks**
- Reopening a saved division restores its preset/custom image and transparency setting.
- A custom PNG remains available after reload without storing its bytes in cookies/localStorage.
- Duplicating a division preserves its custom art without coupling deletion of one copy to another.
- Deleting a division removes its unreferenced custom image blob.
- IndexedDB failures surface an explicit persistence error while leaving current-session preview available.
- Existing records without design metadata still load using a default/empty design state.

---

## Step 8.0 — EPUB separator editing

**Goal**
Add a designed numbered day separator to the user's EPUB.

**Implementation prompt**
Read the original EPUB ZIP. Preserve package metadata and spine order. Insert a separator XHTML document for each selected reading day at the selected EPUB spine location. Update the OPF manifest and spine only through existing package items. Use the shared step 7 design: include the selected PNG background (preset or restored custom upload), the supplied `overlay.png`, and the day number as text centered in the overlay. Apply the saved background transparency in local EPUB CSS; bundle image files in the package and never reference remote assets. If printed page mapping is only estimated, mark separators as planned reading positions rather than absolute physical insertion.

Use the existing calculation result, and keep the original EPUB bytes untouched. Produce a new in-memory ZIP for download.

**Acceptance checks**
- Fixtures verify no original manifest/spine entry is lost.
- Separator IDs are unique and valid.
- Generated XHTML is EPUB 3-compatible.
- Edited EPUB loads in a basic EPUB validator or parser.
- The separator is inserted in deterministic reading order.
- Selected background, transparency, overlay, and dynamic day number match the preview.
- All required PNG resources are present in the EPUB manifest/package and remain local.
- Large EPUB processing remains responsive and errors are reported.

---

## Step 8.1 — EPUB editing revisions

**Goal**
Reserve a prompt for EPUB package compatibility defects.

**Implementation prompt**
Fix malformed manifest/spine updates, namespace issues, XHTML escaping, duplicate IDs, or reading-order errors. Re-run the original EPUB fixture plus a focused regression fixture for each fix.

---

## Step 9.0 — Download edited EPUB

**Goal**
Expose EPUB download only after successful editing.

**Implementation prompt**
Create a browser Blob download flow. Use a safe output filename derived from title and day count, with characters sanitized. Track progress and disable the action while building. Never retain or upload the original EPUB. Add an error state that retains the completed division so the user can retry.

**Acceptance checks**
- Downloaded file uses `.epub` and opens as a ZIP.
- Filename is safe across desktop browsers.
- Original EPUB is not mutated.
- Retry and cancel states work.
- Success does not imply validation beyond the checks performed.

---

## Step 10.0 — Printable card PDF layout

**Goal**
Generate a printable PDF with configurable card size.

**Implementation prompt**
Create a PDF layout adapter that can use a custom physical card size or divide an A4 page into an integer grid selected by the user. Support all card fields: day number, book title, start/end page, and optional section title. Use the same step 7 background image, background transparency, centered `overlay.png`, and dynamic day-number composition as the preview. Use millimetre inputs and make the preview match print dimensions. Provide crop guides or cut lines when useful.

A card design may include the project pink Neobrutalist style, but printing should remain legible and avoid excessive ink. PDF generation happens entirely in the browser and should not require a server. Since PNG is raster artwork, preserve its available resolution and calculate effective DPI at the selected print dimensions. Warn, but do not block, when it falls below 300 DPI; do not silently substitute or omit it.

**Acceptance checks**
- The PDF preview dimensions match the selected card size/grid.
- No card content is clipped.
- Custom size and A4-grid modes are both supported.
- Day count greater than available cards produces additional pages, not overflow.
- The generated PDF contains all visible divisions.
- The PDF composition matches the preview, including crop, background transparency, overlay, and day number.
- Effective image resolution is calculated at print size and produces a warning below 300 DPI without blocking the export.

---

## Step 10.1 — PDF layout revisions

**Goal**
Reserve a prompt for print, sizing, and overflow defects.

**Implementation prompt**
Fix only PDF/card-layout problems found in step 10.0. Add real page-size fixtures and verify content boundaries in generated PDF output or a PDF parser.

---

## Step 11.0 — Download PDF

**Goal**
Finish the PDF export flow.

**Implementation prompt**
Connect generated cards to a Blob download. Name the PDF safely and show progress/success/error states. Offer print and download actions but keep download as the primary export.

**Acceptance checks**
- Downloaded PDF opens and includes all configured cards.
- Print CSS or print preview does not inject browser UI.
- Regeneration invalidates stale downloads.
- Export failures preserve the user's layout settings.

---

## Step 12.0 — End-to-end static build and release review

**Goal**
Verify the complete app and remove unfinished placeholders.

**Implementation prompt**
Run a clean static build, browser smoke tests for manual entry, EPUB parsing/editing, saved divisions and custom artwork persistence, design selection/opacity, card PDF generation, and download actions. Test small, medium, and large fixtures, blocked storage, malformed EPUB files, missing design assets, and unsupported PDF dimensions. Remove dead routes/components and document hosting, build, privacy, browser compatibility, and known limitations.

**Acceptance checks**
- A fresh static build starts through the documented local preview command.
- Every primary flow works without a server.
- No EPUB or personal book content is transmitted or persisted remotely.
- Known unsupported EPUB cases have visible fallback behavior.
- Unit and integration test commands pass.
- PROJECT.md roadmap items are reflected as implemented or explicitly remaining.

---

## Step 13.0 — Deployment documentation

**Goal**
Write a root-level `deploy.md` that lets a maintainer build and deploy Livrent to GitHub Pages or a Linux server.

**Implementation prompt**
Document the prerequisites and clean-checkout commands (`npm ci`, `npm run build`), explain that deployments publish generated `dist/` only, and provide update, verification, and troubleshooting instructions. Use placeholders for account names, domains, and server paths; do not assume project-specific hosting credentials.

For GitHub Pages, provide a copyable GitHub Actions build-and-deploy workflow outline, including the GitHub Pages source setting, required workflow permissions, building the site, and publishing only `dist/`. Limit supported guidance to root-path deployments such as a user/organization site or custom domain. Explicitly warn that repository project sites served under `/repo/` are incompatible with the current root-absolute asset and navigation URLs; do not add base-path support in this step.

For Linux, document both approaches:
1. Recommended: build and copy `dist/` to an Nginx document root, with an example server configuration and notes on DNS/TLS.
2. Alternative: run the existing `scripts/serve.js` using a systemd service, with Node.js/npm prerequisites and update/restart steps. Explain firewall and reverse-proxy/TLS considerations; identify distro-specific commands as examples rather than universal instructions.

State that Livrent is a static browser application: EPUB processing, saved data, and custom art remain client-side and are not uploaded to the hosting server. Do not add a deployment workflow or change hosting code in this documentation step.

**Files and responsibilities**
- `deploy.md` — prerequisites, GitHub Pages Actions guide, both Linux deployment options, verification, troubleshooting, and limitations.
- `PLAN.md` and `PROJECT.md` — keep this step at the end of the roadmap.

**Acceptance checks**
- A maintainer can follow the guide from a clean checkout to a working GitHub Pages root-path deployment using Actions.
- The guide includes an actionable Nginx static deployment and an actionable systemd-managed Node.js alternative, with explicit update and verification steps.
- Required Pages configuration, build commands, artifact directory, and Node service entry point match the project.
- The `/repo/` GitHub Pages project-site limitation is prominently documented.
- The guide uses placeholders for host-specific values, identifies distro-specific commands, and does not imply a backend or remote upload/storage.

## Planning review
- **Problem description:** Good — the project roadmap and design documents clearly identify the main workflows. Rating: 6/6.
- **Ambiguity:** Medium — EPUB-to-physical-page mapping and the server decision needed clarification; the static-app runtime is now resolved. The exact EPUB separator design may remain flexible. Rating: 5/6.
- **Document clarity:** Good — architecture and style constraints are explicit, while the roadmap provides a useful feature order. Rating: 6/6.
