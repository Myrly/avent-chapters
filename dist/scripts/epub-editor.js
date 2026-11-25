import { pageOverrideError } from "./domain/services/epub/page-map.js";

export function updateSection(book, event) {
  const field = event.target.dataset.sectionTitle !== undefined
    ? "title"
    : event.target.dataset.sectionPage !== undefined
      ? "page"
      : "";
  if (!field) return { handled: false };
  const index = Number(event.target.dataset[
    field === "title" ? "sectionTitle" : "sectionPage"
  ]);
  const section = book.sections[index];
  if (!section) return { handled: true, errorKey: "epub.error.invalidPlan" };

  if (field === "title") {
    section.title = event.target.value;
    return { handled: true, errorKey: "" };
  }
  return {
    handled: true,
    errorKey: updatePageOverride(book, section, event.target.value),
  };
}

export function removeSection(book, index) {
  if (!Number.isInteger(index) || index < 0 || index >= book.sections.length) return false;
  book.sections.splice(index, 1);
  return true;
}

function updatePageOverride(book, section, value) {
  const text = String(value).trim();
  if (!text) {
    section.startPage = null;
    return pageOverrideError(book) || "";
  }
  if (!/^\d+$/.test(text)) return "epub.error.pageOverrideInvalid";
  const page = Number(text);
  if (!Number.isSafeInteger(page) || page < 1 || page > book.totalPages) {
    return "epub.error.pageOverrideInvalid";
  }
  section.startPage = page;
  return pageOverrideError(book) || "";
}
