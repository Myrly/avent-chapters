import { readFile, realpath, stat } from "node:fs/promises";
import { extname, relative, resolve, isAbsolute, sep } from "node:path";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

export async function createStaticHandler(rootPath) {
  const root = await realpath(rootPath);
  return async (request, response) => {
    if (!["GET", "HEAD"].includes(request.method)) {
      return respond(response, 405, "Method not allowed", { Allow: "GET, HEAD" }, request.method);
    }

    const target = resolveRequestTarget(request.url, root);
    if (!target) return respond(response, 400, "Invalid request path", {}, request.method);
    try {
      const file = await realpath(target);
      if (!isWithinRoot(root, file)) return respond(response, 404, "Not found", {}, request.method);
      const info = await stat(file);
      if (!info.isFile()) return respond(response, 404, "Not found", {}, request.method);
      const body = await readFile(file);
      response.writeHead(200, {
        "Content-Type": contentTypes[extname(file).toLowerCase()] || "application/octet-stream",
        "Content-Length": body.length,
        "X-Content-Type-Options": "nosniff",
      });
      response.end(request.method === "HEAD" ? undefined : body);
    } catch (error) {
      if (error.code === "ENOENT" || error.code === "ENOTDIR") {
        return respond(response, 404, "Not found", {}, request.method);
      }
      console.error("Unable to read a generated static file:", error);
      return respond(response, 500, "Unable to read static file", {}, request.method);
    }
  };
}

function resolveRequestTarget(requestUrl, root) {
  if (typeof requestUrl !== "string" || !requestUrl.startsWith("/") || requestUrl.startsWith("//")) {
    return null;
  }
  const rawPath = requestUrl.split(/[?#]/, 1)[0];
  let pathname;
  try {
    pathname = decodeURIComponent(rawPath);
  } catch {
    return null;
  }
  if (pathname.includes("\0") || pathname.includes("\\")) return null;
  if (pathname.split("/").includes("..")) return null;
  const relativePath = pathname.replace(/^\/+/, "") || "index.html";
  const target = resolve(root, relativePath);
  return isWithinRoot(root, target) ? target : null;
}

function isWithinRoot(root, candidate) {
  const path = relative(root, candidate);
  return path === "" || (path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path));
}

function respond(response, status, message, headers = {}, method = "GET") {
  const body = Buffer.from(message);
  response.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": body.length,
    "X-Content-Type-Options": "nosniff",
    ...headers,
  });
  response.end(method === "HEAD" ? undefined : body);
}
