# Next Implementation Step

Proceed to step 3.0 in PLAN.md: parse EPUB metadata and normalize its navigation and section structure.

Use the shared `Book` and `Section` models and `normalizeSections()` helper. Keep parsing in the browser, preserve the static-only server boundary, and add every new user-facing string to both French and English dictionaries.

Preserve `Book.storyStartPage`, optional `Book.pagesPerDayGoal`, and the `dayCount` derived by the manual workflow. Reuse the shared sparse-boundary fallback from `calculateDivision()` when physical page ranges are available. For UI work, follow `AGENTS.md` and `STYLE.md`: use the responsive 1200px main width, `.brutal-checkbox`, palette, strong borders, visible focus, and offset shadows.
