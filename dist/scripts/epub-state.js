const DRAFT_KEY = "livrent.epub-draft";
const PREVIEW_KEY = "livrent.epub-preview";

export function readEpubDraft() {
  let serialized;
  try {
    serialized = sessionStorage.getItem(DRAFT_KEY);
  } catch (error) {
    console.error("Unable to read the EPUB draft from session storage:", error);
    return { error: "storage" };
  }
  if (!serialized) return { draft: null };

  let draft;
  try {
    draft = JSON.parse(serialized);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    console.error("The stored EPUB draft is not valid JSON:", error);
    return { error: "invalid" };
  }
  if (!isValidDraft(draft)) return { error: "invalid" };
  return { draft };
}

export function storeEpubDraft(result, form) {
  const draft = {
    book: result.book,
    headingSource: result.headingSource,
    form: {
      totalPages: form.elements.totalPages.value,
      divisionMode: form.elements.divisionMode.value,
      dayCount: form.elements.dayCount.value,
      pagesPerDayGoal: form.elements.pagesPerDayGoal.value,
    },
  };
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    return true;
  } catch (error) {
    console.error("Unable to preserve the EPUB draft in this tab:", error);
    return false;
  }
}

export function storeEpubPreview(book) {
  try {
    sessionStorage.removeItem("livrent.manual-preview");
    sessionStorage.setItem(PREVIEW_KEY, JSON.stringify({ book }));
    return true;
  } catch (error) {
    console.error("Unable to prepare the EPUB preview in this tab:", error);
    return false;
  }
}

export function clearEpubDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch (error) {
    console.error("Unable to clear the previous EPUB draft:", error);
    return false;
  }
  return true;
}

export function isValidEpubBook(book) {
  return book?.source === "epub" &&
    typeof book.title === "string" &&
    typeof book.author === "string" &&
    Number.isSafeInteger(book.characterCount) &&
    book.characterCount >= 0 &&
    Array.isArray(book.sections) &&
    book.sections.every((section) =>
      typeof section.title === "string" &&
      Number.isSafeInteger(section.epubOffset?.characterOffset) &&
      section.epubOffset.characterOffset >= 0 &&
      section.epubOffset.characterOffset <= book.characterCount &&
      (section.startPage === null || Number.isSafeInteger(section.startPage)),
    );
}

function isValidDraft(draft) {
  return isValidEpubBook(draft?.book) &&
    (draft.form === undefined || typeof draft.form === "object");
}
