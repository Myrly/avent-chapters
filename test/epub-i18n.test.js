import test from "node:test";
import assert from "node:assert/strict";
import { messages } from "../public/scripts/i18n-messages.js";

test("EPUB page count, ignored sections, and reading-plan copy is localized", () => {
  const keys = [
    "epub.total_pages",
    "epub.page_goal_help",
    "epub.page_note_with_pages",
    "epub.page_note_characters",
    "epub.ignore_section",
    "epub.restore_section",
    "epub.ignore_aria",
    "epub.restore_aria",
    "epub.plan_title",
    "epub.no_active_sections",
    "epub.day_start_page",
    "epub.day_start_text",
    "epub.beginning",
    "epub.error.totalPagesInvalid",
    "epub.error.totalPagesRequired",
    "epub.error.dayCountInvalid",
    "epub.error.pagesPerDayInvalid",
    "epub.error.noReadableText",
    "epub.error.invalidPlan",
  ];
  for (const key of keys) {
    assert.ok(messages.fr[key], `Missing French translation: ${key}`);
    assert.ok(messages.en[key], `Missing English translation: ${key}`);
  }
});
