import { messages } from "./i18n-messages.js";
import { parseManualBook } from "./domain/services/manual-input.js";
import { createSectionRows } from "./manual-section-rows.js";
import { setupDivisionGoalMode } from "./manual-division-mode.js";
import { prefillManualFromEpub } from "./manual-epub-prefill.js";
import {
  renderDuplicatePageNotice,
  renderManualIssues,
} from "./manual-form-feedback.js";

const form = document.querySelector("[data-manual-form]");
if (form) initializeManualForm(form);

function initializeManualForm(form) {
  const list = form.querySelector("[data-section-list]");
  const errors = form.querySelector("[data-manual-errors]");
  const confirmation = form.querySelector("[data-duplicate-confirm]");
  const checkbox = form.querySelector("[data-confirm-duplicates]");
  const duplicatePages = form.querySelector("[data-duplicate-pages]");
  const addButton = form.querySelector("[data-add-section]");
  let activeIssues = [];
  let activeDuplicatePages = [];
  const rows = createSectionRows(list, handleChange, () => addButton.focus());
  const divisionGoal = setupDivisionGoalMode(form, handleChange);
  prefillManualFromEpub(form);
  rows.add();

  form.addEventListener("input", (event) => {
    if (!list.contains(event.target) && event.target !== checkbox &&
      !event.target.matches("[data-division-mode]")) handleChange();
  });
  checkbox.addEventListener("change", () => {
    activeIssues = [];
    errors.hidden = true;
    errors.replaceChildren();
  });
  addButton.addEventListener("click", () =>
    rows.add().querySelector('[data-section-field="page"]').focus(),
  );
  document.querySelector("[data-language-selector]")?.addEventListener("change", refreshLocalizedForm);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitManualBook();
  });

  function handleChange() {
    checkbox.checked = false;
    confirmation.hidden = true;
    activeDuplicatePages = [];
    activeIssues = [];
    errors.hidden = true;
    errors.replaceChildren();
    renderSummary();
  }

  function renderSummary() {
    const text = currentMessages();
    const count = rows.values().filter((row) => row.page.trim() || row.title.trim()).length;
    form.querySelector("[data-section-summary]").textContent =
      text["manual.summary"].replace("{count}", String(count));
  }

  function refreshLocalizedForm() {
    rows.refreshLabels();
    renderSummary();
    showIssues(activeIssues);
    if (activeDuplicatePages.length) renderDuplicatePages(activeDuplicatePages);
  }

  function submitManualBook() {
    const result = parseManualBook({
      title: form.elements.title.value,
      author: form.elements.author.value,
      edition: form.elements.edition.value,
      totalPages: form.elements.totalPages.value,
      ...divisionGoal.values(),
      sections: rows.values(),
      storyStartsAtFirstSection: rows.storyStartsAtFirstSection(),
    }, { confirmDuplicates: checkbox.checked });
    showIssues(result.issues);
    if (result.duplicatePages.length) renderDuplicatePages(result.duplicatePages);
    if (result.issues.length) {
      focusFirstIssue(result.issues[0], rows, checkbox, form);
      return;
    }
    try {
      sessionStorage.removeItem("livrent.epub-preview");
      sessionStorage.setItem("livrent.manual-preview", JSON.stringify({
        book: result.book,
        duplicatePages: result.duplicatePages,
      }));
      window.location.assign("/preview.html");
    } catch (error) {
      console.error("Unable to store the manual book for its preview:", error);
      showIssues([{ code: "previewStorageFailed" }]);
    }
  }

  function showIssues(issues) {
    activeIssues = issues;
    renderManualIssues(errors, issues, currentMessages());
  }

  function renderDuplicatePages(pages) {
    activeDuplicatePages = pages;
    renderDuplicatePageNotice(confirmation, duplicatePages, pages, currentMessages());
  }
}

function focusFirstIssue(issue, rows, checkbox, form) {
  if (issue.code === "confirmDuplicates") checkbox.focus();
  else if (issue.row) rows.focusRow(issue.row - 1);
  else if (issue.field) form.elements[issue.field]?.focus();
}

function currentMessages() {
  return messages[document.documentElement.lang] || messages.fr;
}
