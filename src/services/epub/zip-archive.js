import { EpubParseError } from "./errors.js";
import { readZipDirectory } from "./zip-directory.js";
import { readZipEntry } from "./zip-entry.js";
const MAX_TEXT_ENTRY_SIZE = 10 * 1024 * 1024;
const MAX_TEXT_TOTAL_SIZE = 50 * 1024 * 1024;

export async function openZipArchive(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const entries = readZipDirectory(view);
  const byName = new Map(entries.map((entry) => [entry.name, entry]));
  const cache = new Map();
  let totalTextSize = 0;

  async function readText(path) {
    if (cache.has(path)) return cache.get(path);
    const entry = byName.get(path);
    if (!entry) throw new EpubParseError("missingResource");
    if (entry.uncompressedSize > MAX_TEXT_ENTRY_SIZE) {
      throw new EpubParseError("resourceTooLarge");
    }
    totalTextSize += entry.uncompressedSize;
    if (totalTextSize > MAX_TEXT_TOTAL_SIZE) throw new EpubParseError("archiveTooLarge");
    const text = decodeText(await readZipEntry(bytes, view, entry));
    cache.set(path, text);
    return text;
  }

  return { entries, has: (path) => byName.has(path), readText };
}

function decodeText(bytes) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new EpubParseError("invalidTextEncoding");
  }
}
