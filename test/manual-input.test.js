import test from "node:test";
import assert from "node:assert/strict";
import { parseManualBook } from "../src/services/manual-input.js";
import { calculateDivision } from "../src/services/calculation/division.js";

test("parses a manual book into the shared model and normalizes section order", () => {
  const result = parseManualBook({
    title: "  A Book  ",
    author: "  A Writer  ",
    edition: "  Paperback  ",
    totalPages: "240",
    dayCount: "24",
    sections: [
      { page: "42", title: "Second chapter" },
      { page: "1", title: "" },
      { page: "", title: "" },
    ],
  });

  assert.deepEqual(result.issues, []);
  assert.equal(result.book.title, "A Book");
  assert.equal(result.book.author, "A Writer");
  assert.equal(result.book.edition, "Paperback");
  assert.equal(result.book.source, "manual");
  assert.equal(result.book.storyStartPage, 1);
  assert.deepEqual(result.book.sections.map((section) => section.startPage), [1, 42]);
  assert.equal(result.book.sections[0].title, "Section 1");
});

test("reports required fields, partial rows, and invalid integers", () => {
  const result = parseManualBook({
    title: "",
    totalPages: "0",
    dayCount: "2.5",
    sections: [
      { page: "", title: "Chapter without a page" },
      { page: "11", title: "Too late" },
      { page: "3.5", title: "Fractional page" },
    ],
  });

  assert.deepEqual(result.issues.map((issue) => issue.code), [
    "titleRequired",
    "totalPagesInvalid",
    "dayCountInvalid",
    "sectionPageRequired",
    "sectionPageInvalid",
  ]);
});

test("rejects section pages beyond the total page count", () => {
  const result = parseManualBook({
    title: "Short book",
    totalPages: "10",
    dayCount: "2",
    sections: [{ page: "11", title: "Beyond the end" }],
  });
  assert.deepEqual(result.issues.map((issue) => issue.code), ["sectionPageOutOfRange"]);
});

test("uses the first entered section as the story start only when selected", () => {
  const input = {
    title: "Front matter",
    totalPages: "100",
    dayCount: "4",
    sections: [10, 35, 60, 85].map((page, index) => ({
      page: String(page),
      title: `Chapter ${index + 1}`,
    })),
  };
  const storyStartsAtSection = parseManualBook({
    ...input,
    storyStartsAtFirstSection: true,
  });
  const storyStartsAtPageOne = parseManualBook({
    ...input,
    storyStartsAtFirstSection: false,
  });
  const noEnteredSections = parseManualBook({
    ...input,
    sections: [],
    storyStartsAtFirstSection: true,
  });

  assert.equal(storyStartsAtSection.book.storyStartPage, 10);
  assert.equal(calculateDivision(storyStartsAtSection.book)[0].startPage, 10);
  assert.equal(storyStartsAtPageOne.book.storyStartPage, 1);
  assert.equal(calculateDivision(storyStartsAtPageOne.book)[0].startPage, 1);
  assert.equal(noEnteredSections.book.storyStartPage, 1);
});

test("requires explicit duplicate confirmation and keeps the first section", () => {
  const input = {
    title: "Duplicate starts",
    totalPages: "100",
    dayCount: "4",
    sections: [
      { page: "1", title: "Opening" },
      { page: "20", title: "First at twenty" },
      { page: "20", title: "Duplicate at twenty" },
    ],
  };
  const unconfirmed = parseManualBook(input);
  assert.equal(unconfirmed.book, null);
  assert.deepEqual(unconfirmed.duplicatePages, [20]);
  assert.ok(unconfirmed.issues.some((issue) => issue.code === "confirmDuplicates"));

  const confirmed = parseManualBook(input, { confirmDuplicates: true });
  assert.deepEqual(confirmed.issues, []);
  assert.deepEqual(
    confirmed.book.sections.map((section) => section.title),
    ["Opening", "First at twenty"],
  );
});
