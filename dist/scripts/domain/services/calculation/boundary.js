export function chooseBoundary(targetPage, sections) {
  if (sections.length === 0) return null;
  const candidates = sections.map((section) => ({
    section,
    distance: Math.abs(section.startPage - targetPage),
  }));
  candidates.sort((left, right) =>
    left.distance - right.distance ||
    left.section.startPage - right.section.startPage,
  );
  return candidates[0].section;
}
