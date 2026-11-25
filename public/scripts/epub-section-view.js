import {
  mapCharacterToPage,
  pageOverrideError,
} from "./domain/services/epub/page-map.js";

export function renderEpubSections(result, list, dictionary) {
  list.replaceChildren();
  result.book.sections.forEach((section, index) => {
    list.append(createSectionItem(section, index, result.book, dictionary));
  });
  list.hidden = result.book.sections.length === 0;
}

function createSectionItem(section, index, book, dictionary) {
  const item = document.createElement("li");
  item.dataset.sectionIndex = String(index);
  item.className = `epub-section-card${section.ignored ? " is-ignored" : ""}`;
  item.append(createTitleField(section, index, dictionary));
  if (Number.isSafeInteger(book.totalPages)) {
    item.append(createPageField(section, index, book, dictionary));
  }
  item.append(createActions(section, index, dictionary));
  return item;
}

function createTitleField(section, index, dictionary) {
  const label = document.createElement("label");
  label.className = "form-field epub-section-title-field";
  label.append(createLabel(dictionary["epub.section_title"]));
  const input = document.createElement("input");
  input.type = "text";
  input.dataset.sectionTitle = String(index);
  input.value = section.title;
  input.setAttribute("aria-label", dictionary["epub.section_title_aria"]
    .replace("{section}", section.title));
  label.append(input);
  return label;
}

function createPageField(section, index, book, dictionary) {
  const label = document.createElement("label");
  label.className = "form-field epub-section-page-field";
  label.append(createLabel(dictionary["epub.section_page"]));
  const input = document.createElement("input");
  input.type = "number";
  input.min = "1";
  input.max = String(book.totalPages);
  input.step = "1";
  input.inputMode = "numeric";
  input.dataset.sectionPage = String(index);
  input.value = section.startPage ?? "";
  input.setAttribute("aria-label", dictionary["epub.section_page_aria"]
    .replace("{section}", section.title));
  const hint = document.createElement("small");
  hint.dataset.pageEstimate = "";
  if (!pageOverrideError(book)) {
    const estimate = mapCharacterToPage(book, section.epubOffset.characterOffset).page;
    hint.textContent = dictionary["epub.page_estimate"].replace("{page}", String(estimate));
  }
  label.append(input, hint);
  return label;
}

function createActions(section, index, dictionary) {
  const actions = document.createElement("div");
  actions.className = "epub-section-actions";
  const toggle = createButton(
    section.ignored ? "epub.restore_section" : "epub.ignore_section",
    section.ignored ? "epub.restore_aria" : "epub.ignore_aria",
    section,
    index,
    "toggle",
    dictionary,
  );
  toggle.setAttribute("aria-pressed", String(section.ignored));
  actions.append(toggle, createButton(
    "epub.remove_section", "epub.remove_aria", section, index, "remove", dictionary,
  ));
  return actions;
}

function createButton(labelKey, ariaKey, section, index, action, dictionary) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button button-secondary button-small";
  button.dataset.sectionIndex = String(index);
  button.dataset.sectionAction = action;
  button.textContent = dictionary[labelKey];
  button.setAttribute("aria-label", dictionary[ariaKey].replace("{section}", section.title));
  return button;
}

function createLabel(text) {
  const span = document.createElement("span");
  span.textContent = text;
  return span;
}

export function refreshPageEstimateHints(book, list, dictionary) {
  const errorKey = pageOverrideError(book);
  for (const item of list.children) {
    const section = book.sections[Number(item.dataset.sectionIndex)];
    const hint = item.querySelector("[data-page-estimate]");
    if (!hint) continue;
    if (errorKey) {
      hint.textContent = "";
      continue;
    }
    const estimate = mapCharacterToPage(book, section.epubOffset.characterOffset).page;
    hint.textContent = dictionary["epub.page_estimate"].replace("{page}", String(estimate));
  }
}
