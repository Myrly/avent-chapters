import { createSection } from "../../data/models/section.js";
import { normalizeSections } from "../calculation/normalize.js";
import { EpubParseError } from "./errors.js";
import { resolveArchiveReference } from "./archive-path.js";
import { attribute, cleanText, elements, localName } from "./xml.js";
import { classifyHeading } from "./classify-heading.js";

export async function readNavigationSections(packageData, archive, parseXml) {
  if (packageData.navigationItem) {
    const result = await readEpub3Nav(packageData, archive, parseXml);
    if (result.length) return { sections: result, source: "epub3-nav" };
  }
  if (packageData.ncxItem) {
    const result = await readEpub2Ncx(packageData, archive, parseXml);
    if (result.length) return { sections: result, source: "epub2-ncx" };
  }
  const result = await readSpineHeadings(packageData.spine, archive, parseXml);
  return { sections: result, source: result.length ? "spine-headings" : null };
}

async function readEpub3Nav(packageData, archive, parseXml) {
  const nav = packageData.navigationItem;
  const document = parseXml(await requiredText(archive, nav.path), nav.path);
  const navs = elements(document, "nav");
  const toc = navs.find((element) => attribute(element, "type").split(/\s+/).includes("toc")) ||
    navs.find((element) => elements(element, "a").length);
  if (!toc) return [];
  const links = elements(toc, "a").map((anchor) => ({
    title: cleanText(anchor),
    href: attribute(anchor, "href"),
  })).filter((link) => link.href && link.title);
  return createSections(links, nav.path, packageData.spine, archive);
}

async function readEpub2Ncx(packageData, archive, parseXml) {
  const ncx = packageData.ncxItem;
  const document = parseXml(await requiredText(archive, ncx.path), ncx.path);
  const links = elements(document, "navPoint").map((point) => ({
    title: cleanText(elements(point, "text")[0]),
    href: attribute(elements(point, "content")[0], "src"),
  })).filter((link) => link.href && link.title);
  return createSections(links, ncx.path, packageData.spine, archive);
}

async function readSpineHeadings(spine, archive, parseXml) {
  const headings = [];
  for (const item of spine) {
    if (!["application/xhtml+xml", "text/html"].includes(item.mediaType)) continue;
    const document = parseXml(await requiredText(archive, item.path), item.path);
    const elementsInOrder = [...document.getElementsByTagName("*")];
    const headingElements = elementsInOrder.filter((element) =>
      /^h[1-6]$/i.test(localName(element)),
    );
    headingElements.forEach((element, index) => {
      const title = cleanText(element);
      if (!title) return;
      const id = attribute(element, "id");
      headings.push({
        title,
        href: id ? `${item.path}#${encodeURIComponent(id)}` : item.path,
        spineIndex: item.spineIndex,
        order: index,
        progress: (index + 1) / (headingElements.length + 1),
      });
    });
  }
  return buildSections(headings);
}

function createSections(links, sourcePath, spine, archive) {
  const locations = [];
  const spineOrder = new Map(spine.map((item) => [item.path, item.spineIndex]));
  const seen = new Set();
  for (const [order, link] of links.entries()) {
    const location = resolveArchiveReference(sourcePath, link.href);
    if (location.external) continue;
    if (!archive.has(location.path)) throw new EpubParseError("brokenPackageReference");
    const spineIndex = spineOrder.get(location.path);
    if (spineIndex === undefined) continue;
    const key = `${location.path}#${location.fragment}`;
    if (seen.has(key)) continue;
    seen.add(key);
    locations.push({
      title: link.title,
      href: location.path,
      fragment: location.fragment,
      spineIndex,
      order,
      progress: 0,
    });
  }
  return buildSections(locations);
}

function buildSections(locations) {
  const sorted = locations.sort((left, right) =>
    left.spineIndex - right.spineIndex || left.order - right.order,
  );
  return normalizeSections(sorted.map((location, index) => ({
    id: `epub-section-${index + 1}`,
    title: location.title,
    kind: classifyHeading(location.title),
    startPage: index + 1,
    epubOffset: {
      spineIndex: location.spineIndex,
      progress: location.progress,
      ...(location.fragment ? { fragment: location.fragment } : {}),
    },
  }))).map((section) => createSection({ ...section, startPage: null }));
}

async function requiredText(archive, path) {
  if (!archive.has(path)) throw new EpubParseError("brokenPackageReference");
  return archive.readText(path);
}
