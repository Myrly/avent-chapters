export function createBook({
  id,
  title = "Untitled book",
  author = "",
  edition = "",
  totalPages,
  characterCount = null,
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
    totalPages: totalPages === null || totalPages === undefined ? null : Number(totalPages),
    characterCount: characterCount === null ? null : Number(characterCount),
    storyStartPage: Number(storyStartPage),
    dayCount: Number(dayCount),
    pagesPerDayGoal: pagesPerDayGoal === null ? null : Number(pagesPerDayGoal),
    source,
    sections,
  };
}
