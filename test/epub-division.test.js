import test from "node:test";
import assert from "node:assert/strict";
import { createBook } from "../src/data/models/book.js";
import { createSection } from "../src/data/models/section.js";
import { calculateEpubDivision } from "../src/services/epub/divide.js";
import { classifyHeading } from "../src/services/epub/classify-heading.js";

test("heading classification recognizes common section labels conservatively", () => {
  assert.deepEqual(
    ["Prologue", "Épilogue", "Part One", "Chapitre 2", "Note de l'auteur", "Interlude"]
      .map(classifyHeading),
    ["prologue", "epilogue", "part", "chapter", "author-note", "other"],
  );
});

test("EPUB division balances by characters and estimates print pages when supplied", () => {
  const sections = [0, 250, 500, 750].map((characterOffset, index) =>
    createSection({
      id: `section-${index}`,
      title: `Chapter ${index + 1}`,
      startPage: null,
      epubOffset: { spineIndex: index, characterOffset },
    }),
  );
  const withoutPages = calculateEpubDivision(createBook({
    source: "epub",
    characterCount: 1000,
    dayCount: 4,
    sections,
  }));
  const withPages = calculateEpubDivision(createBook({
    source: "epub",
    characterCount: 1000,
    totalPages: 100,
    dayCount: 4,
    sections,
  }));

  assert.deepEqual(withoutPages.map((day) => day.startCharacterOffset), [0, 250, 500, 750]);
  assert.ok(withoutPages.every((day) => day.startPage === null));
  assert.deepEqual(withPages.map((day) => day.startPage), [1, 26, 51, 76]);
});

test("ignored sections are skipped from reading weights but retain physical positions", () => {
  const sections = [0, 200, 400, 600, 800].map((characterOffset, index) =>
    createSection({
      id: `section-${index}`,
      title: `Section ${index + 1}`,
      startPage: null,
      ignored: index === 1,
      epubOffset: { spineIndex: index, characterOffset },
    }),
  );
  const days = calculateEpubDivision(createBook({
    source: "epub",
    characterCount: 1000,
    totalPages: 100,
    dayCount: 4,
    sections,
  }));
  assert.deepEqual(days.map((day) => day.startCharacterOffset), [0, 400, 600, 800]);
  assert.deepEqual(days.map((day) => day.startPage), [1, 41, 61, 81]);
});

test("ignoring every section produces no division until one is restored", () => {
  const book = createBook({
    source: "epub",
    characterCount: 100,
    dayCount: 4,
    sections: [0, 50].map((characterOffset, index) =>
      createSection({
        title: `Section ${index + 1}`,
        startPage: null,
        ignored: true,
        epubOffset: { spineIndex: index, characterOffset },
      }),
    ),
  });
  assert.deepEqual(calculateEpubDivision(book), []);
  book.sections[0].ignored = false;
  assert.equal(calculateEpubDivision(book).length, 4);
});
