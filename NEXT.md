# Next Implementation Step

Proceed to step 5.1 in PLAN.md: review and fix storage/privacy edge cases.

Step 3.0 parses EPUB 3 nav, EPUB 2 NCX, or spine XHTML headings into shared models. Step 3.1 adds cumulative character offsets, optional print-page estimates, a 24-day default, the shared pages-per-day goal, and reversible ignored-section state.

Keep the uploaded `File` browser-local. Parsed EPUB sections retain `startPage: null`; `epubOffset.characterOffset` is the raw whole-book position, including ignored content, while day targets exclude ignored text. Never label character-derived print pages as exact.

Steps 4.0 and 4.1 are complete. Manual and EPUB books now use the same preview route. EPUB users can edit titles, ignore/restore or remove sections, enter an optional print-page total, and apply ordered exact printed-page overrides per section; blank overrides remain estimated. Same-tab refresh/back recovery stores parsed draft data in `sessionStorage` without storing the uploaded `File`.

The shared preview includes average, median, maximum, and minimum pages/day. Median/max/min expose all matching day numbers on hover and keyboard focus. EPUB statistics use estimated page ranges when a print-page total exists; otherwise the box is hidden and the preview explains why.

Step 5.0 automatically saves calculated previews to versioned localStorage records, indexed by opaque IDs in a cookie. The list supports opening, duplicating, and confirmed deletion; it warns when persistent storage is unavailable. The temporary handoffs remain separate. Session fallback survives same-tab navigation; memory-only fallback cannot survive navigation or refresh.

For step 5.1, follow the plan's targeted storage/privacy edge cases. Keep unsupported versions intact and avoid exposing book details or EPUB bytes in cookies.

Preserve `Book.storyStartPage` and `Book.pagesPerDayGoal`, manual author metadata, and the shared preview day shape. Keep browser-local processing and the static-only server boundary; localize new copy in French and English and follow `AGENTS.md` / `STYLE.md`.
