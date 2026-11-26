export function createSavedId() {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function uniqueSavedId(ids, generateId) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const id = generateId();
    if (typeof id === "string" && /^[a-zA-Z0-9-]{1,80}$/.test(id) && !ids.has(id)) {
      return id;
    }
  }
  throw new Error("Unable to generate a unique saved division ID");
}
