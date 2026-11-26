import { createSavedRecord, savedStore } from "./saved-storage.js";

export function readSavedPreview(id) {
  const result = savedStore.clean();
  if (result.blocked) return { error: "saved.blocked" };
  const record = result.records.find((item) => item.id === id);
  if (!record) return { error: "saved.missing" };
  return { payload: { book: record.book }, warning: result.warning || result.corrupt };
}

export function autosavePreview(payload, key) {
  const record = createSavedRecord(payload.book, payload.savedId);
  const result = savedStore.save(record);
  if (result.blocked) return "saved.blocked";
  try {
    sessionStorage.setItem(key, JSON.stringify({ ...payload, savedId: record.id }));
  } catch (error) {
    console.warn("Unable to preserve the saved preview identity:", error);
    return "saved.warning";
  }
  return result.warning ? "saved.warning" : result.corrupt ? "saved.corrupt" : "saved.auto";
}
