import { Buffer } from "node:buffer";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { handleMetadataRequest } from "./src/server/metadata";

async function readJsonBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");

  return JSON.parse(rawBody);
}

function metadataApiPlugin() {
  return {
    configureServer(server: {
      middlewares: {
        use: (
          path: string,
          handler: (
            req: IncomingMessage,
            res: ServerResponse,
            next: () => void,
          ) => void | Promise<void>,
        ) => void;
      };
    }) {
      server.middlewares.use("/api/metadata", async (req, res, next) => {
        if (req.method !== "POST") {
          next();
          return;
        }

        try {
          const body = await readJsonBody(req);

          await handleMetadataRequest(
            {
              body,
              headers: req.headers,
              method: req.method,
            },
            {
              json(payload) {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(payload));
              },
              setHeader(name, value) {
                res.setHeader(name, value);
              },
              status(code) {
                res.statusCode = code;
                return this;
              },
            },
          );
        } catch {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "Request body must be valid JSON.",
              fetchStatus: "error",
            }),
          );
        }
      });
    },
    name: "metadata-api-plugin",
  };
}

export default defineConfig({
  plugins: [react(), metadataApiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
