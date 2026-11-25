import test from "node:test";
import assert from "node:assert/strict";
import { createBook } from "../src/data/models/book.js";
import { createSection } from "../src/data/models/section.js";
import { calculateDivision } from "../src/services/calculation/division.js";

test("sparse sections allow balanced page starts and prefer nearby section starts", () => {
  const sectionPages = [1, 30, 60, 90];
  const days = calculateDivision(createBook({
    totalPages: 100,
    dayCount: 10,
    sections: sectionPages.map((startPage, index) =>
      createSection({ startPage, title: `Chapter ${index + 1}` }),
    ),
  }));
  const starts = days.map((day) => day.startPage);

  assert.deepEqual(starts, [1, 11, 21, 30, 41, 51, 60, 70, 80, 90]);
  assert.equal(days[1].sectionTitle, "Chapter 1");
  assert.equal(days.at(-1).endPage, 100);
});

test("section counts at or above 65 percent keep chapter boundaries", () => {
  const sectionPages = [1, 10, 20, 30, 40, 50, 60];
  const days = calculateDivision(createBook({
    totalPages: 100,
    dayCount: 10,
    sections: sectionPages.map((startPage) => createSection({ startPage })),
  }));

  assert.ok(days.every((day) => sectionPages.includes(day.startPage)));
});
