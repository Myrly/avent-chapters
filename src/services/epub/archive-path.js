import { EpubParseError } from "./errors.js";

const archiveOrigin = "https://epub.invalid";

export function resolveArchiveReference(basePath, reference) {
  try {
    const base = new URL("/", archiveOrigin);
    base.pathname = `/${String(basePath).split("/").filter(Boolean).map(encodeURIComponent).join("/")}`;
    const url = new URL(reference, base);
    if (url.origin !== archiveOrigin) return { external: true };
    const path = decodeURIComponent(url.pathname.slice(1));
    if (path.includes("\\") || path.split("/").includes("..") || path.includes("\0")) {
      throw new EpubParseError("invalidArchivePath");
    }
    return {
      path: path.replace(/\/$/, ""),
      fragment: decodeURIComponent(url.hash.slice(1)),
    };
  } catch (error) {
    if (error instanceof EpubParseError) throw error;
    throw new EpubParseError("invalidArchivePath");
  }
}

export function validateArchiveEntryName(name) {
  if (!name || name.startsWith("/") || name.includes("\\") || name.includes("\0") ||
    name.split("/").includes("..")) {
    throw new EpubParseError("invalidArchivePath");
  }
  return name.replace(/\/$/, "");
}
