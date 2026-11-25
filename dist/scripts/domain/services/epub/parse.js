import { createBook } from "../../data/models/book.js";
import { parsePackageDocument } from "./package-document.js";
import { readNavigationSections } from "./navigation.js";
import { EpubParseError } from "./errors.js";
import { resolveArchiveReference } from "./archive-path.js";
import { openZipArchive } from "./zip-archive.js";
import { attribute, elements, parseXmlDocument } from "./xml.js";
import { measureEpubSections } from "./measure-sections.js";

export async function parseEpubFile(file, { parseXml = parseXmlDocument } = {}) {
  const fileName = String(file?.name || "book.epub");
  if (!/\.epub$/i.test(fileName)) throw new EpubParseError("invalidFileType");
  let bytes;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    throw new EpubParseError("fileReadFailed");
  }

  const archive = await openZipArchive(bytes);
  await validateMimetype(archive);
  const packagePath = await readPackagePath(archive, parseXml);
  const packageDocument = parseXml(await requiredText(archive, packagePath), packagePath);
  const packageData = parsePackageDocument(packageDocument, packagePath);
  validateSpineResources(archive, packageData.spine);
  const navigation = await readNavigationSections(packageData, archive, parseXml);
  const measured = await measureEpubSections(
    navigation.sections,
    packageData.spine,
    archive,
    parseXml,
  );
  const book = createBook({
    title: packageData.title || fallbackTitle(fileName),
    author: packageData.author,
    totalPages: null,
    characterCount: measured.characterCount,
    source: "epub",
    sections: measured.sections,
  });
  return {
    book,
    file,
    headingSource: navigation.source,
    hasHeadings: navigation.sections.length > 0,
  };
}

async function validateMimetype(archive) {
  const entry = archive.entries.find((item) => item.name === "mimetype");
  if (!entry || entry.localOffset !== 0 || entry.method !== 0 ||
    await archive.readText("mimetype") !== "application/epub+zip") {
    throw new EpubParseError("invalidMimetype");
  }
}

async function readPackagePath(archive, parseXml) {
  if (!archive.has("META-INF/container.xml")) throw new EpubParseError("invalidContainer");
  const document = parseXml(await archive.readText("META-INF/container.xml"), "container.xml");
  const rootfile = elements(document, "rootfile")[0];
  const fullPath = attribute(rootfile, "full-path");
  if (!fullPath) throw new EpubParseError("missingRootfile");
  const location = resolveArchiveReference("", fullPath);
  if (location.external || !archive.has(location.path)) {
    throw new EpubParseError("missingRootfile");
  }
  return location.path;
}

function validateSpineResources(archive, spine) {
  if (!spine.length) throw new EpubParseError("invalidPackage");
  if (spine.some((item) => !archive.has(item.path))) {
    throw new EpubParseError("brokenPackageReference");
  }
}

async function requiredText(archive, path) {
  if (!archive.has(path)) throw new EpubParseError("brokenPackageReference");
  return archive.readText(path);
}

function fallbackTitle(fileName) {
  return fileName.replace(/\.epub$/i, "").trim() || "Untitled book";
}
