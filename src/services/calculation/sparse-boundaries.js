import { chooseBoundary } from "./boundary.js";

const SPARSE_SECTION_RATIO = 0.65;
const SECTION_PREFERENCE_RATIO = 0.2;

export function shouldUsePageSplits(sectionCount, dayCount) {
  return sectionCount < dayCount * SPARSE_SECTION_RATIO;
}

export function chooseSparseStart(targetPage, sections, {
  index,
  totalPages,
  dayCount,
  storyStartPage,
  previousStart,
}) {
  if (index === 0) return storyStartPage;

  const minimum = previousStart + 1;
  const remainingDays = dayCount - index;
  const maximum = totalPages - remainingDays + 1;
  if (minimum > maximum) return previousStart;

  const target = Math.min(maximum, Math.max(minimum, targetPage));
  const candidates = sections.filter((section) =>
    section.startPage >= minimum && section.startPage <= maximum,
  );
  const nearest = chooseBoundary(target, candidates);
  const range = totalPages - storyStartPage + 1;
  const tolerance = Math.max(1, Math.floor((range / dayCount) * SECTION_PREFERENCE_RATIO));
  return nearest && Math.abs(nearest.startPage - target) <= tolerance
    ? nearest.startPage
    : target;
}
