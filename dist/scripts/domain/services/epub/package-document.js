import { EpubParseError } from "./errors.js";
import { resolveArchiveReference } from "./archive-path.js";
import { attribute, cleanText, elements, firstElement, localName } from "./xml.js";

export function parsePackageDocument(document, packagePath) {
  const root = document.documentElement;
  if (localName(root) !== "package") throw new EpubParseError("invalidPackage");
  const metadata = firstElement(root, "metadata");
  const manifestNode = firstElement(root, "manifest");
  const spineNode = firstElement(root, "spine");
  if (!metadata || !manifestNode || !spineNode) throw new EpubParseError("invalidPackage");

  const manifest = readManifest(manifestNode, packagePath);
  const spine = readSpine(spineNode, manifest);
  const tocId = attribute(spineNode, "toc");
  const navigationItem = [...manifest.values()].find((item) =>
    item.properties.includes("nav"),
  );
  const ncxItem = manifest.get(tocId) ||
    [...manifest.values()].find((item) => item.mediaType === "application/x-dtbncx+xml");

  return {
    title: cleanText(elements(metadata, "title")[0]),
    author: elements(metadata, "creator").map(cleanText).filter(Boolean).join(", "),
    manifest,
    spine,
    navigationItem,
    ncxItem,
  };
}

function readManifest(manifestNode, packagePath) {
  const manifest = new Map();
  for (const element of elements(manifestNode, "item")) {
    const id = attribute(element, "id");
    const href = attribute(element, "href");
    const mediaType = attribute(element, "media-type");
    if (!id || !href || !mediaType || manifest.has(id)) {
      throw new EpubParseError("brokenPackageReference");
    }
    const location = resolveArchiveReference(packagePath, href);
    if (!location.external && !location.path) throw new EpubParseError("brokenPackageReference");
    manifest.set(id, {
      id,
      path: location.path || null,
      external: Boolean(location.external),
      mediaType,
      properties: attribute(element, "properties").split(/\s+/).filter(Boolean),
    });
  }
  if (!manifest.size) throw new EpubParseError("invalidPackage");
  return manifest;
}

function readSpine(spineNode, manifest) {
  return elements(spineNode, "itemref").map((itemref, spineIndex) => {
    const idref = attribute(itemref, "idref");
    const item = manifest.get(idref);
    if (!item || item.external) throw new EpubParseError("brokenPackageReference");
    return { ...item, spineIndex };
  });
}
