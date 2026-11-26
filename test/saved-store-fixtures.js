import { createBook } from "../src/data/models/book.js";
import { createSavedStore } from "../src/services/storage/saved-store.js";

export const KEY = "livrent.saved-divisions";

export function storage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
}

export function setup(generateId) {
  const local = storage();
  const session = storage();
  const cookies = {
    value: "",
    get cookie() { return this.value; },
    set cookie(value) { this.value = value.split(";")[0]; },
  };
  return { local, session, cookies, store: createSavedStore({ local, session, cookies, generateId }) };
}

export function record(id, title = "A book") {
  return {
    version: 1, id, updatedAt: "2026-01-01T00:00:00.000Z",
    book: createBook({ title, totalPages: 40, dayCount: 2 }),
  };
}

export function collection(records, version = 1) {
  return JSON.stringify({ version, records });
}
