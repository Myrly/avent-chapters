import { isValidSavedRecord } from "./saved-validation.js";
import { uniqueSavedId } from "./saved-id.js";

export function repairSavedRecords(records, generateId) {
  const valid = records.filter(isValidSavedRecord);
  const reserved = new Set(valid.map((record) => record.id));
  const seen = new Set();
  const repaired = valid.map((record) => {
    if (!seen.has(record.id)) {
      seen.add(record.id);
      return record;
    }
    const id = uniqueSavedId(reserved, generateId);
    reserved.add(id);
    return { ...record, id };
  });
  return {
    records: repaired,
    corrupt: valid.length !== records.length ||
      repaired.some((record, index) => record.id !== valid[index].id),
  };
}

export function quarantineSavedData(key, raw, mode, local, session) {
  if (mode === "memory") return { records: [], mode, warning: true, corrupt: true };
  const storage = mode === "local" ? local : session;
  try {
    if (storage.getItem(`${key}.corrupt`) !== null) {
      return { records: [], mode, warning: true, blocked: true };
    }
    storage.setItem(`${key}.corrupt`, raw);
    storage.setItem(key, JSON.stringify({ version: 1, records: [] }));
    return { records: [], mode, warning: true, corrupt: true };
  } catch (error) {
    console.warn("Unable to quarantine corrupt saved divisions:", error);
    return { records: [], mode, warning: true, blocked: true };
  }
}
