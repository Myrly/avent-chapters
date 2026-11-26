import { createSavedStore } from "./domain/services/storage/saved-store.js";

const local = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
};
const session = {
  getItem: (key) => window.sessionStorage.getItem(key),
  setItem: (key, value) => window.sessionStorage.setItem(key, value),
};

export const savedStore = createSavedStore({ local, session, cookies: document });

export function createSavedRecord(book, id = createId()) {
  return { version: 1, id, updatedAt: new Date().toISOString(), book };
}

function createId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
