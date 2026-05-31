import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { spawn } from "child_process";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleIpnWebhook } from "../nowpayments";
import { ensureDatabaseReady } from "../db-init";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

function runCatalogSeedInBackground() {
  const child = spawn(process.execPath, ["seed-products.mjs"], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });

  child.stdout.on("data", data => console.log(`[Seed] ${String(data).trim()}`));
  child.stderr.on("data", data => console.error(`[Seed] ${String(data).trim()}`));
  child.on("exit", code => {
    if (code === 0) console.log("[Seed] Product seed completed.");
    else console.error(`[Seed] Product seed exited with code ${code}`);
  });
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // NowPayments IPN webhook endpoint
  app.post("/api/nowpayments/ipn", async (req, res) => {
    try {
      const signature = req.headers["x-nowpayments-sig"] as string || "";
      const result = await handleIpnWebhook(req.body, signature);
      res.json(result);
    } catch (err: any) {
      console.error("[NowPayments IPN Error]", err.message);
      res.status(400).json({ error: err.message });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);

    // Do database repair/seed AFTER the server starts so Railway health checks
    // do not fail or hang while waiting on MySQL. DB helpers still call
    // ensureDatabaseReady() before queries that need the database.
    ensureDatabaseReady()
      .then(() => runCatalogSeedInBackground())
      .catch(error => console.error("[Startup DB init] Failed:", error));
  });
}

startServer().catch(console.error);
