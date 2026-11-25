import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { createStaticHandler } from "./static-server.js";

const port = Number(process.env.PORT ?? 4173);
const root = fileURLToPath(new URL("../dist/", import.meta.url));

async function startServer() {
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new RangeError("PORT must be an integer between 0 and 65535");
  }
  const handler = await createStaticHandler(root);
  const server = createServer(handler);
  server.on("error", (error) => {
    console.error("Static HTTP server failed:", error);
    process.exitCode = 1;
  });
  server.listen(port, () => {
    const address = server.address();
    console.log(`Livrent static server: http://localhost:${address.port}`);
  });
}

startServer().catch((error) => {
  console.error("Unable to start the static HTTP server:", error);
  process.exitCode = 1;
});
