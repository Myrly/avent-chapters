export function refreshSectionRowLabels(row, index, rowCount, text) {
  row.querySelector("legend").textContent = text["manual.section_number"]
    .replace("{number}", String(index + 1));
  row.querySelectorAll(".form-field span")[0].textContent = text["manual.field_page"];
  row.querySelectorAll(".form-field span")[1].textContent = text["manual.field_title"];
  row.querySelector('[data-section-field="page"]')
    .setAttribute("aria-label", text["manual.field_page"]);
  row.querySelector('[data-section-field="title"]')
    .setAttribute("aria-label", text["manual.field_title"]);
  for (const button of row.querySelectorAll("[data-row-action]")) {
    const key = `manual.${button.dataset.rowAction}`;
    button.textContent = text[key];
    button.setAttribute("aria-label", text[key]);
    button.disabled = button.dataset.rowAction === "move_up"
      ? index === 0
      : button.dataset.rowAction === "move_down"
        ? index === rowCount - 1
        : false;
  }
}
