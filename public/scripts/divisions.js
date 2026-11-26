import { messages } from "./i18n-messages.js";
import { createSavedCard } from "./saved-card.js";
import { createSavedRecord, savedStore } from "./saved-storage.js";

const list = document.querySelector("[data-saved-list]");
const warning = document.querySelector("[data-saved-warning]");
const notice = document.querySelector("[data-saved-notice]");
let result = savedStore.clean();
let noticeKey = "";
render();

list.addEventListener("click", (event) => {
  const button = event.target.closest("[data-saved-action]");
  if (!button) return;
  const record = result.records.find((item) => item.id === button.dataset.savedId);
  if (!record) return;
  const text = dictionary();
  if (button.dataset.savedAction === "delete") {
    if (!window.confirm(text["saved.confirm"].replace("{title}", record.book.title))) return;
    result = savedStore.remove(record.id);
    noticeKey = result.blocked ? "" : "saved.delete_done";
  } else {
    result = savedStore.save(createSavedRecord(record.book));
    noticeKey = result.blocked ? "" : "saved.duplicate_done";
  }
  render();
});
document.querySelector("[data-language-selector]")?.addEventListener("change", render);

function render() {
  const text = dictionary();
  const locale = document.documentElement.lang;
  list.replaceChildren(...result.records.map((record) => createSavedCard(record, text, locale)));
  document.querySelector("[data-saved-empty]").hidden = result.records.length > 0 || result.blocked;
  const warningKey = result.blocked ? "saved.blocked" :
    result.warning ? "saved.warning" : result.corrupt ? "saved.corrupt" : "";
  warning.hidden = !warningKey;
  warning.textContent = warningKey ? text[warningKey] : "";
  notice.hidden = !noticeKey;
  notice.textContent = noticeKey ? text[noticeKey] : "";
}

function dictionary() {
  return messages[document.documentElement.lang] || messages.fr;
}
