export function createSection({
  id,
  title = "Untitled section",
  kind = "chapter",
  startPage,
  children = [],
  ignored = false,
  epubOffset,
}) {
  return {
    id: id || `section-${startPage}`,
    title: title.trim() || "Untitled section",
    kind,
    startPage: startPage === null || startPage === undefined ? null : Number(startPage),
    children,
    ignored: Boolean(ignored),
    ...(epubOffset === undefined ? {} : { epubOffset }),
  };
}
