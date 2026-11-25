import { expandOffset } from "./character-offsets.js";

export function chooseDayStarts(sections, ranges, dayCount, totalCharacters, useSplits, tolerance) {
  let previousOffset = 0;
  return Array.from({ length: dayCount }, (_, index) => {
    const target = totalCharacters * index / dayCount;
    if (index === 0) {
      return {
        readingOffset: 0,
        rawOffset: expandOffset(0, ranges),
        targetOffset: 0,
      };
    }
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
      targetOffset: target,
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
