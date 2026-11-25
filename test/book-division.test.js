import test from "node:test";
import assert from "node:assert/strict";
import { createBook } from "../src/data/models/book.js";
import { createSection } from "../src/data/models/section.js";
import { calculateBookDivision } from "../src/services/calculation/book-division.js";

test("manual and EPUB books produce a common day-division shape", () => {
  const manual = createBook({
    totalPages: 40,
    dayCount: 2,
    sections: [1, 21].map((startPage) => createSection({ startPage })),
  });
  const epub = createBook({
    source: "epub",
    characterCount: 100,
    dayCount: 2,
    sections: [0, 50].map((characterOffset, index) =>
      createSection({
        startPage: null,
        epubOffset: { spineIndex: index, characterOffset },
      }),
    ),
  });

  for (const days of [calculateBookDivision(manual), calculateBookDivision(epub)]) {
    assert.equal(days.length, 2);
    for (const day of days) {
      for (const key of ["day", "startPage", "endPage", "sectionTitle", "targetPage", "adjusted"]) {
        assert.ok(Object.hasOwn(day, key), `Missing division field: ${key}`);
      }
    }
  }
});
