import test from "node:test";
import assert from "node:assert/strict";
import ejs from "ejs";

test("header highlights only the link for the current navigation page", async () => {
  for (const page of ["manual", "epub", "divisions", "index", "preview"]) {
    const html = await ejs.renderFile(
      new URL(`../src/views/${page}.ejs`, import.meta.url).pathname,
      { title: "Test", titleKey: page === "index" ? "title.home" : `title.${page}` },
      { filename: new URL("../src/views/layout.ejs", import.meta.url).pathname },
    );
    for (const target of ["manual", "epub", "divisions"]) {
      const link = html.match(new RegExp(`<a\\s[^>]*href="/${target}\\.html"[^>]*>`))?.[0];
      assert.ok(link, `${page}: missing ${target} link`);
      assert.equal(link.includes('aria-current="page"'), target === page, page);
      assert.equal(link.includes("button-secondary"), target !== page, page);
    }
  }
});
