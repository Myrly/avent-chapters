import { calculateBookDivision } from "./domain/services/calculation/book-division.js";
import { messages } from "./i18n-messages.js";

const summary = document.querySelector("[data-preview-summary]");
if (summary) loadPreview();

function loadPreview() {
  let serialized;
  try {
    serialized = sessionStorage.getItem("livrent.epub-preview") ||
      sessionStorage.getItem("livrent.manual-preview");
  } catch (error) {
    console.error("Unable to read the manual preview from session storage:", error);
    return showError("preview.storage_error");
  }
  if (!serialized) return showError("preview.no_data");

  let payload;
  try {
    payload = JSON.parse(serialized);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    console.error("The stored manual preview is not valid JSON:", error);
    return showError("preview.invalid_data");
  }
  if (!payload?.book || !Array.isArray(payload.book.sections)) {
    return showError("preview.invalid_data");
  }

  let days;
  try {
    days = calculateBookDivision(payload.book);
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    console.error("The stored manual book cannot be divided:", error);
    return showError("preview.invalid_data");
  }
  renderPreview(payload, days);
  document.querySelector("[data-language-selector]")?.addEventListener("change", () =>
    renderPreview(payload, days),
  );
}

function renderPreview(payload, days) {
  const text = currentMessages();
  const book = payload.book;
  const isEpub = book.source === "epub";
  const summaryKey = isEpub
    ? "preview.epub_summary"
    : book.pagesPerDayGoal
    ? "preview.book_summary_pages_goal"
    : "preview.book_summary";
  summary.textContent = text[summaryKey]
    .replace("{title}", book.title)
    .replace("{author}", book.author || text["preview.no_author"])
    .replace("{edition}", book.edition || text["preview.no_edition"])
    .replace("{pages}", Number.isSafeInteger(book.totalPages)
      ? String(book.totalPages)
      : text["preview.no_print_pages"])
    .replace("{days}", String(book.dayCount))
    .replace("{goal}", String(book.pagesPerDayGoal || ""));
  renderSourceNote(book, isEpub, text);
  const back = document.querySelector("[data-preview-back]");
  back.href = isEpub ? "/epub.html" : "/manual.html";
  back.textContent = text[isEpub ? "preview.back_epub" : "preview.back"];
  const list = document.querySelector("[data-preview-days]");
  list.replaceChildren();
  for (const day of days) {
    const item = document.createElement("li");
    item.textContent = isEpub
      ? formatEpubDay(day, text)
      : formatManualDay(day, book, text);
    list.append(item);
  }
  document.querySelector("[data-preview-results]").hidden = false;
  if (payload.duplicatePages?.length) {
    const note = document.querySelector("[data-preview-duplicates]");
    note.textContent = text["preview.duplicates"]
      .replace("{pages}", payload.duplicatePages.join(", "));
    note.hidden = false;
  }
}

function formatEpubDay(day, text) {
  const key = day.startPage === null
    ? "preview.epub_day_text"
    : day.startPageIsExact
      ? "preview.epub_day_exact"
      : "preview.epub_day_estimated";
  return text[key]
    .replace("{day}", String(day.day))
    .replace("{page}", String(day.startPage ?? ""))
    .replace("{section}", day.sectionTitle || text["preview.generic_section"]);
}

function formatManualDay(day, book, text) {
  const sectionFallback = day.startPage === (book.storyStartPage || 1)
    ? text["preview.story_start"]
    : text["preview.generic_section"];
  return text["preview.day"]
    .replace("{day}", String(day.day))
    .replace("{start}", String(day.startPage))
    .replace("{end}", String(day.endPage))
    .replace("{section}", day.sectionTitle || sectionFallback);
}

function renderSourceNote(book, isEpub, text) {
  const note = document.querySelector("[data-preview-note]");
  note.hidden = !isEpub;
  if (!isEpub) return;
  note.textContent = Number.isSafeInteger(book.totalPages)
    ? text["preview.epub_pages_note"]
    : text["preview.epub_text_note"];
}

function showError(key) {
  const error = document.querySelector("[data-preview-error]");
  error.dataset.i18n = key;
  error.textContent = currentMessages()[key];
  error.hidden = false;
}

function currentMessages() {
  return messages[document.documentElement.lang] || messages.fr;
}
