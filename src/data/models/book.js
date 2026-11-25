export function createBook({
  id,
  title = "Untitled book",
  author = "",
  edition = "",
  totalPages,
  storyStartPage = 1,
  dayCount = 24,
  pagesPerDayGoal = null,
  source = "manual",
  sections = [],
}) {
  return {
    id: id || `book-${Date.now()}`,
    title: title.trim() || "Untitled book",
    author: author.trim(),
    edition: edition.trim(),
    totalPages: Number(totalPages),
    storyStartPage: Number(storyStartPage),
    dayCount: Number(dayCount),
    pagesPerDayGoal: pagesPerDayGoal === null ? null : Number(pagesPerDayGoal),
    source,
    sections,
  };
}
