import test from "node:test";
import assert from "node:assert/strict";
import { applyLocale, initializeLocalization, messages } from "../public/scripts/i18n.js";
import { createDocument } from "./helpers/mock-document.js";

test("locale changes update page copy, language, and the one-year cookie", () => {
  const documentRef = createDocument("lang=fr");
  initializeLocalization(documentRef);
  assert.equal(documentRef.documentElement.lang, "fr");
  documentRef.selector.value = "en";
  documentRef.changeListener();
  assert.equal(documentRef.documentElement.lang, "en");
  assert.equal(documentRef.textNode.textContent, messages.en["home.title"]);
  assert.equal(documentRef.labelNode.getAttribute("aria-label"), "Language");
  assert.match(documentRef.cookieWrite, /lang=en; Max-Age=31536000; Path=\/; SameSite=Lax/);
});

test("blocked cookies do not prevent an in-page language change", () => {
  const documentRef = createDocument("");
  Object.defineProperty(documentRef, "cookie", {
    configurable: true,
    get() { throw new Error("Cookies blocked"); },
    set() { throw new Error("Cookies blocked"); },
  });
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    initializeLocalization(documentRef);
    documentRef.selector.value = "en";
    documentRef.changeListener();
    assert.equal(documentRef.documentElement.lang, "en");
    assert.equal(documentRef.textNode.textContent, messages.en["home.title"]);
  } finally {
    console.warn = originalWarn;
  }
});

test("unknown locales use French translations and document language", () => {
  const documentRef = createDocument("");
  applyLocale(documentRef, "es");
  assert.equal(documentRef.documentElement.lang, "fr");
  assert.equal(documentRef.textNode.textContent, messages.fr["home.title"]);
});
