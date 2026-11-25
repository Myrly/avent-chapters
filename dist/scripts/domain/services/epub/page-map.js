export function pageOverrideError(book) {
  if (book.totalPages === null || book.totalPages === undefined) return null;
  if (!Number.isSafeInteger(book.totalPages) || book.totalPages < 1) {
    return "epub.error.totalPagesInvalid";
  }
  const overrides = book.sections
    .filter((section) => section.startPage !== null && section.startPage !== undefined)
    .map((section) => ({
      offset: section.epubOffset?.characterOffset,
      page: section.startPage,
    }))
    .sort((left, right) => left.offset - right.offset);
  let previous = null;
  for (const override of overrides) {
    if (!Number.isSafeInteger(override.offset) || override.offset < 0 ||
      override.offset > book.characterCount ||
      !Number.isSafeInteger(override.page) || override.page < 1 ||
      override.page > book.totalPages) {
      return "epub.error.pageOverrideInvalid";
    }
    if (previous && (override.offset < previous.offset ||
      override.page < previous.page ||
      (override.offset === previous.offset && override.page !== previous.page))) {
      return "epub.error.pageOverrideOrder";
    }
    previous = override;
  }
  return null;
}

export function mapCharacterToPage(book, offset) {
  if (book.totalPages === null || book.totalPages === undefined) {
    return { page: null, exact: false };
  }
  const errorKey = pageOverrideError(book);
  if (errorKey) throw new RangeError(errorKey);
  const totalCharacters = book.characterCount;
  if (!Number.isSafeInteger(totalCharacters) || totalCharacters < 0 ||
    !Number.isFinite(offset) || offset < 0 || offset > totalCharacters) {
    throw new RangeError("EPUB character position is outside the book");
  }
  if (!totalCharacters) return { page: 1, exact: false };

  const anchors = createAnchors(book);
  for (let index = 1; index < anchors.length; index += 1) {
    const right = anchors[index];
    if (offset > right.offset) continue;
    const left = anchors[index - 1];
    const ratio = (offset - left.offset) / (right.offset - left.offset);
    const mapped = left.page + ratio * (right.page - left.page);
    return {
      page: Math.min(book.totalPages, Math.max(1, Math.floor(mapped))),
      exact: offset === left.offset && left.exact ||
        offset === right.offset && right.exact,
    };
  }
  return { page: book.totalPages, exact: false };
}

function createAnchors(book) {
  const anchors = new Map([
    [0, { offset: 0, page: 1, exact: false }],
    [book.characterCount, {
      offset: book.characterCount,
      page: book.totalPages + 1,
      exact: false,
    }],
  ]);
  for (const section of book.sections) {
    if (section.startPage === null || section.startPage === undefined) continue;
    const offset = section.epubOffset.characterOffset;
    anchors.set(offset, { offset, page: section.startPage, exact: true });
  }
  return [...anchors.values()].sort((left, right) => left.offset - right.offset);
}
