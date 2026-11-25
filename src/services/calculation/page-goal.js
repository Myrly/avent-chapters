export function deriveDayCountFromPages(totalPages, storyStartPage, pagesPerDayGoal) {
  if (![totalPages, storyStartPage, pagesPerDayGoal].every(Number.isSafeInteger) ||
    totalPages < 1 || storyStartPage < 1 || storyStartPage > totalPages ||
    pagesPerDayGoal < 1) {
    throw new RangeError("Page goal inputs must be positive integers within the book range");
  }
  const storyPageCount = totalPages - storyStartPage + 1;
  return Math.max(1, Math.round(storyPageCount / pagesPerDayGoal));
}
