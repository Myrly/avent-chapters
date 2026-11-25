import { messages } from "./i18n-messages.js";
export { messages } from "./i18n-messages.js";

export function localeFromCookie(cookieString) {
  const entry = String(cookieString || "").split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("lang="));
  const value = entry?.slice("lang=".length);
  return value === "en" ? "en" : "fr";
}

export function applyLocale(documentRef, locale) {
  const dictionary = messages[locale] || messages.fr;
  documentRef.documentElement.lang = messages[locale] ? locale : "fr";
  for (const element of documentRef.querySelectorAll("[data-i18n]")) {
    translateAttribute(element, "textContent", element.dataset.i18n, dictionary);
  }
  for (const element of documentRef.querySelectorAll("[data-i18n-aria-label]")) {
    translateAttribute(element, "aria-label", element.dataset.i18nAriaLabel, dictionary);
  }
}

function translateAttribute(element, attribute, key, dictionary) {
  if (Object.hasOwn(dictionary, key)) {
    if (attribute === "textContent") element.textContent = dictionary[key];
    else element.setAttribute(attribute, dictionary[key]);
  } else {
    console.warn(`Missing ${attribute} translation for "${key}" in the selected locale.`);
  }
}

export function initializeLocalization(documentRef) {
  const locale = readLocale(documentRef);
  const selector = documentRef.querySelector("[data-language-selector]");
  applyLocale(documentRef, locale);
  if (!selector) return;
  selector.value = locale;
  selector.addEventListener("change", () => {
    const selected = selector.value === "en" ? "en" : "fr";
    applyLocale(documentRef, selected);
    selector.value = selected;
    persistLocale(documentRef, selected);
  });
}

function readLocale(documentRef) {
  try {
    return localeFromCookie(documentRef.cookie);
  } catch (error) {
    console.warn("Unable to read the language preference cookie; using French.", error);
    return "fr";
  }
}

function persistLocale(documentRef, locale) {
  try {
    documentRef.cookie = `lang=${locale}; Max-Age=31536000; Path=/; SameSite=Lax`;
    if (localeFromCookie(documentRef.cookie) !== locale) {
      console.warn("The language preference was changed for this page but could not be saved.");
    }
  } catch (error) {
    console.warn("The language preference was changed for this page but could not be saved.", error);
  }
}

if (typeof document !== "undefined") initializeLocalization(document);
