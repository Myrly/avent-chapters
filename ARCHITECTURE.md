This file contains guidelines for what structure to apply to our simple web app, and which file-tree and architecture to follow. 

1. Divide code as much as possible. No file should be longer than 100 lines (ideally, can go slightly over if it's to finish just a function, but absolute max 120). 
2. Every function should achieve one single thing. Divide in as many functions as needed. 
3. Make every function and feature as reusable as possible. 
4. Make as many files as needed. 
5. Structure properly the file tree, with a subfolder for data models, one for services, one for components, one for auxiliary stuff, etc.

## Build and serving boundary

- EJS templates are compiled during `npm run build`; the output in `dist/` is static HTML, CSS, and assets.
- `scripts/serve.js` uses Node.js built-in `node:http` to serve files from `dist/` for local hosting. It is not an application backend.
- The server must not add API, upload, or book-processing routes. EPUB and PDF work stays in the browser.
- Manual book entry and division preview run in the browser. The build copies the shared models, manual-input parser, and calculation modules into static scripts so the UI reuses the tested domain logic. `sessionStorage` is only a same-tab handoff to the preview page; it is not saved-division persistence.
- EPUB files are read locally by `src/services/epub/`: the ZIP reader supports stored/deflate entries, verifies CRCs, rejects encrypted/ZIP64 archives, and caps extracted text at 10 MiB per entry and 50 MiB total. XML parsing uses the browser's native `DOMParser`; nothing is uploaded.
- EPUB-derived sections keep `startPage: null`; `epubOffset` stores spine-relative position, optional fragment, and cumulative character offset. Never treat section order or offsets as printed page numbers.
- EPUB mode optionally maps raw character offsets to an entered print-edition page count as explicitly estimated markers. Without a page count, use readable-character weighting and show no page numbers. Ignored section text is omitted from day-balance weights while raw offsets retain those characters for page estimation.
- Exact EPUB print-page corrections are per-section `Section.startPage` overrides. Validate that they are positive, within the print-page total, and ordered by reading position; blank overrides remain estimates interpolated between exact anchors. Keep computed estimates out of the parsed model.
- `src/services/calculation/book-division.js` dispatches manual and EPUB books to one preview-day contract. The preview renders source-specific page/character markers without changing the existing manual page-range behavior.
- `public/scripts/epub-state.js` uses `livrent.epub-draft` and `livrent.epub-preview` in same-tab `sessionStorage`. The draft stores parsed metadata, editable sections, page overrides, and form goals, but never the uploaded `File` or EPUB bytes. This is navigation/refresh recovery, not step 5.0 saved-division persistence.
- If an EPUB has no usable sections, or all sections are removed, manual entry is offered in the same tab with the parsed title/author prefilled. The manual form's optional author is part of the shared preview summary.
- EPUB mode uses the shared fixed-day default of 24. Pages-per-day mode is available only with a valid print-page count and reuses `deriveDayCountFromPages()`.
- `Book.storyStartPage` defaults to page 1. Manual entry can set it to the first populated section page; calculation targets and included section boundaries then begin there while `totalPages` remains the last story page.
- `Book.pagesPerDayGoal` is optional metadata. Manual users can choose a fixed day count or an approximate pages-per-day goal; the latter derives `dayCount` by rounding the inclusive story-page range divided by the goal to the nearest integer, with a minimum of one day.
- When fewer than 65% as many distinct real section starts as requested days exist, division uses evenly spaced page starts and prefers a real section boundary only when it is within 20% of the ideal day-page interval. Otherwise chapter boundaries remain mandatory. Count valid section starts in the story range, including the first real section; do not count a synthetic story-start boundary.
- EPUB character-weighted division applies the same 65% / 20% sparse-boundary policy in readable-character coordinates; excluded ignored text is removed before selecting targets.
- Keep the generated `dist/` output deployable to any compatible static hosting service.
- Interface localization is browser-side, with French as the default and English as the second locale. A one-year `lang` cookie stores the selected locale; translations must not require a server request.
- New user-facing strings introduced by later steps must be represented in both French and English.
- Divider rendering is a browser-side layer composition: selected PNG background (cover/crop and adjustable transparency), centered `overlay.png`, then a dynamic text day number.
- Built-in artwork is supplied under `gallery/images/*.png`; the static build must emit a manifest because browser code cannot list a server directory. The supplied root `overlay.png` is copied into static assets.
- Custom uploaded PNG blobs are stored locally in IndexedDB and referenced by saved-division records; never send artwork to the server or store image bytes in cookies/localStorage.