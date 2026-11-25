import test from "node:test";
import assert from "node:assert/strict";
import { createBook } from "../src/data/models/book.js";
import { createSection } from "../src/data/models/section.js";
import { buildEvenTargets } from "../src/services/calculation/targets.js";
import { calculateDivision } from "../src/services/calculation/division.js";

test("targets start inside the requested story range", () => {
  const targets = buildEvenTargets(100, 4, 10);
  assert.equal(targets[0], 10);
  assert.equal(targets.every((page) => page >= 10 && page <= 100), true);
  assert.throws(() => buildEvenTargets(100, 4, 101), RangeError);
});

test("division starts at the selected story page and ignores earlier sections", () => {
  const days = calculateDivision(createBook({
    totalPages: 100,
    storyStartPage: 10,
    dayCount: 4,
    sections: [5, 10, 35, 60, 85].map((page, index) =>
      createSection({ startPage: page, title: `Section ${index + 1}` }),
    ),
  }));
  assert.equal(days[0].startPage, 10);
  assert.equal(days[0].targetPage, 10);
  assert.equal(days[0].sectionTitle, "Section 2");
  assert.equal(days.at(-1).endPage, 100);
});

test("division rejects a story start outside the last story page", () => {
  const book = createBook({ totalPages: 40, storyStartPage: 41, dayCount: 2 });
  assert.throws(() => calculateDivision(book), RangeError);
});
