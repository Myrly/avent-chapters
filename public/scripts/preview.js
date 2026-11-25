import { calculateDivision } from "./domain/services/calculation/division.js";
import { messages } from "./i18n-messages.js";

const summary = document.querySelector("[data-preview-summary]");
if (summary) loadPreview();

function loadPreview() {
  let serialized;
  try {
    serialized = sessionStorage.getItem("livrent.manual-preview");
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
    days = calculateDivision(payload.book);
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
  const summaryKey = book.pagesPerDayGoal
    ? "preview.book_summary_pages_goal"
    : "preview.book_summary";
  summary.textContent = text[summaryKey]
    .replace("{title}", book.title)
    .replace("{edition}", book.edition || text["preview.no_edition"])
    .replace("{pages}", String(book.totalPages))
    .replace("{days}", String(book.dayCount))
    .replace("{goal}", String(book.pagesPerDayGoal || ""));
  const list = document.querySelector("[data-preview-days]");
  list.replaceChildren();
  for (const day of days) {
    const item = document.createElement("li");
    const sectionFallback = day.startPage === (book.storyStartPage || 1)
      ? text["preview.story_start"]
      : text["preview.generic_section"];
    item.textContent = text["preview.day"]
      .replace("{day}", String(day.day))
      .replace("{start}", String(day.startPage))
      .replace("{end}", String(day.endPage))
      .replace("{section}", day.sectionTitle || sectionFallback);
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

function showError(key) {
  const error = document.querySelector("[data-preview-error]");
  error.dataset.i18n = key;
  error.textContent = currentMessages()[key];
  error.hidden = false;
}

function currentMessages() {
  return messages[document.documentElement.lang] || messages.fr;
}
