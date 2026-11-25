# Next Implementation Step

Proceed to step 5.0 in PLAN.md: implement browser-local saved divisions and a list/details experience.

Step 3.0 parses EPUB 3 nav, EPUB 2 NCX, or spine XHTML headings into shared models. Step 3.1 adds cumulative character offsets, optional print-page estimates, a 24-day default, the shared pages-per-day goal, and reversible ignored-section state.

Keep the uploaded `File` browser-local. Parsed EPUB sections retain `startPage: null`; `epubOffset.characterOffset` is the raw whole-book position, including ignored content, while day targets exclude ignored text. Never label character-derived print pages as exact.

Steps 4.0 and 4.1 are complete. Manual and EPUB books now use the same preview route. EPUB users can edit titles, ignore/restore or remove sections, enter an optional print-page total, and apply ordered exact printed-page overrides per section; blank overrides remain estimated. Same-tab refresh/back recovery stores parsed draft data in `sessionStorage` without storing the uploaded `File`.

The shared preview includes average, median, maximum, and minimum pages/day. Median/max/min expose all matching day numbers on hover and keyboard focus. EPUB statistics use estimated page ranges when a print-page total exists; otherwise the box is hidden and the preview explains why.

Step 5.0 owns long-term saved-division persistence, distinct from the step 4.0 `livrent.epub-draft` and `livrent.epub-preview` handoffs. Keep saved data local, validate/version records, and provide list, open, delete, and duplicate behavior.

Preserve `Book.storyStartPage` and `Book.pagesPerDayGoal`, manual author metadata, and the shared preview day shape. Keep browser-local processing and the static-only server boundary; localize new copy in French and English and follow `AGENTS.md` / `STYLE.md`.
