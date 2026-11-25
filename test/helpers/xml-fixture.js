export function xmlNode(name, attributes = {}, children = [], text = "") {
  const textNode = text
    ? { nodeType: 3, nodeValue: text, textContent: text, childNodes: [] }
    : null;
  const node = {
    nodeType: 1,
    nodeName: name,
    localName: name.split(":").at(-1),
    attributes: Object.entries(attributes).map(([key, value]) => ({
      name: key,
      localName: key.split(":").at(-1),
      value,
    })),
    children,
    childNodes: [...(textNode ? [textNode] : []), ...children],
    getAttribute(key) {
      return attributes[key] || this.attributes.find((item) => item.localName === key)?.value || "";
    },
    get textContent() {
      return text + children.map((child) => child.textContent).join("");
    },
    getElementsByTagNameNS(_namespace, requestedName) {
      return descendants(this).filter((child) =>
        requestedName === "*" || child.localName === requestedName,
      );
    },
  };
  return node;
}

export function xmlDocument(root) {
  return {
    documentElement: root,
    getElementsByTagNameNS(namespace, name) {
      return root.getElementsByTagNameNS(namespace, name);
    },
    getElementsByTagName(name) {
      return root.getElementsByTagNameNS("*", name);
    },
  };
}

export function mapXmlDocuments(documents) {
  return (source) => {
    const document = documents.get(source);
    if (!document) throw new Error(`Unexpected XML fixture: ${source}`);
    return document;
  };
}

function descendants(node) {
  return node.children.flatMap((child) => [child, ...descendants(child)]);
}
