import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { localeFromCookie, messages } from "../public/scripts/i18n.js";

test("uses French for missing or invalid preference cookies", () => {
  assert.equal(localeFromCookie(""), "fr");
  assert.equal(localeFromCookie("session=abc; lang=fr"), "fr");
  assert.equal(localeFromCookie("lang=de"), "fr");
  assert.equal(localeFromCookie("lang=en"), "en");
});

test("French and English dictionaries contain the same keys", () => {
  assert.deepEqual(Object.keys(messages.fr).sort(), Object.keys(messages.en).sort());
});

test("footer credit is localized as requested", () => {
  assert.equal(messages.fr["footer.tagline"], "Fait avec le ❤️ - par @Myrly");
  assert.equal(messages.en["footer.tagline"], "Made with ❤️ - by @Myrly");
});

test("manual form names the last story page and story start in both locales", () => {
  assert.equal(messages.fr["manual.total_pages"], "Dernière page de l'histoire");
  assert.equal(messages.en["manual.total_pages"], "Last page of the story");
  assert.equal(messages.fr["manual.story_starts_here"], "Le récit commence sur cette page");
  assert.equal(messages.en["manual.story_starts_here"], "The story starts on this page");
});

test("all current view translation keys exist in both dictionaries", async () => {
  const views = [
    "../src/views/layout.ejs",
    "../src/views/partials/header.ejs",
    "../src/views/partials/footer.ejs",
    "../src/views/index.ejs",
    "../src/views/manual.ejs",
    "../src/views/preview.ejs",
    "../src/views/epub.ejs",
  ];
  const sources = await Promise.all(views.map((path) =>
    readFile(new URL(path, import.meta.url), "utf8"),
  ));
  const keys = sources.flatMap((source) =>
    [...source.matchAll(/data-i18n(?:-aria-label)?="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((key) => !key.includes("<%")),
  );
  keys.push("title.home", "title.manual", "title.preview", "title.epub");
  for (const key of keys) {
    assert.ok(messages.fr[key], `Missing French translation: ${key}`);
    assert.ok(messages.en[key], `Missing English translation: ${key}`);
  }
});

test("manual form and preview messages exist in both locales", () => {
  const keys = [
    "manual.book_title",
    "manual.edition",
    "manual.total_pages",
    "manual.division_mode",
    "manual.goal_by_days",
    "manual.goal_by_pages",
    "manual.day_count",
    "manual.pages_per_day_goal",
    "manual.sections_title",
    "manual.sections_help",
    "manual.add_section",
    "manual.summary",
    "manual.field_page",
    "manual.field_title",
    "manual.section_number",
    "manual.story_starts_here",
    "manual.move_up",
    "manual.move_down",
    "manual.remove",
    "manual.duplicate_pages",
    "manual.confirm_duplicates",
    "manual.submit",
    "manual.error.titleRequired",
    "manual.error.totalPagesInvalid",
    "manual.error.dayCountInvalid",
    "manual.error.pagesPerDayInvalid",
    "manual.error.sectionPageInvalid",
    "manual.error.sectionPageRequired",
    "manual.error.sectionPageOutOfRange",
    "manual.error.confirmDuplicates",
    "manual.error.previewStorageFailed",
    "preview.book_summary",
    "preview.book_summary_pages_goal",
    "preview.no_edition",
    "preview.day",
    "preview.story_start",
    "preview.generic_section",
    "preview.duplicates",
    "preview.storage_error",
    "preview.no_data",
    "preview.invalid_data",
    "preview.back",
  ];
  for (const key of keys) {
    assert.ok(messages.fr[key], `Missing French translation: ${key}`);
    assert.ok(messages.en[key], `Missing English translation: ${key}`);
  }
});

