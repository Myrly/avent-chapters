import { EpubParseError } from "./errors.js";
import { validateArchiveEntryName } from "./archive-path.js";

const END_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const MAX_ENTRIES = 10000;

export function readZipDirectory(view) {
  const endOffset = findEndRecord(view);
  const directory = readDirectoryBounds(view, endOffset);
  return readEntries(view, directory.offset, directory.count, directory.end);
}

function findEndRecord(view) {
  const minimum = Math.max(0, view.byteLength - 22 - 0xffff);
  for (let offset = view.byteLength - 22; offset >= minimum; offset -= 1) {
    if (view.getUint32(offset, true) !== END_SIGNATURE) continue;
    const commentLength = view.getUint16(offset + 20, true);
    if (offset + 22 + commentLength === view.byteLength) return offset;
  }
  throw new EpubParseError("invalidArchive");
}

function readDirectoryBounds(view, endOffset) {
  const disk = view.getUint16(endOffset + 4, true);
  const directoryDisk = view.getUint16(endOffset + 6, true);
  const diskCount = view.getUint16(endOffset + 8, true);
  const count = view.getUint16(endOffset + 10, true);
  const size = view.getUint32(endOffset + 12, true);
  const offset = view.getUint32(endOffset + 16, true);
  if (disk || directoryDisk || diskCount !== count) throw new EpubParseError("invalidArchive");
  if (count === 0xffff || size === 0xffffffff || offset === 0xffffffff) {
    throw new EpubParseError("unsupportedZip64");
  }
  if (count > MAX_ENTRIES || offset + size > endOffset) {
    throw new EpubParseError("invalidArchive");
  }
  return { offset, count, end: offset + size };
}

function readEntries(view, offset, count, end) {
  const entries = [];
  for (let index = 0; index < count; index += 1) {
    if (offset + 46 > end || view.getUint32(offset, true) !== CENTRAL_SIGNATURE) {
      throw new EpubParseError("invalidArchive");
    }
    const flags = view.getUint16(offset + 8, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const recordEnd = offset + 46 + nameLength + extraLength + commentLength;
    if (recordEnd > end) throw new EpubParseError("invalidArchive");
    const nameBytes = new Uint8Array(view.buffer, view.byteOffset + offset + 46, nameLength);
    const rawName = decodeZipName(nameBytes, Boolean(flags & 0x800));
    const name = validateArchiveEntryName(rawName);
    if (name && !rawName.endsWith("/")) entries.push(readEntryFields(view, offset, name, flags));
    offset = recordEnd;
  }
  if (new Set(entries.map((entry) => entry.name)).size !== entries.length) {
    throw new EpubParseError("invalidArchive");
  }
  return entries;
}

function readEntryFields(view, offset, name, flags) {
  return {
    name,
    flags,
    method: view.getUint16(offset + 10, true),
    checksum: view.getUint32(offset + 16, true),
    compressedSize: view.getUint32(offset + 20, true),
    uncompressedSize: view.getUint32(offset + 24, true),
    localOffset: view.getUint32(offset + 42, true),
  };
}

export function decodeZipName(bytes, isUtf8) {
  if (!isUtf8 && bytes.some((byte) => byte > 0x7f)) {
    throw new EpubParseError("unsupportedFilenameEncoding");
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new EpubParseError("invalidArchive");
  }
}
