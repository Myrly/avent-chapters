import test from "node:test";
import assert from "node:assert/strict";
import { createServer, request } from "node:http";
import { once } from "node:events";
import { createStaticHandler } from "../scripts/static-server.js";

const root = new URL("./fixtures/static/", import.meta.url).pathname;
let server;
let port;

test.before(async () => {
  server = createServer(await createStaticHandler(root));
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  port = server.address().port;
});

test.after(async () => {
  server.close();
  await once(server, "close");
});

test("serves root, query strings, and static content types", async () => {
  const home = await get("/");
  assert.equal(home.status, 200);
  assert.match(home.body, /Static fixture/);
  assert.equal((await get("/index.html?cache=1")).status, 200);
  assert.match((await get("/styles/site.css")).headers["content-type"], /text\/css/);
  assert.match((await get("/scripts/app.js")).headers["content-type"], /javascript/);
  assert.match((await get("/assets/icon.svg")).headers["content-type"], /image\/svg\+xml/);
});

test("returns 404 for missing files and 405 for unsupported methods", async () => {
  assert.equal((await get("/missing.html")).status, 404);
  const post = await get("/", "POST");
  assert.equal(post.status, 405);
  assert.equal(post.headers.allow, "GET, HEAD");
  const head = await get("/", "HEAD");
  assert.equal(head.status, 200);
  assert.equal(head.body, "");
});

test("rejects malformed, encoded traversal, and absolute-form request paths", async () => {
  assert.equal((await get("/%E0%A4%A")).status, 400);
  assert.equal((await get("/%2e%2e/README.md")).status, 400);
  assert.equal((await get("/..%2fREADME.md")).status, 400);
  assert.equal((await get("//example.com/README.md")).status, 400);
});

function get(path, method = "GET") {
  return new Promise((resolve, reject) => {
    const req = request({ hostname: "127.0.0.1", port, path, method }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => resolve({
        status: response.statusCode,
        headers: response.headers,
        body,
      }));
    });
    req.on("error", reject);
    req.end();
  });
}
