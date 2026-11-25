import { renderEpubSections, refreshPageEstimateHints } from "./epub-section-view.js";

export { renderEpubSections, refreshPageEstimateHints };

export function renderEpubPlan(result, plan, nodes, dictionary) {
  const sections = result.book.sections;
  const hasActiveSections = sections.some((section) => !section.ignored);
  nodes.noActiveSections.hidden = !sections.length || hasActiveSections;
  nodes.pageNote.textContent = dictionary[Number.isSafeInteger(result.book.totalPages)
    ? "epub.page_note_with_pages"
    : "epub.page_note_characters"];
  nodes.days.replaceChildren();
  nodes.plan.hidden = !hasActiveSections || !plan?.days?.length;
  nodes.continueButton.hidden = !sections.length || nodes.plan.hidden;
  if (nodes.plan.hidden) return;

  for (const day of plan.days) {
    const item = document.createElement("li");
    const section = day.sectionTitle || dictionary["epub.beginning"];
    const key = day.startPage === null
      ? "epub.day_start_text"
      : day.startPageIsExact
        ? "epub.day_start_exact"
        : "epub.day_start_page";
    item.textContent = dictionary[key]
      .replace("{day}", String(day.day))
      .replace("{page}", String(day.startPage ?? ""))
      .replace("{section}", section);
    nodes.days.append(item);
  }
}
