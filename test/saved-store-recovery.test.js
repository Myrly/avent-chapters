import test from "node:test";
import assert from "node:assert/strict";
import { createSavedStore } from "../src/services/storage/saved-store.js";
import { KEY, collection, record, setup } from "./saved-store-fixtures.js";

test("repairs duplicate IDs without losing distinct plans or colliding with later IDs", () => {
  const ids = ["reserved", "same", "fresh-one", "fresh-one", "fresh-two"];
  const { local, session, cookies, store } = setup(() => ids.shift());
  local.setItem(KEY, collection([
    record("same", "First"), record("same", "Second"),
    record("reserved", "Third"), record("same", "Fourth"),
  ]));
  const result = store.read();
  assert.equal(result.corrupt, true);
  assert.deepEqual(result.records.map(({ id, book }) => [id, book.title]), [
    ["same", "First"], ["fresh-one", "Second"],
    ["reserved", "Third"], ["fresh-two", "Fourth"],
  ]);
  const reloaded = createSavedStore({ local, session, cookies });
  assert.deepEqual(store.read().records, result.records);
  assert.deepEqual(reloaded.read().records, result.records);
  assert.equal(cookies.cookie, "livrent_saved=same.fresh-one.reserved.fresh-two");
  assert.ok(!cookies.cookie.includes("First"));
});

test("creating a new record retries colliding IDs without replacing an existing plan", () => {
  const ids = ["first", "new"];
  const { store } = setup(() => ids.shift());
  store.save(record("first", "Original"));
  const result = store.saveNew(record("first", "Duplicate"));
  assert.equal(result.savedId, "new");
  assert.deepEqual(store.read().records.map(({ id, book }) => [id, book.title]), [
    ["new", "Duplicate"], ["first", "Original"],
  ]);
});

test("does not mutate saved data if a unique ID cannot be generated", () => {
  const { local, store } = setup(() => "same");
  const raw = collection([record("same", "First"), record("same", "Second")]);
  local.setItem(KEY, raw);
  assert.throws(() => store.clean(), /Unable to generate a unique/);
  assert.equal(local.getItem(KEY), raw);
});

test("quarantines empty JSON instead of treating it as an empty collection", () => {
  const { local, store } = setup();
  local.setItem(KEY, "");
  assert.equal(store.read().corrupt, true);
  assert.equal(local.getItem(`${KEY}.corrupt`), "");
  assert.equal(store.saveNew(record("new")).records.length, 1);
});

test("preserves corrupt data when quarantine is unavailable or already occupied", () => {
  const { local, store } = setup();
  local.setItem(KEY, "{broken");
  local.setItem(`${KEY}.corrupt`, "earlier backup");
  assert.equal(store.save(record("new")).blocked, true);
  assert.equal(local.getItem(KEY), "{broken");
  assert.equal(local.getItem(`${KEY}.corrupt`), "earlier backup");
});

test("preserves unsupported collection and individual record versions", () => {
  for (const raw of [
    collection([record("old")], 0),
    collection([record("future")], 2),
    collection([record("valid"), { ...record("newer"), version: 2 }]),
  ]) {
    const { local, store } = setup();
    local.setItem(KEY, raw);
    assert.equal(store.clean().blocked, true);
    assert.equal(store.save(record("new")).blocked, true);
    assert.equal(local.getItem(KEY), raw);
  }
});
