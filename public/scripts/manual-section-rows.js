import { messages } from "./i18n-messages.js";
import { createStoryStartControl } from "./manual-story-start.js";
import { refreshSectionRowLabels } from "./manual-section-labels.js";

export function createSectionRows(container, onChange, focusFallback) {
  const storyStart = createStoryStartControl(onChange);

  function add(values = {}) {
    const row = buildRow(values);
    container.append(row);
    refreshLabels();
    onChange();
    return row;
  }

  function values() {
    return [...container.querySelectorAll("[data-section-row]")].map((row) => ({
      page: row.querySelector('[data-section-field="page"]').value,
      title: row.querySelector('[data-section-field="title"]').value,
    }));
  }

  function focusRow(index) {
    container.querySelectorAll("[data-section-row]")[index]
      ?.querySelector('[data-section-field="page"]')?.focus();
  }

  function refreshLabels() {
    const text = messages[document.documentElement.lang] || messages.fr;
    for (const [index, row] of [...container.children].entries()) {
      refreshSectionRowLabels(row, index, container.children.length, text);
    }
    storyStart.refresh(container, text["manual.story_starts_here"]);
  }

  container.addEventListener("input", (event) => {
    refreshLabels();
    if (event.target.matches("[data-story-start]")) return;
    onChange();
  });
  container.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const field = event.target.dataset.sectionField;
    if (field === "page") {
      event.preventDefault();
      event.target.closest("[data-section-row]")
        .querySelector('[data-section-field="title"]').focus();
    } else if (field === "title") {
      event.preventDefault();
      const next = event.target.closest("[data-section-row]").nextElementSibling;
      if (next) next.querySelector('[data-section-field="page"]').focus();
      else add().querySelector('[data-section-field="page"]').focus();
    }
  });
  container.addEventListener("click", (event) => {
    const button = event.target.closest("[data-row-action]");
    if (!button) return;
    const row = button.closest("[data-section-row]");
    const action = button.dataset.rowAction;
    if (action === "remove") {
      const next = row.nextElementSibling || row.previousElementSibling;
      row.remove();
      refreshLabels();
      onChange();
      if (next) next.querySelector('[data-section-field="page"]').focus();
      else focusFallback();
      return;
    }
    const neighbor = action === "move_up" ? row.previousElementSibling : row.nextElementSibling;
    if (!neighbor) return;
    if (action === "move_up") container.insertBefore(row, neighbor);
    else container.insertBefore(neighbor, row);
    refreshLabels();
    onChange();
    button.focus();
  });

  return {
    add,
    values,
    focusRow,
    refreshLabels,
    storyStartsAtFirstSection: storyStart.isChecked,
  };
}

function buildRow(values) {
  const row = document.createElement("fieldset");
  row.className = "section-row";
  row.dataset.sectionRow = "";
  row.innerHTML = `
    <legend></legend>
    <div class="section-fields">
      <label class="form-field"><span></span><input type="number" min="1" step="1" inputmode="numeric" data-section-field="page"></label>
      <label class="form-field"><span></span><input type="text" data-section-field="title"></label>
    </div>
    <div class="story-start-slot" data-story-start-slot></div>
    <div class="section-actions">
      <button class="button button-small" type="button" data-row-action="move_up"></button>
      <button class="button button-small" type="button" data-row-action="move_down"></button>
      <button class="button button-small button-secondary" type="button" data-row-action="remove"></button>
    </div>`;
  const text = messages[document.documentElement.lang] || messages.fr;
  row.querySelectorAll(".form-field span")[0].textContent = text["manual.field_page"];
  row.querySelectorAll(".form-field span")[1].textContent = text["manual.field_title"];
  row.querySelector('[data-section-field="page"]').value = values.page || "";
  row.querySelector('[data-section-field="title"]').value = values.title || "";
  return row;
}
