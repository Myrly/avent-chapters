export function createDivisionDay({
  day,
  startPage,
  endPage,
  sectionTitle,
  targetPage,
  adjusted = false,
  epubOffset,
}) {
  return {
    day,
    startPage,
    endPage,
    sectionTitle,
    targetPage,
    adjusted,
    ...(epubOffset === undefined ? {} : { epubOffset }),
  };
}

export function createSavedDivision(book, days, savedAt = new Date().toISOString()) {
  return {
    version: 1,
    id: `division-${Date.now()}`,
    book,
    days,
    savedAt,
  };
}
