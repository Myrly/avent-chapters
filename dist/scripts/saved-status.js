export function savedWarning(result) {
  if (result.blocked) return "saved.blocked";
  if (result.mode === "session" || result.mode === "memory") return "saved.temporary";
  if (result.warning) return "saved.warning";
  if (result.corrupt) return "saved.corrupt";
  return "";
}
