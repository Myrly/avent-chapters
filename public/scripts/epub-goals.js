import { setupDivisionGoalMode } from "./manual-division-mode.js";
import { deriveDayCountFromPages } from "./domain/services/calculation/page-goal.js";
import { calculateEpubDivision } from "./domain/services/epub/divide.js";
import { pageOverrideError } from "./domain/services/epub/page-map.js";

export function bindEpubGoalControls(form, onChange) {
  setupDivisionGoalMode(form, onChange);
  const totalPages = form.elements.totalPages;
  const mode = form.querySelector("[data-division-mode]");
  const pagesOption = mode.querySelector('option[value="pagesPerDay"]');
  form.elements.dayCount.addEventListener("input", onChange);
  form.elements.pagesPerDayGoal.addEventListener("input", onChange);
  totalPages.addEventListener("input", () => {
    pagesOption.disabled = parsePositiveInteger(totalPages.value) === null;
    if (pagesOption.disabled && mode.value === "pagesPerDay") {
      mode.value = "dayCount";
      mode.dispatchEvent(new Event("change"));
    } else {
      onChange();
    }
  });
}

export function prepareEpubPlan(book, form) {
  const pageText = form.elements.totalPages.value.trim();
  const totalPages = pageText ? parsePositiveInteger(pageText) : null;
  if (pageText && totalPages === null) return { errorKey: "epub.error.totalPagesInvalid" };

  const mode = form.querySelector("[data-division-mode]").value;
  const goal = mode === "pagesPerDay"
    ? parsePositiveInteger(form.elements.pagesPerDayGoal.value)
    : null;
  if (mode === "pagesPerDay" && totalPages === null) {
    return { errorKey: "epub.error.totalPagesRequired" };
  }
  if (mode === "pagesPerDay" && goal === null) {
    return { errorKey: "epub.error.pagesPerDayInvalid" };
  }
  const dayCount = mode === "pagesPerDay"
    ? deriveDayCountFromPages(totalPages, 1, goal)
    : parsePositiveInteger(form.elements.dayCount.value);
  if (dayCount === null) return { errorKey: "epub.error.dayCountInvalid" };
  if (!book.characterCount) return { errorKey: "epub.error.noReadableText" };

  const pageError = pageOverrideError({ ...book, totalPages });
  if (pageError) return { errorKey: pageError };
  Object.assign(book, {
    totalPages,
    dayCount,
    pagesPerDayGoal: goal,
  });
  let days;
  try {
    days = calculateEpubDivision(book);
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return { errorKey: "epub.error.invalidPlan" };
  }
  return {
    days,
    totalPages,
    hasActiveSections: book.sections.some((section) => !section.ignored),
  };
}

function parsePositiveInteger(value) {
  const text = String(value ?? "").trim();
  if (!/^\d+$/.test(text)) return null;
  const number = Number(text);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}
