This file lists the project's selected technologies and their expected use. Ask before adding a new technology category or dependency.

- **HTML and vanilla CSS** — static user interface and styling.
- **Vanilla browser JavaScript** — client-side French/English localization, interactive behavior, and EPUB parsing through native `File`, `DOMParser`, and `DecompressionStream` APIs; no ZIP/XML dependency is added.
- **Browser `sessionStorage`** — temporary same-tab transfer of validated manual preview data and EPUB draft/preview state; EPUB drafts contain parsed data, never the uploaded file. It is not long-term saved-division persistence.
- **Browser `localStorage` and cookies** — versioned saved reading-plan records in localStorage, with a compact cookie index containing opaque IDs only. No EPUB bytes or book metadata are stored in cookies.
- **EJS** — build-time templates compiled into static HTML; not rendered by the server at request time.
- **Node.js built-in `node:http`** — serves the generated `dist/` directory over HTTP. No web framework or application backend is used.
- **PNG** — built-in and user-uploaded divider artwork, composited in the browser and embedded in generated EPUB/PDF output.
- **IndexedDB** — browser-local storage for custom divider image blobs; cookies and localStorage must not contain image bytes.

Localization uses in-project translation dictionaries and the browser's `lang` cookie; do not add a localization library unless a future requirement justifies it.

The site must also remain deployable as static files on a host that does not run Node.js.