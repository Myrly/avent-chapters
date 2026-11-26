import { isValidSavedRecord, migrateSavedData } from "./saved-validation.js";
import { cookieMatches, updateCookie } from "./saved-cookie.js";
import { createSavedId, uniqueSavedId } from "./saved-id.js";
import { quarantineSavedData, repairSavedRecords } from "./saved-recovery.js";
const KEY = "livrent.saved-divisions";
export function createSavedStore({ local, session, cookies, generateId = createSavedId }) {
  let memory = null;
  function read() {
    let raw;
    let mode = "local";
    try {
      raw = session.getItem(KEY);
      if (raw !== null) mode = "session";
    } catch (error) {
      console.warn("Unable to read temporary saved divisions:", error);
    }
    if (memory !== null) {
      raw = memory;
      mode = "memory";
    }
    try {
      if (mode === "local") raw = local.getItem(KEY);
    } catch (error) {
      console.warn("Local storage unavailable:", error);
      mode = "session";
      try {
        raw = session.getItem(KEY);
      } catch (sessionError) {
        console.warn("Session storage unavailable:", sessionError);
        mode = "memory";
        raw = memory;
      }
    }
    if (raw === null) return { records: [], mode, warning: mode !== "local" };
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      console.warn("Saved division data is corrupt:", error);
      if (mode === "memory") memory = null;
      const result = quarantineSavedData(KEY, raw, mode, local, session);
      return result.blocked ? result : { records: [], ...write([], mode), corrupt: true };
    }
    const data = migrateSavedData(parsed);
    if (!data) return { records: [], mode, warning: true, blocked: true };
    if (data.records.some((record) => Number.isInteger(record?.version) && record.version > 1)) {
      return { records: [], mode, warning: true, blocked: true };
    }
    const { records, corrupt } = repairSavedRecords(data.records, generateId);
    if (corrupt) console.warn("Invalid or duplicate saved divisions were repaired.");
    if (corrupt) return { records, ...write(records, mode), corrupt: true };
    return {
      records, mode, corrupt,
      warning: mode !== "local" || corrupt || !cookieMatches(cookies, records),
    };
  }
  function write(records, mode = "local") {
    const raw = JSON.stringify({ version: 1, records });
    let actualMode = mode;
    if (actualMode === "local") {
      try {
        local.setItem(KEY, raw);
      } catch (error) {
        console.warn("Unable to persist saved divisions locally:", error);
        actualMode = "session";
      }
    }
    if (actualMode === "session") {
      try {
        session.setItem(KEY, raw);
      } catch (error) {
        console.warn("Unable to keep saved divisions in the session:", error);
        actualMode = "memory";
      }
    }
    if (actualMode === "memory") memory = raw;
    return { mode: actualMode, warning: actualMode !== "local" || !updateCookie(cookies, records) };
  }
  function change(operation) {
    const current = read();
    if (current.blocked) return current;
    const records = operation(current.records);
    return { records, ...write(records, current.mode), corrupt: current.corrupt };
  }
  return {
    read,
    save(record) {
      if (!isValidSavedRecord(record)) throw new RangeError("Invalid saved division");
      return change((records) => [record, ...records.filter((item) => item.id !== record.id)]);
    },
    saveNew(record) {
      if (!isValidSavedRecord(record)) throw new RangeError("Invalid saved division");
      let savedId = record.id;
      const result = change((records) => {
        const ids = new Set(records.map((item) => item.id));
        if (ids.has(savedId)) savedId = uniqueSavedId(ids, generateId);
        return [{ ...record, id: savedId }, ...records];
      });
      return { ...result, savedId };
    },
    remove(id) {
      return change((records) => records.filter((record) => record.id !== id));
    },
    clean: read,
  };
}
