import { messages } from "./i18n-messages.js";
import { EpubParseError } from "./domain/services/epub/errors.js";
import { parseEpubFile } from "./domain/services/epub/parse.js";
import { bindEpubGoalControls, prepareEpubPlan } from "./epub-goals.js";
import { renderEpubPlan, renderEpubSections } from "./epub-results.js";

const form = document.querySelector("[data-epub-form]");
const input = form.querySelector('input[type="file"]');
const submit = form.querySelector('button[type="submit"]');
const resultNode = document.querySelector("[data-epub-result]");
const errorNode = document.querySelector("[data-epub-error]");
const status = document.querySelector("[data-epub-status]");
const sectionsList = document.querySelector("[data-epub-sections]");
const planNodes = {
  plan: document.querySelector("[data-epub-plan]"),
  days: document.querySelector("[data-epub-days]"),
  pageNote: document.querySelector("[data-epub-page-note]"),
  noActiveSections: document.querySelector("[data-epub-no-active-sections]"),
};
let result = null;
let errorKey = "";
let goalErrorKey = "";
let parsing = false;

bindEpubGoalControls(form, render);
form.addEventListener("submit", (event) => {
  event.preventDefault();
  parseSelectedFile();
});
sectionsList.addEventListener("click", toggleSection);
document.querySelector("[data-language-selector]")?.addEventListener("change", render);

async function parseSelectedFile() {
  const file = input.files[0];
  if (!file) return showError("epub.error.noFile");
  result = null;
  resultNode.hidden = true;
  parsing = true;
  errorKey = "";
  setBusy(true);
  render();
  try {
    result = await parseEpubFile(file);
  } catch (error) {
    if (error instanceof EpubParseError) {
      errorKey = `epub.error.${error.code}`;
    } else {
      console.error("Unexpected EPUB parsing failure:", error);
      errorKey = "epub.error.unknown";
    }
  } finally {
    parsing = false;
    setBusy(false);
    render();
  }
}

function toggleSection(event) {
  const button = event.target.closest("[data-section-index]");
  if (!button || !result) return;
  const section = result.book.sections[Number(button.dataset.sectionIndex)];
  if (!section) return;
  section.ignored = !section.ignored;
  render();
}

function showError(key) {
  errorKey = key;
  render();
}

function render() {
  const dictionary = messages[document.documentElement.lang] || messages.fr;
  if (!result) {
    errorNode.hidden = !errorKey;
    errorNode.textContent = errorKey ? dictionary[errorKey] : "";
    status.textContent = parsing ? dictionary["epub.parsing"] : "";
    return;
  }

  resultNode.hidden = false;
  errorKey = "";
  document.querySelector("[data-epub-title]").textContent = result.book.title;
  document.querySelector("[data-epub-author]").textContent =
    result.book.author || dictionary["epub.unknown_author"];
  document.querySelector("[data-epub-no-headings]").hidden = result.hasHeadings;
  renderEpubSections(result, sectionsList, dictionary);
  const plan = result.hasHeadings ? prepareEpubPlan(result.book, form) : null;
  goalErrorKey = plan?.errorKey || "";
  errorNode.hidden = !goalErrorKey;
  errorNode.textContent = goalErrorKey
    ? dictionary[goalErrorKey] || dictionary["epub.error.unknown"]
    : "";
  renderEpubPlan(result, plan, planNodes, dictionary);
  status.textContent = "";
}

function setBusy(isBusy) {
  submit.disabled = isBusy;
}
