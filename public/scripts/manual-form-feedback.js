export function renderManualIssues(errors, issues, dictionary) {
  errors.replaceChildren();
  for (const issue of issues) {
    const item = document.createElement("li");
    item.textContent = dictionary[`manual.error.${issue.code}`]
      .replace("{row}", String(issue.row || ""));
    errors.append(item);
  }
  errors.hidden = issues.length === 0;
}

export function renderDuplicatePageNotice(confirmation, duplicatePages, pages, dictionary) {
  confirmation.hidden = false;
  duplicatePages.textContent = dictionary["manual.duplicate_pages"]
    .replace("{pages}", pages.join(", "));
}
