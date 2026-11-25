export class EpubParseError extends Error {
  constructor(code, path = "") {
    super(code);
    this.name = "EpubParseError";
    this.code = code;
    this.path = path;
  }
}
