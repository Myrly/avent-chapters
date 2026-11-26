import test from "node:test";
import assert from "node:assert/strict";
import { savedWarning } from "../public/scripts/saved-status.js";
import { savedMessages } from "../public/scripts/i18n-saved-messages.js";

test("temporary storage takes precedence over generic warnings in both languages", () => {
  for (const mode of ["session", "memory"]) {
    const key = savedWarning({ mode, warning: true, corrupt: true });
    assert.equal(key, "saved.temporary");
    assert.match(savedMessages.en[key], /temporary copy.*permanent/i);
    assert.match(savedMessages.fr[key], /copie temporaire.*permanents/i);
  }
  assert.equal(savedWarning({ blocked: true, mode: "session" }), "saved.blocked");
  assert.equal(savedWarning({ mode: "local", warning: true }), "saved.warning");
  assert.equal(savedWarning({ mode: "local", corrupt: true }), "saved.corrupt");
  assert.equal(savedWarning({ mode: "local" }), "");
});
