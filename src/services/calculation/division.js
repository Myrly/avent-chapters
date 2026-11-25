import { createDivisionDay } from "../../data/models/division.js";
import { normalizeSections } from "./normalize.js";
import { buildEvenTargets } from "./targets.js";
import { chooseBoundary } from "./boundary.js";
import { chooseSparseStart, shouldUsePageSplits } from "./sparse-boundaries.js";

export function calculateDivision(book) {
  const storyStartPage = validateBook(book);
  const sections = normalizeSections(book.sections)
    .filter((section) =>
      section.startPage >= storyStartPage && section.startPage <= book.totalPages,
    );
  const available = sections.some((section) => section.startPage === storyStartPage)
    ? sections
    : [createStoryStart(storyStartPage), ...sections];
  const usePageSplits = shouldUsePageSplits(sections.length, book.dayCount);
  const targets = buildEvenTargets(book.totalPages, book.dayCount, storyStartPage);
  let previousStart = storyStartPage;
  const starts = targets.map((target, index) => {
    const start = usePageSplits
      ? chooseSparseStart(target, sections, {
        index,
        totalPages: book.totalPages,
        dayCount: book.dayCount,
        storyStartPage,
        previousStart,
      })
      : chooseStart(target, available, index, book.totalPages, previousStart, storyStartPage);
    previousStart = start;
    return start;
  });

  return starts.map((startPage, index) => {
    const section = resolveSection(available, startPage);
    const target = targets[index];
    return createDivisionDay({
      day: index + 1,
      startPage,
      endPage: index === starts.length - 1
        ? book.totalPages
        : Math.max(startPage, starts[index + 1] - 1),
      sectionTitle: section.title,
      targetPage: target,
      adjusted: startPage !== target,
      epubOffset: section.epubOffset,
    });
  });
}

function resolveSection(available, startPage) {
  const exact = available.find((item) => item.startPage === startPage);
  const context = exact || [...available].reverse().find((item) =>
    item.kind !== "story-start" && item.startPage < startPage,
  );
  return { title: context?.title || "", epubOffset: exact?.epubOffset };
}

function validateBook(book) {
  if (!book || !Number.isInteger(book.totalPages) || book.totalPages < 1) {
    throw new RangeError("Book totalPages must be a positive integer");
  }
  if (!Number.isInteger(book.dayCount) || book.dayCount < 1) {
    throw new RangeError("Book dayCount must be a positive integer");
  }
  const storyStartPage = book.storyStartPage ?? 1;
  if (!Number.isInteger(storyStartPage) || storyStartPage < 1 || storyStartPage > book.totalPages) {
    throw new RangeError("Book storyStartPage must be within the story page range");
  }
  return storyStartPage;
}

function createStoryStart(startPage) {
  return { id: "story-start", title: "", kind: "story-start", startPage };
}

function chooseStart(target, sections, index, totalPages, previousStart, storyStartPage) {
  const inRange = sections.filter((section) =>
    section.startPage >= storyStartPage && section.startPage <= totalPages,
  );
  if (index === 0) {
    const first = inRange.find((section) => section.startPage === storyStartPage);
    if (first) return storyStartPage;
  }
  const candidates = inRange.filter((section) => section.startPage >= previousStart);
  if (!candidates.length) return previousStart;
  return chooseBoundary(target, candidates).startPage;
}
