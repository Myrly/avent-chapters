import test from "node:test";
import assert from "node:assert/strict";
import { parseEpubFile } from "../src/services/epub/parse.js";
import { EpubParseError } from "../src/services/epub/errors.js";
import { resolveArchiveReference, validateArchiveEntryName } from "../src/services/epub/archive-path.js";
import { createEpubFixture } from "./helpers/epub-fixture.js";
import { openZipArchive } from "../src/services/epub/zip-archive.js";
import { makeDeflatedZip, makeStoredZip } from "./helpers/stored-zip.js";

test("EPUB 3 nav headings become ordered shared sections with spine offsets", async () => {
  const fixture = createEpubFixture();
  const result = await parseEpubFile(fixture.file, { parseXml: fixture.parseXml });
  assert.equal(result.book.title, "A Test Book");
  assert.equal(result.book.author, "A. Writer");
  assert.equal(result.book.totalPages, null);
  assert.ok(result.book.characterCount > 0);
  assert.equal(result.headingSource, "epub3-nav");
  assert.ok(result.book.sections.every((section) => section.startPage === null));
  assert.ok(result.book.sections.every((section) =>
    Number.isInteger(section.epubOffset.characterOffset),
  ));
  assert.deepEqual(result.book.sections.map((section) => section.title), ["Prologue", "Chapter 2"]);
  assert.deepEqual(result.book.sections.map((section) => section.epubOffset.spineIndex), [0, 1]);
  assert.deepEqual(result.book.sections.map((section) => section.kind), ["prologue", "chapter"]);
});

test("EPUB 2 NCX navigation is used when there is no EPUB 3 nav", async () => {
  const fixture = createEpubFixture({ navigation: "epub2" });
  const result = await parseEpubFile(fixture.file, { parseXml: fixture.parseXml });
  assert.equal(result.headingSource, "epub2-ncx");
  assert.deepEqual(result.book.sections.map((section) => section.title), [
    "Prologue", "Chapter 1", "Chapter 2",
  ]);
});

test("spine XHTML headings are used when navigation is missing", async () => {
  const fixture = createEpubFixture({ navigation: "none" });
  const result = await parseEpubFile(fixture.file, { parseXml: fixture.parseXml });
  assert.equal(result.headingSource, "spine-headings");
  assert.deepEqual(result.book.sections.slice(0, 2).map((section) => section.title), [
    "Prologue", "Chapter 1",
  ]);
});

test("no headings returns a manual fallback without discarding the selected file", async () => {
  const fixture = createEpubFixture({ navigation: "none", headings: false });
  const result = await parseEpubFile(fixture.file, { parseXml: fixture.parseXml });
  assert.equal(result.hasHeadings, false);
  assert.equal(result.file, fixture.file);
  assert.equal(result.book.totalPages, null);
  assert.deepEqual(result.book.sections, []);
});

test("invalid spine references and archive paths fail explicitly", async () => {
  const fixture = createEpubFixture({ brokenSpine: true });
  await assert.rejects(
    parseEpubFile(fixture.file, { parseXml: fixture.parseXml }),
    (error) => error instanceof EpubParseError && error.code === "brokenPackageReference",
  );
  assert.throws(() => validateArchiveEntryName("../outside"), EpubParseError);
  assert.throws(
    () => resolveArchiveReference("OPS/nav.xhtml", "%2e%2e%2foutside"),
    EpubParseError,
  );
  assert.equal(resolveArchiveReference("OPS/nav.xhtml", "https://example.com/book").external, true);
});

test("ZIP reading supports deflate and verifies entry checksums", async () => {
  const deflated = await openZipArchive(makeDeflatedZip([["chapter.xhtml", "Chapter text"]]));
  assert.equal(await deflated.readText("chapter.xhtml"), "Chapter text");

  const corrupted = makeStoredZip([["chapter.xhtml", "Chapter text"]]);
  const view = new DataView(corrupted.buffer);
  const directoryOffset = view.getUint32(corrupted.length - 6, true);
  view.setUint32(directoryOffset + 16, 0, true);
  const archive = await openZipArchive(corrupted);
  await assert.rejects(archive.readText("chapter.xhtml"), (error) =>
    error instanceof EpubParseError && error.code === "invalidArchive",
  );
});

