export function renderEpubSections(result, list, dictionary) {
  list.replaceChildren();
  result.book.sections.forEach((section, index) => {
    const item = document.createElement("li");
    item.className = `epub-section-card${section.ignored ? " is-ignored" : ""}`;
    const title = document.createElement("span");
    title.className = "epub-section-title";
    title.textContent = section.title;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button button-secondary button-small";
    button.dataset.sectionIndex = String(index);
    button.textContent = dictionary[section.ignored
      ? "epub.restore_section"
      : "epub.ignore_section"];
    button.setAttribute("aria-pressed", String(section.ignored));
    button.setAttribute(
      "aria-label",
      dictionary[section.ignored ? "epub.restore_aria" : "epub.ignore_aria"]
        .replace("{section}", section.title),
    );
    item.append(title, button);
    list.append(item);
  });
  list.hidden = result.book.sections.length === 0;
}

export function renderEpubPlan(result, plan, nodes, dictionary) {
  const sections = result.book.sections;
  const hasActiveSections = sections.some((section) => !section.ignored);
  nodes.noActiveSections.hidden = !sections.length || hasActiveSections;
  nodes.pageNote.textContent = dictionary[plan?.totalPages
    ? "epub.page_note_with_pages"
    : "epub.page_note_characters"];
  nodes.days.replaceChildren();
  nodes.plan.hidden = !hasActiveSections || !plan?.days?.length;
  if (nodes.plan.hidden) return;

  for (const day of plan.days) {
    const item = document.createElement("li");
    const section = day.sectionTitle || dictionary["epub.beginning"];
    const key = day.startPage === null ? "epub.day_start_text" : "epub.day_start_page";
    item.textContent = dictionary[key]
      .replace("{day}", String(day.day))
      .replace("{page}", String(day.startPage ?? ""))
      .replace("{section}", section);
    nodes.days.append(item);
  }
}
