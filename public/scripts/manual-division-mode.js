export function setupDivisionGoalMode(form, onChange) {
  const selector = form.querySelector("[data-division-mode]");
  const dayField = form.querySelector("[data-day-count-field]");
  const pagesField = form.querySelector("[data-pages-per-day-field]");
  const dayInput = dayField.querySelector("input");
  const pagesInput = pagesField.querySelector("input");

  function updateFields() {
    const usesPagesPerDay = selector.value === "pagesPerDay";
    dayField.hidden = usesPagesPerDay;
    dayInput.disabled = usesPagesPerDay;
    dayInput.required = !usesPagesPerDay;
    pagesField.hidden = !usesPagesPerDay;
    pagesInput.disabled = !usesPagesPerDay;
    pagesInput.required = usesPagesPerDay;
  }

  selector.addEventListener("change", () => {
    updateFields();
    onChange();
  });
  updateFields();

  return {
    values: () => ({
      divisionMode: selector.value,
      dayCount: dayInput.value,
      pagesPerDayGoal: pagesInput.value,
    }),
  };
}
