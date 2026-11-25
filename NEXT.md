# Next Implementation Step

Proceed to step 4.0 in PLAN.md: integrate EPUB and manual workflows into the shared preview.

Step 3.0 parses EPUB 3 nav, EPUB 2 NCX, or spine XHTML headings into shared models. Step 3.1 adds cumulative character offsets, optional print-page estimates, a 24-day default, the shared pages-per-day goal, and reversible ignored-section state.

Keep the uploaded `File` browser-local. Parsed EPUB sections retain `startPage: null`; `epubOffset.characterOffset` is the raw whole-book position, including ignored content, while day targets exclude ignored text. Never label character-derived print pages as exact.

For step 4.0, allow correction/removal of detected sections and merge EPUB/manual data into the shared preview. Preserve `Book.storyStartPage`, `Book.pagesPerDayGoal`, and the day count derived by the manual workflow. Keep the static-only server boundary, localize all new copy in French and English, and follow `AGENTS.md` / `STYLE.md`.
