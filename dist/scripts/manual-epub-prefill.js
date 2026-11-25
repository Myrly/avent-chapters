import { readEpubDraft } from "./epub-state.js";

export function prefillManualFromEpub(form) {
  if (new URLSearchParams(window.location.search).get("from") !== "epub") return;
  const result = readEpubDraft();
  if (!result.draft) return;
  const { book } = result.draft;
  if (book.title) form.elements.title.value = book.title;
  if (book.author) form.elements.author.value = book.author;
}
