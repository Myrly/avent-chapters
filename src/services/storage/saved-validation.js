import { calculateBookDivision } from "../calculation/book-division.js";

export function isValidSavedRecord(record) {
  const book = record?.book;
  if (record?.version !== 1 || typeof record.id !== "string" ||
      !/^[a-zA-Z0-9-]{1,80}$/.test(record.id) ||
      typeof record.updatedAt !== "string" || !Number.isFinite(Date.parse(record.updatedAt)) ||
      !book || !["manual", "epub"].includes(book.source) ||
      typeof book.title !== "string" || !book.title.trim() ||
      typeof book.author !== "string" || typeof book.edition !== "string" ||
      !Number.isSafeInteger(book.dayCount) || book.dayCount < 1 ||
      !Array.isArray(book.sections)) return false;
  if (!book.sections.every((section) => section && typeof section.title === "string" &&
      (section.startPage === null || Number.isSafeInteger(section.startPage)) &&
      (book.source !== "epub" || (Number.isSafeInteger(section.epubOffset?.characterOffset) &&
        section.epubOffset.characterOffset >= 0 &&
        section.epubOffset.characterOffset <= book.characterCount)))) return false;
  if (book.source === "epub" && (!Number.isSafeInteger(book.characterCount) ||
      book.characterCount < 1 ||
      (book.totalPages !== null && (!Number.isSafeInteger(book.totalPages) || book.totalPages < 1)))) {
    return false;
  }
  try {
    return calculateBookDivision(book).length === book.dayCount;
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return false;
  }
}

export function migrateSavedData(data) {
  if (data?.version === 1 && Array.isArray(data.records)) return data;
  return null;
}
