import { createSavedStore } from "./domain/services/storage/saved-store.js";
import { createSavedId } from "./domain/services/storage/saved-id.js";

const local = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
};
const session = {
  getItem: (key) => window.sessionStorage.getItem(key),
  setItem: (key, value) => window.sessionStorage.setItem(key, value),
};

export const savedStore = createSavedStore({ local, session, cookies: document });

export function createSavedRecord(book, id = createSavedId()) {
  return { version: 1, id, updatedAt: new Date().toISOString(), book };
}
