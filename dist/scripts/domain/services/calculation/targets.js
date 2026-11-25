export function buildEvenTargets(totalPages, dayCount, startPage = 1) {
  if (!Number.isInteger(totalPages) || totalPages < 1) {
    throw new RangeError("totalPages must be a positive integer");
  }
  if (!Number.isInteger(dayCount) || dayCount < 1) {
    throw new RangeError("dayCount must be a positive integer");
  }
  if (!Number.isInteger(startPage) || startPage < 1 || startPage > totalPages) {
    throw new RangeError("startPage must be between 1 and totalPages");
  }

  return Array.from({ length: dayCount }, (_, index) =>
    Math.min(
      totalPages,
      Math.max(startPage, Math.round(startPage + (index * (totalPages - startPage)) / dayCount)),
    ),
  );
}
