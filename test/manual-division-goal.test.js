import test from "node:test";
import assert from "node:assert/strict";
import { parseManualBook } from "../src/services/manual-input.js";
import { calculateDivision } from "../src/services/calculation/division.js";

const baseInput = {
  title: "Goal-based book",
  totalPages: "100",
  storyStartsAtFirstSection: true,
  sections: [{ page: "10", title: "Story start" }],
};

test("pages-per-day goal derives nearest day count from the story range", () => {
  const result = parseManualBook({
    ...baseInput,
    divisionMode: "pagesPerDay",
    pagesPerDayGoal: "30",
  });

  assert.deepEqual(result.issues, []);
  assert.equal(result.book.dayCount, 3);
  assert.equal(result.book.pagesPerDayGoal, 30);
  assert.equal(calculateDivision(result.book).length, 3);
});

test("pages-per-day goal rounds to the nearest day count and validates input", () => {
  const oneDay = parseManualBook({
    ...baseInput,
    divisionMode: "pagesPerDay",
    pagesPerDayGoal: "70",
  });
  assert.equal(oneDay.book.dayCount, 1);

  const invalid = parseManualBook({
    ...baseInput,
    divisionMode: "pagesPerDay",
    pagesPerDayGoal: "0",
  });
  assert.ok(invalid.issues.some((issue) => issue.code === "pagesPerDayInvalid"));
});

