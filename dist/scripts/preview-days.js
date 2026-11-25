export function renderDayList(days, book, text, isEpub) {
  const list = document.querySelector("[data-preview-days]");
  list.replaceChildren();
  for (const day of days) {
    const item = document.createElement("li");
    item.textContent = isEpub
      ? formatEpubDay(day, text)
      : formatManualDay(day, book, text);
    list.append(item);
  }
}

function formatEpubDay(day, text) {
  const key = day.startPage === null
    ? "preview.epub_day_text"
    : day.startPageIsExact
      ? "preview.epub_day_exact"
      : "preview.epub_day_estimated";
  return text[key]
    .replace("{day}", String(day.day))
    .replace("{page}", String(day.startPage ?? ""))
    .replace("{section}", day.sectionTitle || text["preview.generic_section"]);
}

function formatManualDay(day, book, text) {
  const sectionFallback = day.startPage === (book.storyStartPage || 1)
    ? text["preview.story_start"]
    : text["preview.generic_section"];
  return text["preview.day"]
    .replace("{day}", String(day.day))
    .replace("{start}", String(day.startPage))
    .replace("{end}", String(day.endPage))
    .replace("{section}", day.sectionTitle || sectionFallback);
}
