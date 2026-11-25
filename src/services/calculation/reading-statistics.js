export function calculateReadingStatistics(days) {
  if (!Array.isArray(days) || days.length === 0) {
    throw new RangeError("Reading statistics require at least one day");
  }
  const entries = days.map((day) => {
    if (!Number.isSafeInteger(day?.day) || day.day < 1 ||
        !Number.isSafeInteger(day.startPage) ||
        !Number.isSafeInteger(day.endPage) ||
        day.endPage < day.startPage) {
      throw new RangeError("Reading statistics require valid inclusive page ranges");
    }
    return { day: day.day, pages: day.endPage - day.startPage + 1 };
  });
  const sorted = [...entries].sort((a, b) => a.pages - b.pages || a.day - b.day);
  const middle = Math.floor(sorted.length / 2);
  const medianValues = sorted.length % 2
    ? [sorted[middle].pages]
    : [sorted[middle - 1].pages, sorted[middle].pages];
  const counts = entries.map(({ pages }) => pages);
  const median = medianValues.reduce((sum, value) => sum + value, 0) /
    medianValues.length;
  const minimum = Math.min(...counts);
  const maximum = Math.max(...counts);

  return {
    average: counts.reduce((sum, value) => sum + value, 0) / counts.length,
    median,
    minimum,
    maximum,
    medianDays: entries.filter(({ pages }) => medianValues.includes(pages))
      .map(({ day }) => day),
    minimumDays: entries.filter(({ pages }) => pages === minimum).map(({ day }) => day),
    maximumDays: entries.filter(({ pages }) => pages === maximum).map(({ day }) => day),
  };
}
