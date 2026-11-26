import { isValidSavedRecord, migrateSavedData } from "./saved-validation.js";
import { cookieMatches, updateCookie } from "./saved-cookie.js";
const KEY = "livrent.saved-divisions";
let memory = null;
export function createSavedStore({ local, session, cookies }) {
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
    if (!raw) return { records: [], mode, warning: mode !== "local" };
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      console.warn("Saved division data is corrupt:", error);
      return quarantine(raw, mode, local, session);
    }
    const data = migrateSavedData(parsed);
    if (!data) return { records: [], mode, warning: true, blocked: true };
    if (data.records.some((record) => Number.isInteger(record?.version) && record.version > 1)) {
      return { records: [], mode, warning: true, blocked: true };
    }
    const ids = new Set();
    const records = data.records.filter((record) => {
      if (!isValidSavedRecord(record) || ids.has(record.id)) return false;
      ids.add(record.id);
      return true;
    });
    const corrupt = records.length !== data.records.length;
    if (corrupt) console.warn("Invalid saved divisions were omitted.");
    return {
      records, mode, corrupt,
      warning: mode !== "local" || corrupt || !cookieMatches(cookies, records),
    };
  }
  function quarantine(raw, mode, local, session) {
    if (mode === "memory") {
      memory = null;
      return { records: [], mode, warning: true, corrupt: true };
    }
    const storage = mode === "local" ? local : session;
    try {
      if (storage.getItem(`${KEY}.corrupt`) !== null) {
        return { records: [], mode, warning: true, blocked: true };
      }
      storage.setItem(`${KEY}.corrupt`, raw);
      storage.setItem(KEY, JSON.stringify({ version: 1, records: [] }));
      return { records: [], mode, warning: true, corrupt: true };
    } catch (error) {
      console.warn("Unable to quarantine corrupt saved divisions:", error);
      return { records: [], mode, warning: true, blocked: true };
    }
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
    remove(id) {
      return change((records) => records.filter((record) => record.id !== id));
    },
    clean() {
      const current = read();
      if (!current.corrupt || current.blocked) return current;
      return { records: current.records, ...write(current.records, current.mode), corrupt: true };
    },
  };
}
