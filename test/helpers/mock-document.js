export function createDocument(initialCookie = "") {
  const documentRef = {
    documentElement: { lang: "" },
    textNode: { dataset: { i18n: "home.title" }, textContent: "French fallback" },
    labelNode: {
      dataset: { i18nAriaLabel: "language.label" },
      setAttribute(name, value) { this[name] = value; },
      getAttribute(name) { return this[name]; },
    },
    selector: {
      value: "",
      addEventListener(_event, listener) { documentRef.changeListener = listener; },
    },
    cookieWrite: "",
    querySelectorAll(selector) {
      return selector.includes("aria-label") ? [this.labelNode] : [this.textNode];
    },
    querySelector() { return this.selector; },
  };
  let cookie = initialCookie;
  Object.defineProperty(documentRef, "cookie", {
    configurable: true,
    get() { return cookie; },
    set(value) {
      documentRef.cookieWrite = value;
      cookie = value.split(";")[0];
    },
  });
  return documentRef;
}
