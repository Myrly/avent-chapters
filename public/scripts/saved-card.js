export function createSavedCard(record, text, locale) {
  const item = document.createElement("li");
  item.className = "saved-card";
  const heading = document.createElement("h2");
  heading.textContent = record.book.title;
  const meta = document.createElement("p");
  meta.textContent = `${text[`saved.${record.book.source}`]} · ${
    text["saved.days"].replace("{days}", String(record.book.dayCount))}`;
  const updated = document.createElement("p");
  updated.textContent = text["saved.updated"].replace("{date}",
    new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" })
      .format(new Date(record.updatedAt)));
  const actions = document.createElement("div");
  actions.className = "action-row";
  const link = document.createElement("a");
  link.className = "button button-small";
  link.href = `/preview.html?id=${encodeURIComponent(record.id)}`;
  link.textContent = text["saved.open"];
  actions.append(link, actionButton("duplicate", record, text), actionButton("delete", record, text));
  item.append(heading, meta, updated, actions);
  return item;
}

function actionButton(action, record, text) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button button-small button-secondary";
  button.dataset.savedAction = action;
  button.dataset.savedId = record.id;
  button.textContent = text[`saved.${action}`];
  button.setAttribute("aria-label", `${button.textContent} — ${record.book.title}`);
  return button;
}
