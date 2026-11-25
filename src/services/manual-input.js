import { createBook } from "../data/models/book.js";
import { createSection } from "../data/models/section.js";
import { normalizeSections } from "./calculation/normalize.js";
import { deriveDayCountFromPages } from "./calculation/page-goal.js";

export function parseManualBook(input, { confirmDuplicates = false } = {}) {
  const issues = [];
  const title = String(input.title || "").trim();
  const author = String(input.author || "").trim();
  const edition = String(input.edition || "").trim();
  const totalPages = parsePositiveInteger(input.totalPages);
  const divisionMode = input.divisionMode === "pagesPerDay" ? "pagesPerDay" : "dayCount";
  const requestedDayCount = parsePositiveInteger(input.dayCount);
  const pagesPerDayGoal = divisionMode === "pagesPerDay"
    ? parsePositiveInteger(input.pagesPerDayGoal)
    : null;

  if (!title) issues.push({ code: "titleRequired", field: "title" });
  if (totalPages === null) issues.push({ code: "totalPagesInvalid", field: "totalPages" });
  if (divisionMode === "dayCount" && requestedDayCount === null) {
    issues.push({ code: "dayCountInvalid", field: "dayCount" });
  }
  if (divisionMode === "pagesPerDay" && pagesPerDayGoal === null) {
    issues.push({ code: "pagesPerDayInvalid", field: "pagesPerDayGoal" });
  }

  const sections = parseSections(input.sections, totalPages, issues);
  const duplicatePages = findDuplicatePages(sections);
  if (duplicatePages.length && !confirmDuplicates) {
    issues.push({ code: "confirmDuplicates", field: "sections" });
  }
  if (issues.length) return { book: null, issues, duplicatePages };

  const uniqueSections = confirmDuplicates
    ? removeDuplicatePages(sections)
    : sections;
  const storyStartPage = input.storyStartsAtFirstSection && uniqueSections.length
    ? uniqueSections[0].startPage
    : 1;
  const dayCount = divisionMode === "pagesPerDay"
    ? deriveDayCountFromPages(totalPages, storyStartPage, pagesPerDayGoal)
    : requestedDayCount;
  const normalized = normalizeSections(uniqueSections).map((section) =>
    createSection(section),
  );
  const book = createBook({
    title,
    author,
    edition,
    totalPages,
    storyStartPage,
    dayCount,
    pagesPerDayGoal,
    source: "manual",
    sections: normalized,
  });
  return { book, issues: [], duplicatePages };
}

function parseSections(rows, totalPages, issues) {
  const sections = [];
  for (const [index, row] of (Array.isArray(rows) ? rows : []).entries()) {
    const rawPage = String(row.page || "").trim();
    const title = String(row.title || "").trim();
    if (!rawPage && !title) continue;
    const startPage = parsePositiveInteger(rawPage);
    if (startPage === null) {
      issues.push({
        code: rawPage ? "sectionPageInvalid" : "sectionPageRequired",
        field: "sections",
        row: index + 1,
      });
      continue;
    }
    if (totalPages !== null && startPage > totalPages) {
      issues.push({ code: "sectionPageOutOfRange", field: "sections", row: index + 1 });
      continue;
    }
    sections.push({
      id: `manual-section-${index + 1}`,
      title,
      kind: "chapter",
      startPage,
    });
  }
  return sections;
}

function parsePositiveInteger(value) {
  const text = String(value ?? "").trim();
  if (!text || !/^\d+$/.test(text)) return null;
  const number = Number(text);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function findDuplicatePages(sections) {
  const seen = new Set();
  const duplicates = new Set();
  for (const section of sections) {
    if (seen.has(section.startPage)) duplicates.add(section.startPage);
    seen.add(section.startPage);
  }
  return [...duplicates].sort((left, right) => left - right);
}

function removeDuplicatePages(sections) {
  const seen = new Set();
  return sections.filter((section) => {
    if (seen.has(section.startPage)) return false;
    seen.add(section.startPage);
    return true;
  });
}
