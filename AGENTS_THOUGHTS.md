# Development Notes

## Step 1.0 and 1.1 implementation

- The project starts with no existing source code, so a small dependency-light static build was introduced.
- EJS is compiled at build time; the application itself has no server-side routes or runtime.
- The core calculation is represented by plain serializable objects and pure functions.
- Boundary selection uses least absolute distance, then the lower page number as the documented tie-break.

## Instruction review

- Problem description: good; the plan and project documents provided an explicit static-app and feature scope.
- Ambiguity: low; the only minor ambiguity was missing source files, which were resolved by creating the minimal foundation rather than guessing at later features.
- Markdown clarity: good; AGENTS.md, architecture, style, and project guidance were sufficient.
- Review ratings: problem 6/6, ambiguity 6/6, context 6/6.

## Server technology planning update

- The user selected static HTTP hosting only, using Node.js built-in `node:http`; EJS remains build-time only.
- Added step 1.5 before manual-form work and documented a static-only server boundary. The existing preview server is to be audited against that step rather than presumed complete.
- Problem description: clear after the server responsibility and runtime choice were confirmed. Rating: 6/6.
- Ambiguity: resolved; the user specified static hosting and Node.js built-in HTTP. Rating: 6/6.
- Markdown context: sufficient; existing technology and architecture notes did not previously describe the serving process. Rating: 5.5/6.

## Localization roadmap update

- The user requested French/English localization, French as the default, and a language selector whose choice persists in cookies.
- Added step 1.6 while preserving later step IDs, as explicitly selected. The planned browser-side implementation remains compatible with static hosting and build-time EJS.
- Problem description: clear after confirming numbering and cookie lifetime. Rating: 6/6.
- Ambiguity: numbering and persistence duration were clarified; locale scope is the current interface with future steps required to translate new user-facing copy. Rating: 6/6.
- Markdown context: sufficient and consistent after updating the roadmap, technology, architecture, and handoff notes. Rating: 6/6.

## Step 1.5 and 1.6 implementation review

- Hardened the built-in HTTP static server for GET/HEAD, safe path resolution including symlinks, clear status codes, and common asset MIME types. Added French-default/English-selectable browser localization with a one-year cookie.
- Validation: 16 tests pass; static build succeeds; HTTP smoke checks returned 200 for pages/scripts, 404 for missing content, 405 for POST, and 400 for traversal.
- Problem description: detailed acceptance requirements made both steps actionable. Rating: 6/6.
- Ambiguity: none remained; server scope, locale defaults, and cookie lifetime were specified. Rating: 6/6.
- Markdown clarity: plan and technology/architecture guidance were sufficient; the marker and next-step handoff now point to step 2.0. Rating: 6/6.

## Step 1.7 footer review

- Made the page a full-height flex column so short-page content pushes the footer to the viewport bottom; removed the footer panel styling.
- Updated the footer to `Made with ❤️ - by @Myrly` / `Fait avec le ❤️ - par @Myrly` and kept both strings in the locale dictionaries.
- Problem description: clear and directly actionable. Rating: 6/6.
- Ambiguity: the heart representation was clarified as the emoji in both locales. Rating: 6/6.
- Markdown context: sufficient; the plan and localization rules identified the relevant shared footer and translation files. Rating: 6/6.
- Validation: 17 tests pass, build succeeds, and browser checks confirmed the footer sits at viewport bottom, has no background/border, and persists English across navigation.

## Divider artwork roadmap review

- The user selected PNG for gallery artwork, both PDF and EPUB outputs, static overlay, and dynamic day number. Gallery files and `overlay.png` will be supplied later.
- Added planned 7.1–7.3 work for PNG selection/transparency, layered overlay/day number, and IndexedDB persistence of custom art. Existing EPUB/PDF milestones now consume the shared design; the plan records the PNG/PDF tradeoff and a 300-DPI warning threshold for print output.
- Problem description: clear after the export list, PNG/PDF tradeoffs, and image behavior were confirmed. Rating: 6/6.
- Ambiguity: image fit, transparency semantics, asset availability, and custom-image persistence were clarified. Rating: 6/6.
- Markdown context: the existing plan exposed the correct insertion point between separator preview and EPUB/PDF export. Rating: 6/6.

## Deployment documentation roadmap review

- Added final roadmap step 13.0 for a future `deploy.md`, covering GitHub Pages Actions and both Nginx and Node.js service deployments on Linux. Added the missing step 12.0 release-review entry to `PROJECT.md`; `NEXT.md` remains on step 2.0.
- Problem description: clear, with the hosting platforms and deployment alternatives specified. Rating: 6/6.
- Ambiguity: Linux hosting and Pages deployment methods were clarified; Pages documentation is root-path only because the current templates use root-absolute URLs. Rating: 6/6.
- Markdown context: project build, serving scripts, and hosting boundaries provided enough information to define a bounded roadmap step. Rating: 6/6.

## Step 2.0 manual workflow review

