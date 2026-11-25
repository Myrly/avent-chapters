import { calculateDivision } from "./division.js";
import { calculateEpubDivision } from "../epub/divide.js";

export function calculateBookDivision(book) {
  return book?.source === "epub"
    ? calculateEpubDivision(book)
    : calculateDivision(book);
}
