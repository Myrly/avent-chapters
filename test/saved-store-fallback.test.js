import test from "node:test";
import assert from "node:assert/strict";
import { createSavedStore } from "../src/services/storage/saved-store.js";
import { savedWarning } from "../public/scripts/saved-status.js";
import { KEY, collection, record, setup } from "./saved-store-fixtures.js";

test("retains a temporary snapshot after local storage recovers without overwriting newer data", () => {
  const { local, session, cookies, store } = setup();
  const set = local.setItem;
  local.setItem(KEY, collection([record("permanent", "Original")]));
  local.setItem = () => { throw new Error("quota"); };
  assert.equal(store.save(record("temporary")).mode, "session");
  local.setItem = set;
  const newer = collection([record("newer", "Updated elsewhere")]);
  local.setItem(KEY, newer);
  const reopened = createSavedStore({ local, session, cookies });
  assert.deepEqual(reopened.read().records.map((item) => item.id), ["temporary", "permanent"]);
  const result = reopened.save(record("extra"));
  assert.equal(savedWarning(result), "saved.temporary");
  assert.equal(local.getItem(KEY), newer);
  assert.equal(result.mode, "session");
});

test("uses per-store memory and warns when both storage mechanisms are blocked", () => {
  const { local, session, cookies, store } = setup();
  local.getItem = local.setItem = session.getItem = session.setItem = () => {
    throw new Error("blocked");
  };
  const result = store.save(record("memory"));
  assert.equal(result.mode, "memory");
  assert.equal(savedWarning(result), "saved.temporary");
  assert.equal(store.read().records[0].id, "memory");
  assert.deepEqual(createSavedStore({ local, session, cookies }).read().records, []);
});

test("warns when a cookie is oversized while retaining the complete local collection", () => {
  const { store, local, cookies } = setup();
  const records = Array.from({ length: 40 }, (_, index) =>
    record(`${String(index).padStart(2, "0")}${"a".repeat(78)}`));
  local.setItem(KEY, collection(records));
  const result = store.save(record("last"));
  assert.equal(result.warning, true);
  assert.equal(result.mode, "local");
  assert.equal(JSON.parse(local.getItem(KEY)).records.length, 41);
  assert.equal(cookies.cookie, "");
});

test("warns when reading or writing cookies throws, without losing the plan", () => {
  const { local, session } = setup();
  const cookies = {
    get cookie() { throw new Error("blocked"); },
    set cookie(value) { throw new Error("blocked"); },
  };
  const store = createSavedStore({ local, session, cookies });
  assert.equal(store.save(record("kept")).warning, true);
  assert.equal(store.read().warning, true);
  assert.equal(store.read().records[0].id, "kept");
});
