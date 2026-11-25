import { deflateRawSync } from "node:zlib";

export function makeStoredZip(entries) {
  return makeZip(entries, false);
}

export function makeDeflatedZip(entries) {
  return makeZip(entries, true);
}

function makeZip(entries, deflated) {
  const localParts = [];
  const centralParts = [];
  let localOffset = 0;
  for (const [name, text] of entries) {
    const nameBytes = new TextEncoder().encode(name);
    const content = new TextEncoder().encode(text);
    const compressed = deflated ? deflateRawSync(content) : content;
    const checksum = crc32(content);
    const local = new Uint8Array(30);
    write32(local, 0, 0x04034b50);
    write16(local, 4, 20);
    write16(local, 6, 0x800);
    write16(local, 8, deflated ? 8 : 0);
    write16(local, 26, nameBytes.length);
    write32(local, 14, checksum);
    write32(local, 18, compressed.length);
    write32(local, 22, content.length);
    localParts.push(local, nameBytes, compressed);

    const central = new Uint8Array(46);
    write32(central, 0, 0x02014b50);
    write16(central, 4, 20);
    write16(central, 6, 20);
    write16(central, 8, 0x800);
    write16(central, 10, deflated ? 8 : 0);
    write32(central, 16, checksum);
    write32(central, 20, compressed.length);
    write32(central, 24, content.length);
    write16(central, 28, nameBytes.length);
    write32(central, 42, localOffset);
    centralParts.push(central, nameBytes);
    localOffset += local.length + nameBytes.length + compressed.length;
  }
  const directory = concatenate(centralParts);
  const end = new Uint8Array(22);
  write32(end, 0, 0x06054b50);
  write16(end, 8, entries.length);
  write16(end, 10, entries.length);
  write32(end, 12, directory.length);
  write32(end, 16, localOffset);
  return concatenate([...localParts, directory, end]);
}

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
    }
  }
  return (value ^ 0xffffffff) >>> 0;
}

function write16(bytes, offset, value) {
  new DataView(bytes.buffer).setUint16(offset, value, true);
}

function write32(bytes, offset, value) {
  new DataView(bytes.buffer).setUint32(offset, value >>> 0, true);
}

function concatenate(parts) {
  const result = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}
