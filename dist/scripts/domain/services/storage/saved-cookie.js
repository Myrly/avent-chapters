const COOKIE = "livrent_saved";

export function updateCookie(documentRef, records) {
  const value = records.map((record) => record.id).join(".");
  if (value.length > 3000) {
    console.warn("Saved division index exceeds the cookie size limit.");
    return false;
  }
  try {
    documentRef.cookie = `${COOKIE}=${value}; Max-Age=31536000; Path=/; SameSite=Lax`;
    return documentRef.cookie.split(";").some((part) => part.trim() === `${COOKIE}=${value}`);
  } catch (error) {
    console.warn("Unable to save the division index cookie:", error);
    return false;
  }
}

export function cookieMatches(documentRef, records) {
  if (!records.length) return true;
  const value = records.map((record) => record.id).join(".");
  try {
    return documentRef.cookie.split(";").some((part) => part.trim() === `${COOKIE}=${value}`);
  } catch (error) {
    console.warn("Unable to read the division index cookie:", error);
    return false;
  }
}
