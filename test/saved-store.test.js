import test from "node:test";
import assert from "node:assert/strict";
import { createSavedStore } from "../src/services/storage/saved-store.js";
import { createBook } from "../src/data/models/book.js";

function storage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
}

function setup() {
  const local = storage();
  const session = storage();
  const cookies = {
    value: "",
    get cookie() { return this.value; },
    set cookie(value) { this.value = value.split(";")[0]; },
  };
  return { local, session, cookies, store: createSavedStore({ local, session, cookies }) };
}

function record(id, title = "A book") {
  return {
    version: 1, id, updatedAt: "2026-01-01T00:00:00.000Z",
    book: createBook({ title, totalPages: 40, dayCount: 2 }),
  };
}

test("saves, reloads, duplicates and deletes records without cookie book details", () => {
  const { local, session, cookies, store } = setup();
  store.save(record("first", "Private title"));
  store.save(record("second", "Private title"));
  const reloaded = createSavedStore({ local, session, cookies });
  assert.deepEqual(reloaded.read().records.map((item) => item.id), ["second", "first"]);
  assert.equal(cookies.cookie, "livrent_saved=second.first");
  assert.ok(!cookies.cookie.includes("Private"));
  reloaded.remove("first");
  assert.deepEqual(reloaded.read().records.map((item) => item.id), ["second"]);
});

test("keeps changes in session and warns when persistent storage is blocked", () => {
  const { local, session, cookies } = setup();
  local.setItem = () => { throw new Error("quota"); };
  const store = createSavedStore({ local, session, cookies });
  const result = store.save(record("fallback"));
  assert.equal(result.mode, "session");
  assert.equal(result.warning, true);
  assert.equal(createSavedStore({ local, session, cookies }).read().records[0].id, "fallback");
});

test("cleans invalid individual records and preserves unsupported data", () => {
  const { local, store } = setup();
  local.setItem("livrent.saved-divisions", JSON.stringify({
    version: 1, records: [record("good"), { version: 1, id: "bad" }],
  }));
  const cleaned = store.clean();
  assert.equal(cleaned.corrupt, true);
  assert.deepEqual(store.read().records.map((item) => item.id), ["good"]);
  const future = JSON.stringify({ version: 99, records: [] });
  local.setItem("livrent.saved-divisions", future);
  assert.equal(store.save(record("new")).blocked, true);
  assert.equal(local.getItem("livrent.saved-divisions"), future);
});

test("quarantines malformed data without discarding it", () => {
  const { local, store } = setup();
  local.setItem("livrent.saved-divisions", "{broken");
  assert.equal(store.read().corrupt, true);
  assert.equal(local.getItem("livrent.saved-divisions.corrupt"), "{broken");
  assert.equal(store.save(record("new")).records.length, 1);
});

test("warns when cookies are blocked without losing locally saved records", () => {
  const { local, session } = setup();
  const cookies = { get cookie() { return ""; }, set cookie(value) {} };
  const store = createSavedStore({ local, session, cookies });
  assert.equal(store.save(record("cookie-blocked")).warning, true);
  assert.equal(store.read().records[0].id, "cookie-blocked");
  assert.equal(store.read().warning, true);
});
