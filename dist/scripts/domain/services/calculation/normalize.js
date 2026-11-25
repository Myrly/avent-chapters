export function normalizeSections(sections) {
  const valid = sections
    .map((section, index) => ({
      ...section,
      id: section.id || `section-${index + 1}`,
      startPage: Number(section.startPage),
    }))
    .filter((section) => Number.isInteger(section.startPage) && section.startPage > 0)
    .sort((left, right) => left.startPage - right.startPage);

  const unique = [];
  for (const section of valid) {
    if (unique.at(-1)?.startPage !== section.startPage) unique.push(section);
  }
  return unique.map((section, index) => ({
    ...section,
    title: String(section.title || "").trim() || `Section ${index + 1}`,
  }));
}
