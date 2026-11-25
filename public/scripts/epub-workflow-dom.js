import { messages } from "./i18n-messages.js";

export function findEpubNodes() {
  return {
    result: document.querySelector("[data-epub-result]"),
    error: document.querySelector("[data-epub-error]"),
    status: document.querySelector("[data-epub-status]"),
    title: document.querySelector("[data-epub-title]"),
    author: document.querySelector("[data-epub-author]"),
    sections: document.querySelector("[data-epub-sections]"),
    noHeadings: document.querySelector("[data-epub-no-headings]"),
    noActiveSections: document.querySelector("[data-epub-no-active-sections]"),
    manualLink: document.querySelector("[data-epub-manual]"),
    continueButton: document.querySelector("[data-epub-continue]"),
    plan: document.querySelector("[data-epub-plan]"),
    days: document.querySelector("[data-epub-days]"),
    pageNote: document.querySelector("[data-epub-page-note]"),
  };
}

export function currentMessages() {
  return messages[document.documentElement.lang] || messages.fr;
}
