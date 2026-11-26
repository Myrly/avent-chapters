This file contains a description of the project for context, as well as a map of the steps that will occur in order to achieve the project.

## Project explanation 
This project aims to let anyone divide any book into however many days they wish (default 24), to help them have a daily routine, or christmas advent calendar. The calculation is done using an epub file's headings, or manually inputted chapter starts. In manual mode, the last page of the story is required; EPUB mode can estimate reading positions by text length and optionally map them to an entered print-edition page count. The app then outputs on which page to start every day, aka on which page to put some marker if you wish to replicate advent novels at best. The app also outputs a new epub file with the dividers added. 

## Project roadmap
01. Set up technos, quite short in this project. Including the icon to use in browser's tab. ('./icon.png', move, rename, then remove this paranthesis, if needed)
01.5. Serve the generated static site over HTTP with Node.js built-in `node:http`, without introducing a dynamic application backend.
01.6. Localize the interface in French and English, default to French, and persist the selected language in a one-year cookie.
02. Implement the manual book and chapter entry form with title, edition, last story page, day count, keyboard-friendly section rows, validation, and a division preview.
02.2. Let manual users select whether the story begins on the first populated chapter page, and calculate the division from that page when selected.
02.3. Widen the responsive page layout and style all checkboxes consistently with the site's neobrutalist visual system.
02.4. Support sparse-section page splits when section starts are below 65% of requested days, and allow setting an approximate pages-per-day goal instead of a fixed day count.
03. Parse EPUB metadata and normalize its navigation and section structure to the shared book/section model.
03.1. Let EPUB users provide an optional print-page total, balance days by readable characters when absent, and ignore/restore detected sections without losing their physical positions.
04. Integrate EPUB and manual workflows into the shared preview; allow users to edit, ignore/restore, or remove parsed sections, optionally correct each section's printed start page, and preserve same-tab EPUB draft progress without storing the uploaded file.
04.1. Show average, median, maximum, and minimum pages per day in the shared preview; reveal corresponding median/max/min days on hover/focus and require EPUB print-page total for page statistics.
05. Automatically save reading plans locally, list and reopen them, and offer duplicate and confirmed-delete actions. Full records stay in localStorage; a small cookie holds only opaque IDs.
05.1. Preserve duplicate-ID plans, isolate temporary fallback copies from permanent storage, and test corrupt data, unsupported versions, blocked storage, quotas, and cookie failures.
06. Implement core calculation of divisions, making sure to have the most equitable pages per day, but never stopping outside of a chapter.
07. Display the separators
07.1. Let users choose a built-in PNG design from `gallery/images/*.png` or upload a custom PNG, preview it with cover/crop, and set its transparency (0% by default).
07.2. Center the supplied `overlay.png` above the design and render each day number as text inside its circular area.
07.3. Persist custom PNGs and design settings with saved divisions using browser-local IndexedDB.
08. Implement EPUB editing that adds a designed numbered day separator using the selected PNG background, fixed overlay, and dynamic day number.
09. Button to Download edited epub. 
10. Implement the generation of a PDF that can be printed by the end user to get cards for their book, with any custom size. Reuse the selected background, transparency, overlay, and dynamic day number. (size can be configured by setting either the size of the book, or, divide A4 pages in however many the user wants, if they don't want these, they should not be blocked)
11. Button to Download the pdf
12. Run an end-to-end static build and release review; verify primary flows, tests, privacy boundaries, and remaining limitations.
13. Write `deploy.md` with deployment instructions for GitHub Pages using Actions and Linux servers using Nginx or the existing Node.js static server. GitHub Pages guidance covers root-path sites only; repository project sites under `/repo/` are not currently supported.