- Implemented the localized manual book/section form, explicit duplicate-start confirmation, keyboard row actions, shared input parsing, and a client-side division preview. The preview handoff uses only same-tab `sessionStorage`; no book data is sent to the server.
- Problem description: the plan specified required fields, validation, keyboard flow, and the preview outcome. Rating: 6/6.
- Ambiguity: the exact preview handoff was unspecified; a transient same-tab storage handoff was chosen to preserve static hosting and avoid putting book details in the URL. Rating: 5.5/6.
- Markdown context: AGENTS.md, architecture, style, technology, plan, and handoff files provided sufficient implementation boundaries. Rating: 6/6.
- Validation: 22 tests pass, the static build succeeds, and browser checks covered duplicate confirmation, page calculation, keyboard navigation, section reordering/removal, range errors, and locale switching.

## Step 2.1 defect trace

- Reproduction: calculate a 100-page, 4-day manual book with sections starting on pages 10, 35, 60, and 85. The first day currently starts on page 10, leaving pages 1–9 out of every division.
- Expected behavior: when no section starts on page 1, the first day still begins at page 1; represent the book's implicit beginning as a calculation boundary.
- Files to change: `src/services/calculation/division.js` and `test/calculation.test.js`.
- Resolution: prepend a synthetic page-1 "Beginning" boundary only when normalized sections do not already start at page 1. The regression test now verifies that the first day's range begins at page 1 and ends before the next selected boundary.
- Problem description: step 2.1 clearly limits work to manual-form defects and direct calculation integration. Rating: 6/6.
- Ambiguity: none remained after reproducing that the initial pages were omitted. Rating: 6/6.
- Markdown context: the plan's regression requirements and current calculation notes identified the precise files and expected behavior. Rating: 6/6.
- Validation: the new test failed before the fix (first start was page 10), then passed; the build succeeds and all 23 tests pass.

## Step 2.2 story start and last-page wording

- The user specified one checkbox on the first entered chapter, checked by default, with its checked state following the new first row after reordering. The field label should be “Last page of the story”; `totalPages` remains the internal final-page property.
- Added `storyStartPage` handling to manual parsing and division targets. Earlier section boundaries are excluded only when the checkbox selects a later story start; the default page-1 behavior remains for unselected starts and other model consumers.
- The UI creates one checkbox control and moves it into the first populated row, preserving its state. Added French and English checkbox, last-page, and synthetic story-start preview strings.
- Focused tests cover start target ranges, page-1 compatibility, selected and unselected manual starts, ignored earlier sections, and invalid start bounds.
- Problem description: clear and specific, including default state, reordering behavior, and the visible label change. Rating: 6/6.
- Ambiguity: none remained; the user confirmed the default checked state and state-carry behavior in the preceding interaction. Rating: 6/6.
- Markdown context: AGENTS.md, architecture, project roadmap, plan, style, technology, and next-step notes provided enough context. Rating: 6/6.
- Validation: 28 tests pass, the static build succeeds, and browser checks confirmed one default-checked checkbox follows row reordering; checked and unchecked behavior plus French preview copy render as expected.

## Step 2.3 responsive width and checkbox styling

- Increased the centered responsive content maximum from 960px to 1200px while retaining the existing 92vw narrow-screen limit.
- Added a reusable `.brutal-checkbox` style with a square ink border, pink checked state and mark, and visible focus ring. Applied it to story-start and duplicate-confirmation controls; the story-start label now has a pale panel and offset ink shadow.
- Added the step to the plan, project roadmap, and style guide. `NEXT.md` remains on step 3.0.
- Problem description: clear about using more available width and applying the established neobrutalist design. Rating: 6/6.
- Ambiguity: no blocking ambiguity; 1200px was selected as a responsive maximum, with the existing 92vw behavior retained. Rating: 5.5/6.
- Markdown context: AGENTS.md, architecture, project roadmap, plan, style, technology, and next-step notes provided sufficient constraints. Rating: 6/6.
- Validation: 28 tests pass and the build succeeds. Browser checks measured 1200px content at desktop and 359px at a 390px viewport with no horizontal overflow; both checkbox controls retain their duplicate-confirmation workflow.

## Step 2.4 sparse sections and pages-per-day goal

- The user selected a strict 65% section-count threshold, allowed balanced page starts inside chapters when below it, chose nearest-integer conversion for pages/day, and kept fixed day count as the default.
- Added the fallback to shared division calculation. Valid real section starts remain preferred within 20% of the ideal day interval; otherwise the even page target is used, with page order and final coverage preserved.
- Added an alternate manual form mode for an integer pages-per-day goal (default 30). It derives day count from the inclusive `storyStartPage`–`totalPages` range and retains `Book.pagesPerDayGoal` for localized preview output.
- Updated `AGENTS.md`, `STYLE.md`, `ARCHITECTURE.md`, `PROJECT.md`, `PLAN.md`, and `NEXT.md` so future agents preserve the responsive/neobrutalist UI conventions and reuse the goal metadata and sparse-boundary behavior.
- Problem description: clear after the cutoff, fallback strategy, rounding, and default mode were confirmed. Rating: 6/6.
- Ambiguity: initially the threshold, within-chapter behavior, goal rounding, and default mode needed decisions; the user resolved each through the clarification form. Rating: 6/6.
- Markdown context: project instructions, architecture, style, plan, and next-step notes provided sufficient implementation boundaries. Rating: 6/6.
- Validation: 32 tests pass, build succeeds, and browser checks confirmed both input modes, a 30-page goal deriving 3 days for a 91-page story range, page-based starts, and localized goal summary.
