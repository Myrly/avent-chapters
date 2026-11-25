import test from "node:test";
import assert from "node:assert/strict";
import { createBook } from "../src/data/models/book.js";
import { createSection } from "../src/data/models/section.js";
import { normalizeSections } from "../src/services/calculation/normalize.js";
import { buildEvenTargets } from "../src/services/calculation/targets.js";
import { chooseBoundary } from "../src/services/calculation/boundary.js";
import { calculateDivision } from "../src/services/calculation/division.js";

test("normalizes, sorts, and deduplicates sections", () => {
  const sections = normalizeSections([
    { startPage: 82, title: "Chapter 3" },
    { startPage: 70, title: "  " },
    { startPage: 82, title: "Duplicate" },
  ]);
  assert.deepEqual(sections.map((item) => item.startPage), [70, 82]);
  assert.equal(sections[0].title, "Section 1");
});

test("buildEvenTargets creates 24 starts across a book", () => {
  const targets = buildEvenTargets(480, 24);
  assert.equal(targets.length, 24);
  assert.equal(targets[0], 1);
  assert.equal(targets.at(-1), 460);
});

test("chooseBoundary uses least distance and lowest page tie-break", () => {
  const sections = [
    createSection({ startPage: 70, title: "Seventy" }),
    createSection({ startPage: 82, title: "Eighty-two" }),
  ];
  assert.equal(chooseBoundary(75, sections).startPage, 70);
  assert.equal(chooseBoundary(76, sections).startPage, 70);
});

test("24-day division keeps section boundaries when there are enough chapters", () => {
  const sectionPages = Array.from({ length: 24 }, (_, index) => index * 10 + 1);
  const book = createBook({
    totalPages: 240,
    dayCount: 24,
    sections: sectionPages.map((page, index) =>
      createSection({ id: `chapter-${index}`, startPage: page, title: `Chapter ${index + 1}` }),
    ),
  });
  const days = calculateDivision(book);
  assert.equal(days.length, 24);
  assert.equal(days[0].startPage, 1);
  assert.ok(days.every((day) => sectionPages.includes(day.startPage)));
  assert.equal(days.at(-1).endPage, 240);
});

test("division includes pages before the first listed section", () => {
  const days = calculateDivision(createBook({
    totalPages: 100,
    dayCount: 4,
    sections: [10, 35, 60, 85].map((page, index) =>
      createSection({ startPage: page, title: `Chapter ${index + 1}` }),
    ),
  }));
  assert.equal(days[0].startPage, 1);
  assert.equal(days[0].sectionTitle, "");
  assert.equal(days[0].endPage, 34);
});

test("one-day and too-many-chapter cases stay deterministic", () => {
  const oneDay = calculateDivision(createBook({ totalPages: 100, dayCount: 1 }));
  assert.equal(oneDay.length, 1);
  assert.equal(oneDay[0].endPage, 100);

  const many = calculateDivision(createBook({
    totalPages: 20,
    dayCount: 30,
    sections: [1, 2, 3, 4].map((page) =>
      createSection({ startPage: page, title: `Chapter ${page}` }),
    ),
  }));
  assert.equal(many.length, 30);
});

test("duplicate, out-of-range, and invalid targets are handled", () => {
  const book = createBook({
    totalPages: 10,
    dayCount: 4,
    sections: [
      createSection({ startPage: 5, title: "Five" }),
      createSection({ startPage: 5, title: "Duplicate" }),
      createSection({ startPage: 99, title: "Out of range" }),
    ],
  });
  const days = calculateDivision(book);
  assert.equal(days.length, 4);
  assert.throws(() => buildEvenTargets(0, 4), RangeError);
});

test("calculated starts never move backwards", () => {
  const book = createBook({
    totalPages: 20,
    dayCount: 30,
    sections: [1, 2, 3, 4].map((page) =>
      createSection({ startPage: page, title: `Chapter ${page}` }),
    ),
  });
  const days = calculateDivision(book);
  assert.equal(days.every((day, index) =>
    index === 0 || day.startPage >= days[index - 1].startPage,
  ), true);
});
