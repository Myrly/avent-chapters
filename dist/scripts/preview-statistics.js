import { calculateReadingStatistics } from "./domain/services/calculation/reading-statistics.js";

export function renderPlanStatistics(book, days, text) {
  const box = document.querySelector("[data-preview-statistics]");
  const unavailable = document.querySelector("[data-preview-statistics-unavailable]");
  const hasPrintPages = Number.isSafeInteger(book.totalPages) && book.totalPages > 0;
  const needsPrintPages = book.source === "epub" && !hasPrintPages;
  box.hidden = needsPrintPages;
  unavailable.hidden = !needsPrintPages;
  if (needsPrintPages) return;

  const statistics = calculateReadingStatistics(days);
  const number = new Intl.NumberFormat(document.documentElement.lang, {
    maximumFractionDigits: 1,
  });
  for (const name of ["average", "median", "maximum", "minimum"]) {
    const value = document.querySelector(`[data-preview-stat="${name}"]`);
    const formatted = number.format(statistics[name]);
    value.textContent = formatted;
    setDayTooltip(value, name, formatted, statistics, text);
  }
}

function setDayTooltip(value, name, formatted, statistics, text) {
  const days = statistics[`${name}Days`];
  if (!days) {
    value.removeAttribute("title");
    value.removeAttribute("aria-label");
    value.removeAttribute("tabindex");
    return;
  }
  const dayList = text["preview.stats.days"].replace("{days}", days.join(", "));
  value.title = dayList;
  value.tabIndex = 0;
  value.setAttribute(
    "aria-label",
    `${text[`preview.stats.${name}`]}: ${formatted}. ${dayList}`,
  );
}
