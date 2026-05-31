import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleIpnWebhook } from "../nowpayments";

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

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);

  // Dynamic hero vials image endpoint (must be before :slug.png to avoid matching)
  app.get("/api/vial/hero.png", async (req, res) => {
    try {
      const { generateHeroVialsBuffer } = await import("../vialGenerator");
      const { getAllProducts } = await import("../db");
      const { products } = await getAllProducts({});
      const featured = products.filter((p: any) => p.isFeatured).slice(0, 3);
      const heroProducts = featured.length >= 3 ? featured : products.slice(0, 3);
      const buffer = generateHeroVialsBuffer(heroProducts.map((p: any) => ({ name: p.name })));
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(buffer);
    } catch (err: any) {
      console.error('[Hero Vial Gen Error]', err.message);
      res.status(500).send('Error generating hero image');
    }
  });

  // Dynamic vial image generation endpoint
  app.get("/api/vial/:slug.png", async (req, res) => {
    try {
      const { generateVialBuffer } = await import("../vialGenerator");
      const { getProductBySlug } = await import("../db");
      const product = await getProductBySlug(req.params.slug);
      if (!product) {
        res.status(404).send('Product not found');
        return;
      }
      const buffer = await generateVialBuffer(product.name);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buffer);
    } catch (err: any) {
      console.error('[Vial Gen Error]', err.message);
      res.status(500).send('Error generating vial image');
    }
  });

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
  });
}

startServer().catch(console.error);
