import { createDivisionDay } from "../../data/models/division.js";
import { shouldUsePageSplits } from "../calculation/sparse-boundaries.js";
import { mapCharacterToPage, pageOverrideError } from "./page-map.js";
import {
  compressOffset,
  ignoredRanges,
  sectionAtOffset,
  sectionsWithReadingOffsets,
  expandOffset,
} from "./character-offsets.js";
import { chooseDayStarts } from "./day-targets.js";

export function calculateEpubDivision(book) {
  const sections = sectionsWithReadingOffsets(book.sections, book.characterCount);
  const ranges = ignoredRanges(sections, book.characterCount);
  const visible = sections
    .filter((section) => !section.ignored)
    .map((section) => ({
      ...section,
      readingOffset: compressOffset(section.characterOffset, ranges),
    }));
  const totalReadingCharacters = book.characterCount -
    ranges.reduce((sum, range) => sum + range.end - range.start, 0);
  validateInputs(book, book.dayCount);
  const pageError = pageOverrideError(book);
  if (pageError) throw new RangeError(pageError);
  if (!visible.length || totalReadingCharacters <= 0) return [];

  const uniqueBoundaries = [...new Set(visible.map((section) => section.readingOffset))];
  const useCharacterSplits = shouldUsePageSplits(uniqueBoundaries.length, book.dayCount);
  const tolerance = Math.max(1, Math.floor(totalReadingCharacters / book.dayCount * 0.2));
  const starts = chooseDayStarts(
    visible,
    ranges,
    book.dayCount,
    totalReadingCharacters,
    useCharacterSplits,
    tolerance,
  );
  const mappedStarts = starts.map((start) =>
    mapCharacterToPage(book, start.rawOffset),
  );
  return starts.map((start, index) => {
    const mapped = mappedStarts[index];
    const nextPage = mappedStarts[index + 1]?.page;
    return {
      ...createDivisionDay({
        day: index + 1,
        startPage: mapped.page,
        endPage: mapped.page === null
          ? null
          : index === starts.length - 1
            ? book.totalPages
            : Math.max(mapped.page, nextPage - 1),
        sectionTitle: sectionAtOffset(visible, start.readingOffset)?.title || "",
        targetPage: mapCharacterToPage(book, expandOffset(start.targetOffset, ranges)).page,
        adjusted: start.rawOffset !== expandOffset(start.targetOffset, ranges),
        epubOffset: { characterOffset: start.rawOffset },
      }),
      startPageIsExact: mapped.exact,
      startCharacterOffset: start.rawOffset,
    };
  });
}

function validateInputs(book, dayCount) {
  if (!Number.isSafeInteger(dayCount) || dayCount < 1) {
    throw new RangeError("EPUB day count must be a positive integer");
  }
  if (book.totalPages !== null && (!Number.isSafeInteger(book.totalPages) || book.totalPages < 1)) {
    throw new RangeError("EPUB page count must be a positive integer");
  }
}
