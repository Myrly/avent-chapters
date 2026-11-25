export function createSection({
  id,
  title = "Untitled section",
  kind = "chapter",
  startPage,
  children = [],
  epubOffset,
}) {
  return {
    id: id || `section-${startPage}`,
    title: title.trim() || "Untitled section",
    kind,
    startPage: Number(startPage),
    children,
    ...(epubOffset === undefined ? {} : { epubOffset }),
  };
}
