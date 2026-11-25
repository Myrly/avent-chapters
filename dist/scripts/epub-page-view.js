import { messages } from "./i18n-messages.js";
import { renderEpubPlan } from "./epub-results.js";
import { renderEpubSections, refreshPageEstimateHints } from "./epub-section-view.js";
import { prepareEpubPlan } from "./epub-goals.js";

export function renderEpubPage(state) {
  const dictionary = currentMessages();
  const { result, nodes } = state;
  nodes.status.textContent = state.parsing ? dictionary["epub.parsing"] : "";
  if (!result) {
    showPageState(state, dictionary);
    return null;
  }

  nodes.result.hidden = false;
  nodes.title.textContent = result.book.title;
  nodes.author.textContent = result.book.author || dictionary["epub.unknown_author"];
  const hasSections = result.book.sections.length > 0;
  nodes.noHeadings.hidden = hasSections;
  nodes.manualLink.hidden = hasSections;
  const plan = hasSections ? prepareEpubPlan(result.book, state.form) : null;
  renderEpubSections(result, nodes.sections, dictionary);
  return renderEpubPlanView(state, dictionary, plan);
}

export function renderEpubPlanView(state, dictionary = currentMessages(), preparedPlan) {
  const { result, form, nodes } = state;
  const hasSections = result.book.sections.length > 0;
  const plan = preparedPlan === undefined
    ? (hasSections ? prepareEpubPlan(result.book, form) : null)
    : preparedPlan;
  const errorKey = state.errorKey || state.sectionErrorKey || plan?.errorKey ||
    (state.storageFailed ? "epub.error.storageFailed" : "");
  nodes.error.hidden = !errorKey;
  nodes.error.textContent = errorKey ? dictionary[errorKey] : "";
  refreshPageEstimateHints(result.book, nodes.sections, dictionary);
  renderEpubPlan(result, plan, nodes, dictionary);
  nodes.continueButton.disabled = Boolean(errorKey);
  return plan;
}

function showPageState(state, dictionary) {
  const { nodes } = state;
  nodes.result.hidden = true;
  const errorKey = state.errorKey ||
    (state.storageFailed ? "epub.error.storageFailed" : "");
  nodes.error.hidden = !errorKey;
  nodes.error.textContent = errorKey ? dictionary[errorKey] : "";
  nodes.status.textContent = state.parsing ? dictionary["epub.parsing"] : "";
}

function currentMessages() {
  return messages[document.documentElement.lang] || messages.fr;
}
