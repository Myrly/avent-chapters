import { readEpubDraft } from "./epub-state.js";

export function restoreEpubDraft(form, state, render) {
  const saved = readEpubDraft();
  if (saved.error) {
    state.storageFailed = saved.error === "storage";
    state.errorKey = saved.error === "invalid" ? "epub.error.invalidPlan" : "";
    return render();
  }
  if (!saved.draft) return;

  state.result = {
    book: saved.draft.book,
    headingSource: saved.draft.headingSource || "",
    hasHeadings: saved.draft.book.sections.length > 0,
  };
  const formState = saved.draft.form || {};
  form.elements.totalPages.value = formState.totalPages ?? "";
  form.elements.dayCount.value = formState.dayCount ?? String(state.result.book.dayCount);
  form.elements.pagesPerDayGoal.value =
    formState.pagesPerDayGoal ?? String(state.result.book.pagesPerDayGoal || 30);
  form.elements.totalPages.dispatchEvent(new Event("input", { bubbles: true }));
  const pagesOption = form.querySelector('option[value="pagesPerDay"]');
  form.elements.divisionMode.value = pagesOption.disabled
    ? "dayCount"
    : formState.divisionMode || "dayCount";
  form.elements.divisionMode.dispatchEvent(new Event("change", { bubbles: true }));
}
