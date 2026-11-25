export function classifyHeading(title) {
  const normalized = title.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  if (/\b(prologue|prolog|preface|avant-propos)\b/.test(normalized)) return "prologue";
  if (/\b(epilogue|epilog|afterword|postface)\b/.test(normalized)) return "epilogue";
  if (/^(part|partie|book|volume|livre)\b/.test(normalized)) return "part";
  if (/^(chapter|chapitre|chap\.?)\s*\d*/.test(normalized)) return "chapter";
  if (/\b(author.?s note|note de l.?auteur|a propos de l.?auteur)\b/.test(normalized)) {
    return "author-note";
  }
  return "other";
}
