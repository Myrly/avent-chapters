export function sectionsWithReadingOffsets(sections, totalCharacters) {
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

export function ignoredRanges(sections, totalCharacters) {
  return sections.flatMap((section, index) => {
    if (!section.ignored) return [];
    return [{
      start: section.characterOffset,
      end: sections[index + 1]?.characterOffset ?? totalCharacters,
    }];
  });
}

export function compressOffset(offset, ranges) {
  return offset - ranges.reduce((removed, range) =>
    removed + (range.end <= offset ? range.end - range.start : 0), 0);
}

export function expandOffset(offset, ranges) {
  let removed = 0;
  for (const range of ranges) {
    const compressedStart = range.start - removed;
    if (offset >= compressedStart) removed += range.end - range.start;
    else break;
  }
  return offset + removed;
}

export function sectionAtOffset(sections, offset) {
  return [...sections].reverse().find((section) => section.readingOffset <= offset);
}
