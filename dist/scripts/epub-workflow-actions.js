import { messages } from "./i18n-messages.js";
import { pageOverrideError } from "./domain/services/epub/page-map.js";
import { removeSection, updateSection } from "./epub-editor.js";

export function bindEpubSectionActions(list, state, render, renderPlanAndSave) {
  list.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-section-action]");
    if (!button || !state.result) return;
    const index = Number(button.dataset.sectionIndex);
    const section = state.result.book.sections[index];
    if (!section) return;
    if (button.dataset.sectionAction === "remove") removeSection(state.result.book, index);
    else section.ignored = !section.ignored;
    state.sectionErrorKey = pageOverrideError(state.result.book) || "";
    render();
  });
  list.addEventListener("input", (event) => {
    if (!state.result) return;
    const update = updateSection(state.result.book, event);
    if (!update.handled) return;
    state.sectionErrorKey = update.errorKey ||
      pageOverrideError(state.result.book) || "";
    event.target.setAttribute("aria-invalid", String(Boolean(state.sectionErrorKey)));
    if (event.target.dataset.sectionTitle !== undefined) updateTitleLabel(event.target, state);
    renderPlanAndSave(state);
  });
  list.addEventListener("change", render);
}

function updateTitleLabel(input, state) {
  const section = state.result.book.sections[Number(input.dataset.sectionTitle)];
  const dictionary = messages[document.documentElement.lang] || messages.fr;
  input.setAttribute("aria-label", dictionary["epub.section_title_aria"]
    .replace("{section}", section.title));
}
