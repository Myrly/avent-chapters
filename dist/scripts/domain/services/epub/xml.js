import { EpubParseError } from "./errors.js";

export function parseXmlDocument(source, path) {
  if (typeof DOMParser === "undefined") throw new EpubParseError("unsupportedBrowser");
  const document = new DOMParser().parseFromString(source, "application/xml");
  if (document.documentElement?.localName === "parsererror" ||
    document.getElementsByTagName("parsererror").length) {
    throw new EpubParseError("malformedXml", path);
  }
  return document;
}

export function elements(node, name) {
  return [...node.getElementsByTagNameNS("*", name)];
}

export function firstElement(node, name) {
  return elements(node, name)[0] || null;
}

export function attribute(node, name) {
  const direct = node?.getAttribute?.(name);
  if (direct) return direct;
  return [...(node?.attributes || [])].find((item) => item.localName === name)?.value || "";
}

export function localName(node) {
  return node.localName || node.nodeName.split(":").at(-1);
}

export function cleanText(node) {
  return String(node?.textContent || "").replace(/\s+/g, " ").trim();
}
