import { xmlDocument, xmlNode, mapXmlDocuments } from "./xml-fixture.js";
import { makeStoredZip } from "./stored-zip.js";

export function createEpubFixture({
  navigation = "epub3",
  headings = true,
  brokenSpine = false,
} = {}) {
  const sources = {
    container: "<container/>",
    package: "<package/>",
    nav: "<nav/>",
    ncx: "<ncx/>",
    chapter1: "<chapter1/>",
    chapter2: "<chapter2/>",
  };
  const manifest = [
    xmlNode("item", { id: "chapter1", href: "text/chapter1.xhtml", "media-type": "application/xhtml+xml" }),
    xmlNode("item", { id: "chapter2", href: "text/chapter2.xhtml", "media-type": "application/xhtml+xml" }),
  ];
  if (navigation === "epub3") {
    manifest.push(xmlNode("item", { id: "nav", href: "nav.xhtml", "media-type": "application/xhtml+xml", properties: "nav" }));
  } else if (navigation === "epub2") {
    manifest.push(xmlNode("item", { id: "ncx", href: "toc.ncx", "media-type": "application/x-dtbncx+xml" }));
  }
  const spine = [
    xmlNode("itemref", { idref: brokenSpine ? "missing" : "chapter1" }),
    xmlNode("itemref", { idref: "chapter2" }),
  ];
  const packageDocument = xmlDocument(xmlNode("package", {}, [
    xmlNode("metadata", {}, [
      xmlNode("dc:title", {}, [], "A Test Book"),
      xmlNode("dc:creator", {}, [], "A. Writer"),
    ]),
    xmlNode("manifest", {}, manifest),
    xmlNode("spine", navigation === "epub2" ? { toc: "ncx" } : {}, spine),
  ]));
  const navDocument = xmlDocument(xmlNode("html", {}, [
    xmlNode("body", {}, [xmlNode("nav", { "epub:type": "toc" }, [
      xmlNode("ol", {}, [
        xmlNode("li", {}, [xmlNode("a", { href: "text/chapter2.xhtml#two" }, [], "Chapter 2")]),
        xmlNode("li", {}, [xmlNode("a", { href: "text/chapter1.xhtml#one" }, [], "Prologue")]),
      ]),
    ])]),
  ]));
  const ncxDocument = createNcxDocument();
  const chapterDocument = xmlDocument(xmlNode("html", {}, [
    xmlNode("body", {}, headings
      ? [xmlNode("h1", { id: "opening" }, [], "Prologue"), xmlNode("h2", { id: "one" }, [], "Chapter 1")]
      : [xmlNode("p", {}, [], "No headings")]),
  ]));
  const documents = new Map([
    [sources.container, xmlDocument(xmlNode("container", {}, [
      xmlNode("rootfile", { "full-path": "OPS/package.opf" }),
    ]))],
    [sources.package, packageDocument],
    [sources.nav, navDocument],
    [sources.ncx, ncxDocument],
    [sources.chapter1, chapterDocument],
    [sources.chapter2, chapterDocument],
  ]);
  const entries = [
    ["mimetype", "application/epub+zip"],
    ["META-INF/container.xml", sources.container],
    ["OPS/package.opf", sources.package],
    ["OPS/text/chapter1.xhtml", sources.chapter1],
    ["OPS/text/chapter2.xhtml", sources.chapter2],
  ];
  if (navigation === "epub3") entries.push(["OPS/nav.xhtml", sources.nav]);
  if (navigation === "epub2") entries.push(["OPS/toc.ncx", sources.ncx]);
  const bytes = makeStoredZip(entries);
  return {
    file: { name: "test-book.epub", arrayBuffer: async () => bytes.buffer },
    parseXml: mapXmlDocuments(documents),
  };
}

function createNcxDocument() {
  const navPoint = (title, src) => xmlNode("navPoint", {}, [
    xmlNode("navLabel", {}, [xmlNode("text", {}, [], title)]),
    xmlNode("content", { src }),
  ]);
  return xmlDocument(xmlNode("ncx", {}, [
    xmlNode("navMap", {}, [
      navPoint("Prologue", "text/chapter1.xhtml#opening"),
      navPoint("Chapter 1", "text/chapter1.xhtml#one"),
      navPoint("Chapter 2", "text/chapter2.xhtml#two"),
    ]),
  ]));
}
