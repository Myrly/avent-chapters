import { EpubParseError } from "./domain/services/epub/errors.js";
import { parseEpubFile } from "./domain/services/epub/parse.js";
import { bindEpubGoalControls } from "./epub-goals.js";
import { renderEpubPage, renderEpubPlanView } from "./epub-page-view.js";
import { bindEpubSectionActions } from "./epub-workflow-actions.js";
import { restoreEpubDraft } from "./epub-workflow-draft.js";
import { findEpubNodes } from "./epub-workflow-dom.js";
import {
  clearEpubDraft,
  storeEpubDraft,
  storeEpubPreview,
} from "./epub-state.js";

export function initializeEpubWorkflow() {
  const form = document.querySelector("[data-epub-form]");
  const nodes = findEpubNodes();
  const state = { form, nodes, result: null, errorKey: "", sectionErrorKey: "", parsing: false };
  bindEpubGoalControls(form, render);
  bindEpubSectionActions(nodes.sections, state, render, renderPlanAndSave);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    parseSelectedFile();
  });
  nodes.continueButton.addEventListener("click", continueToPreview);
  nodes.manualLink.addEventListener("click", openManualFallback);
  document.querySelector("[data-language-selector]")?.addEventListener("change", render);
  restoreEpubDraft(form, state, render);

  async function parseSelectedFile() {
    const file = form.elements.epubFile.files[0];
    if (!file) return showError("epub.error.noFile");
    state.storageFailed = !clearEpubDraft();
    state.result = null;
    state.parsing = true;
    state.errorKey = "";
    setBusy(true);
    render();
    try {
      state.result = await parseEpubFile(file);
    } catch (error) {
      if (error instanceof EpubParseError) state.errorKey = `epub.error.${error.code}`;
      else {
        console.error("Unexpected EPUB parsing failure:", error);
        state.errorKey = "epub.error.unknown";
      }
    } finally {
      state.parsing = false;
      setBusy(false);
      render();
    }
  }

  function continueToPreview() {
    if (!state.result) return;
    const plan = renderEpubPlanView(state);
    if (!plan?.days?.length || plan.errorKey) return;
    if (!storeEpubDraft(state.result, form) || !storeEpubPreview(state.result.book)) {
      state.storageFailed = true;
      renderEpubPlanView(state);
      return;
    }
    window.location.assign("/preview.html");
  }

  function openManualFallback(event) {
    event.preventDefault();
    if (!state.result || state.result.book.sections.length) return;
    state.storageFailed = !storeEpubDraft(state.result, form);
    if (state.storageFailed) renderEpubPlanView(state);
    else window.location.assign("/manual.html?from=epub");
  }

  function render() {
    const previousStorageState = state.storageFailed;
    renderEpubPage(state);
    if (!state.result) return;
    state.storageFailed = !storeEpubDraft(state.result, form);
    if (state.storageFailed !== previousStorageState) renderEpubPlanView(state);
  }

  function renderPlanAndSave(current) {
    current.storageFailed = false;
    renderEpubPlanView(current);
    current.storageFailed = !storeEpubDraft(current.result, form);
    if (current.storageFailed) renderEpubPlanView(current);
  }

  function showError(key) {
    state.errorKey = key;
    render();
  }

  function setBusy(isBusy) {
    form.querySelector('button[type="submit"]').disabled = isBusy;
  }
}
