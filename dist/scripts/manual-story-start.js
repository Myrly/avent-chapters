export function createStoryStartControl(onChange) {
  const label = document.createElement("label");
  label.className = "story-start-control";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "brutal-checkbox";
  checkbox.checked = true;
  checkbox.dataset.storyStart = "";
  const text = document.createElement("span");
  label.append(checkbox, text);
  checkbox.addEventListener("change", onChange);

  return {
    isChecked: () => checkbox.checked,
    refresh(container, labelText) {
      text.textContent = labelText;
      const firstPageRow = [...container.children].find((row) =>
        row.querySelector('[data-section-field="page"]').value.trim(),
      );
      const slot = firstPageRow?.querySelector("[data-story-start-slot]");
      if (slot && label.parentElement !== slot) slot.append(label);
      if (!slot) label.remove();
    },
  };
}
