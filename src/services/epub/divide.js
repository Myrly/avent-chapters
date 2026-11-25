import { shouldUsePageSplits } from "../calculation/sparse-boundaries.js";

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
  return starts.map((start, index) => ({
    day: index + 1,
    startPage: pageAtCharacter(book.totalPages, book.characterCount, start.rawOffset),
    startCharacterOffset: start.rawOffset,
    sectionTitle: sectionAtOffset(visible, start.readingOffset)?.title || "",
  }));
}

function chooseDayStarts(sections, ranges, dayCount, totalCharacters, useSplits, tolerance) {
  let previousOffset = 0;
  return Array.from({ length: dayCount }, (_, index) => {
    const target = totalCharacters * index / dayCount;
    if (index === 0) return { readingOffset: 0, rawOffset: expandOffset(0, ranges) };
    const nearest = nearestSection(target, sections, previousOffset);
    const useSection = nearest && (!useSplits ||
      Math.abs(nearest.readingOffset - target) <= tolerance);
    const readingOffset = useSection ? nearest.readingOffset : useSplits
      ? target
      : previousOffset;
    previousOffset = readingOffset;
    return {
      readingOffset,
      rawOffset: useSection ? nearest.characterOffset : expandOffset(readingOffset, ranges),
    };
  });
}

function nearestSection(target, sections, minimum) {
  return sections.filter((section) => section.readingOffset >= minimum)
    .reduce((nearest, section) => {
      if (!nearest || Math.abs(section.readingOffset - target) <
        Math.abs(nearest.readingOffset - target)) return section;
      return nearest;
    }, null);
}

function sectionsWithReadingOffsets(sections, totalCharacters) {
  if (!Number.isSafeInteger(totalCharacters) || totalCharacters < 0) {
    throw new RangeError("EPUB character count must be a non-negative integer");
  }
  return sections.map((section) => {
    const characterOffset = section.epubOffset?.characterOffset;
    if (!Number.isSafeInteger(characterOffset) || characterOffset < 0 ||
      characterOffset > totalCharacters) {
      throw new RangeError("EPUB section has an invalid character offset");
    }
    return { ...section, characterOffset };
  }).sort((left, right) => left.characterOffset - right.characterOffset);
}

function ignoredRanges(sections, totalCharacters) {
  return sections.flatMap((section, index) => {
    if (!section.ignored) return [];
    return [{
      start: section.characterOffset,
      end: sections[index + 1]?.characterOffset ?? totalCharacters,
    }];
  });
}

function compressOffset(offset, ranges) {
  return offset - ranges.reduce((removed, range) =>
    removed + (range.end <= offset ? range.end - range.start : 0), 0);
}

function expandOffset(offset, ranges) {
  let removed = 0;
  for (const range of ranges) {
    const compressedStart = range.start - removed;
    if (offset >= compressedStart) removed += range.end - range.start;
    else break;
  }
  return offset + removed;
}

function pageAtCharacter(totalPages, totalCharacters, offset) {
  if (!Number.isInteger(totalPages) || totalPages < 1) return null;
  if (!totalCharacters) return 1;
  return Math.min(totalPages, Math.max(1, 1 + Math.floor(offset / totalCharacters * totalPages)));
}

function sectionAtOffset(sections, offset) {
  return [...sections].reverse().find((section) => section.readingOffset <= offset);
}

function validateInputs(book, dayCount) {
  if (!Number.isSafeInteger(dayCount) || dayCount < 1) {
    throw new RangeError("EPUB day count must be a positive integer");
  }
  if (book.totalPages !== null && (!Number.isSafeInteger(book.totalPages) || book.totalPages < 1)) {
    throw new RangeError("EPUB page count must be a positive integer");
  }
}
