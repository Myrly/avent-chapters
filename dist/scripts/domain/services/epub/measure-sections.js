import { createSection } from "../../data/models/section.js";
import { attribute, elements } from "./xml.js";

export async function measureEpubSections(sections, spine, archive, parseXml) {
  const spineMetrics = new Map();
  let characterCount = 0;
  for (const item of spine) {
    if (!["application/xhtml+xml", "text/html"].includes(item.mediaType)) continue;
    const document = parseXml(await archive.readText(item.path), item.path);
    const body = elements(document, "body")[0] || document.documentElement;
    const fragments = new Set(sections
      .filter((section) => section.epubOffset.spineIndex === item.spineIndex)
      .map((section) => section.epubOffset.fragment)
      .filter(Boolean));
    const fragmentOffsets = collectFragmentOffsets(body, fragments);
    const length = body.textContent.length;
    spineMetrics.set(item.spineIndex, { start: characterCount, length, fragmentOffsets });
    characterCount += length;
  }
  return {
    characterCount,
    sections: sections.map((section) => applyCharacterOffset(section, spineMetrics)),
  };
}

function collectFragmentOffsets(root, fragments) {
  const offsets = new Map();
  let characterOffset = 0;
  function visit(node) {
    if (node.nodeType === 3) {
      characterOffset += node.nodeValue.length;
      return;
    }
    const id = attribute(node, "id") || attribute(node, "name");
    if (fragments.has(id)) offsets.set(id, characterOffset);
    for (const child of node.childNodes) visit(child);
  }
  visit(root);
  return offsets;
}

function applyCharacterOffset(section, metrics) {
  const offset = section.epubOffset;
  const spine = metrics.get(offset.spineIndex) || { start: 0, fragmentOffsets: new Map() };
  const localOffset = spine.fragmentOffsets.get(offset.fragment) || 0;
  return createSection({
    ...section,
    epubOffset: { ...offset, characterOffset: spine.start + localOffset },
  });
}
