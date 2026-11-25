import { EpubParseError } from "./errors.js";
import { crc32 } from "./crc32.js";
import { decodeZipName } from "./zip-directory.js";

const LOCAL_SIGNATURE = 0x04034b50;
const MAX_TEXT_ENTRY_SIZE = 10 * 1024 * 1024;

export async function readZipEntry(bytes, view, entry) {
  if (entry.flags & 0x41) throw new EpubParseError("encryptedArchive");
  const offset = entry.localOffset;
  if (offset + 30 > view.byteLength || view.getUint32(offset, true) !== LOCAL_SIGNATURE) {
    throw new EpubParseError("invalidArchive");
  }
  const nameLength = view.getUint16(offset + 26, true);
  const extraLength = view.getUint16(offset + 28, true);
  const headerEnd = offset + 30 + nameLength + extraLength;
  if (headerEnd > view.byteLength) throw new EpubParseError("invalidArchive");
  const localName = decodeZipName(
    bytes.subarray(offset + 30, offset + 30 + nameLength),
    Boolean(entry.flags & 0x800),
  );
  if (localName !== entry.name || !headerMatches(view, offset, entry)) {
    throw new EpubParseError("invalidArchive");
  }
  const end = headerEnd + entry.compressedSize;
  if (end > view.byteLength) throw new EpubParseError("invalidArchive");
  const compressed = bytes.subarray(headerEnd, end);
  if (entry.method === 0) {
    return verifyEntry(compressed.slice(), entry);
  }
  if (entry.method !== 8 || typeof DecompressionStream === "undefined") {
    throw new EpubParseError("unsupportedCompression");
  }
  try {
    const stream = new Blob([compressed]).stream()
      .pipeThrough(new DecompressionStream("deflate-raw"));
    return verifyEntry(await readBounded(stream, entry.uncompressedSize), entry);
  } catch (error) {
    if (error instanceof EpubParseError) throw error;
    throw new EpubParseError("invalidArchive");
  }
}

function headerMatches(view, offset, entry) {
  return view.getUint16(offset + 6, true) === entry.flags &&
    view.getUint16(offset + 8, true) === entry.method;
}

async function readBounded(stream, expectedSize) {
  const reader = stream.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > expectedSize || size > MAX_TEXT_ENTRY_SIZE) {
      await reader.cancel();
      throw new EpubParseError("invalidArchive");
    }
    chunks.push(value);
  }
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function verifyEntry(bytes, entry) {
  if (bytes.length !== entry.uncompressedSize || crc32(bytes) !== entry.checksum) {
    throw new EpubParseError("invalidArchive");
  }
  return bytes;
}
