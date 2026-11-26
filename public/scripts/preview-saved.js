import { createSavedRecord, savedStore } from "./saved-storage.js";
import { savedWarning } from "./saved-status.js";

export function readSavedPreview(id) {
  const result = savedStore.clean();
  if (result.blocked) return { error: "saved.blocked" };
  const record = result.records.find((item) => item.id === id);
  if (!record) return { error: "saved.missing" };
  return { payload: { book: record.book }, warning: savedWarning(result) };
}

export function autosavePreview(payload, key) {
  const record = createSavedRecord(payload.book, payload.savedId);
  const result = payload.savedId ? savedStore.save(record) : savedStore.saveNew(record);
  if (result.blocked) return "saved.blocked";
  try {
    sessionStorage.setItem(key, JSON.stringify({
      ...payload, savedId: result.savedId || record.id,
    }));
  } catch (error) {
    console.warn("Unable to preserve the saved preview identity:", error);
    return savedWarning(result) || "saved.warning";
  }
  return savedWarning(result) || "saved.auto";
}
