import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import fs from "fs";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleIpnWebhook } from "../nowpayments";
import { storagePut } from "../storage";



function getProductAssetDirs(): string[] {
  const cwd = process.cwd();
  const dirs = [
    path.join(cwd, "dist", "public", "assets"),
    path.join(cwd, "client", "public", "assets"),
  ];

  // In the bundled production server, import.meta.dirname is usually /app/dist.
  // Static assets are served from `${import.meta.dirname}/public`, so uploaded
  // files must also be written there or the browser will receive a broken URL.
  dirs.push(path.join(import.meta.dirname, "public", "assets"));

  return Array.from(new Set(dirs));
}

function getPrimaryProductAssetDir(): string {
  const productionDir = path.join(import.meta.dirname, "public", "assets");
  if (process.env.NODE_ENV === "production") return productionDir;
  return path.join(process.cwd(), "client", "public", "assets");
}

function writeProductAssetToServedLocations(
  relativeName: string,
  data: Buffer | Uint8Array | string,
) {
  for (const assetsDir of getProductAssetDirs()) {
    fs.mkdirSync(assetsDir, { recursive: true });
    fs.writeFileSync(path.join(assetsDir, relativeName), data as any);
  }
}
function readServedAsset(relativeName: string): Buffer {
  const searchDirs = [
    ...getProductAssetDirs(),
    path.join(process.cwd(), "public", "assets"),
    path.join(process.cwd(), "client", "public", "assets"),
    path.join(process.cwd(), "dist", "public", "assets"),
    path.join(import.meta.dirname, "public", "assets"),
  ];

  for (const assetsDir of searchDirs) {
    const fullPath = path.join(assetsDir, relativeName);
    if (fs.existsSync(fullPath)) return fs.readFileSync(fullPath);
  }

  throw new Error(`Asset not found: ${relativeName}`);
}


async function saveProductAsset(
  relativeName: string,
  data: Buffer | Uint8Array | string,
  contentType: string,
): Promise<{ name: string; url: string }> {
  writeProductAssetToServedLocations(relativeName, data);

  try {
    const stored = await storagePut(`assets/${relativeName}`, data, contentType);
    return { name: relativeName, url: stored.url };
  } catch (error) {
    console.warn("[Product Asset Storage] Persistent storage unavailable; using local asset path.", error);
    return { name: relativeName, url: `/assets/${relativeName}` };
  }
}

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
  registerOAuthRoutes(app);

  // Vial image endpoints - redirect to pre-generated HD images stored in S3
  app.get("/api/vial/hero.png", (req, res) => {
    res.redirect('/assets/rvr-hero-vials-new-transparent.png');
  });

  app.get("/api/vial/:slug.png", async (req, res) => {
    try {
      const { getProductBySlug } = await import("../db");
      const { generateVialSvgBuffer } = await import("../vialGenerator");
      const product = await getProductBySlug(req.params.slug);
      const queryName = typeof req.query.name === "string" ? req.query.name : "";
      const querySize = typeof req.query.size === "string" ? req.query.size : "";
      const productName = (queryName || product?.name || req.params.slug.replace(/-/g, " ")).trim();
      const productSize = (querySize || (product as any)?.size || "").trim();
      const displayName = productSize && !productName.toLowerCase().includes(productSize.toLowerCase())
        ? `${productName} ${productSize}`
        : productName;
      const buffer = await generateVialSvgBuffer(displayName);
      res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.send(buffer);
    } catch (err: any) {
      console.error('[Vial Generate Error]', err.message);
      res.status(500).send('Error');
    }
  });



  app.get("/api/product-assets", async (req, res) => {
    try {
      const seen = new Set<string>();
      const assets = getProductAssetDirs()
        .flatMap((assetsDir) => fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [])
        .filter((file) => /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(file))
        .filter((file) => {
          if (seen.has(file)) return false;
          seen.add(file);
          return true;
        })
        .map((file) => ({ name: file, url: `/assets/${file}` }))
        .sort((a, b) => a.name.localeCompare(b.name));

      res.json(assets);
    } catch (err: any) {
      res.status(500).send(err?.message || "Unable to list assets");
    }
  });


  app.get("/api/nih-report", async (req, res) => {
    try {
      const name = String(req.query?.name || "").trim();
      if (!name) {
        res.status(400).send("Product name is required");
        return;
      }

      const searchUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi");
      searchUrl.searchParams.set("db", "pubmed");
      searchUrl.searchParams.set("retmode", "json");
      searchUrl.searchParams.set("retmax", "8");
      searchUrl.searchParams.set("sort", "relevance");
      searchUrl.searchParams.set("term", `${name} peptide OR ${name}`);

      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) throw new Error("NIH search failed");
      const searchJson: any = await searchResponse.json();
      const ids = searchJson?.esearchresult?.idlist || [];
      if (!ids.length) {
        res.status(404).send(`No NIH/PubMed report found for ${name}`);
        return;
      }

      const summaryUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi");
      summaryUrl.searchParams.set("db", "pubmed");
      summaryUrl.searchParams.set("retmode", "json");
      summaryUrl.searchParams.set("id", ids.join(","));

      const summaryResponse = await fetch(summaryUrl);
      if (!summaryResponse.ok) throw new Error("NIH summary failed");
      const summaryJson: any = await summaryResponse.json();

      const articles = ids
        .map((id: string) => summaryJson?.result?.[id])
        .filter(Boolean)
        .map((item: any, index: number) => {
          const authors = Array.isArray(item.authors) ? item.authors.map((author: any) => author.name).filter(Boolean).join(", ") : "";
          return [
            `${index + 1}. ${item.title || "Untitled NIH/PubMed record"}`,
            authors ? `Authors: ${authors}` : "",
            item.fulljournalname ? `Journal: ${item.fulljournalname}${item.pubdate ? ` (${item.pubdate})` : ""}` : "",
            `NIH/PubMed: https://pubmed.ncbi.nlm.nih.gov/${item.uid}/`,
          ].filter(Boolean).join("\n");
        });

      res.json({
        description: [
          `NIH/PubMed Research Report for ${name}`,
          "",
          "The following NIH-indexed PubMed records were found for this product name. Review for accuracy before publishing.",
          "",
          ...articles,
        ].join("\n\n"),
      });
    } catch (err: any) {
      console.error("[NIH Report Error]", err);
      res.status(500).send(err?.message || "Unable to pull NIH report");
    }
  });

  app.post("/api/product-image/upload", async (req, res) => {
    try {
      const makeSafeSlug = (value: string) => String(value || "product-image").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "product-image";
      const dataUrl = String(req.body?.dataUrl || "");
      const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) {
        res.status(400).send("Invalid image upload");
        return;
      }

      const mimeType = match[1].toLowerCase();
      const originalBuffer = Buffer.from(match[2], "base64");
      const baseSlug = makeSafeSlug(req.body?.slug || req.body?.filename);
      const requestedName = String(req.body?.filename || "").toLowerCase();

      if (mimeType === "image/svg+xml" || mimeType === "image/svg" || requestedName.endsWith(".svg")) {
        const svgText = originalBuffer.toString("utf8").trim();
        if (!/<svg[\s>]/i.test(svgText) || /<script[\s>]/i.test(svgText) || /on\w+\s*=/i.test(svgText)) {
          res.status(400).send("SVG uploads must be valid, safe SVG files. Please upload a PNG, JPG, WEBP, GIF, or a clean SVG.");
          return;
        }
        const filename = `${baseSlug}-${Date.now()}.svg`;
        const saved = await saveProductAsset(filename, svgText, "image/svg+xml");
        res.json(saved);
        return;
      }

      try {
        const { createCanvas, loadImage } = await import("@napi-rs/canvas");
        const image = await loadImage(originalBuffer);
        const canvas = createCanvas(image.width, image.height);
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        for (let index = 0; index < pixels.length; index += 4) {
          const red = pixels[index];
          const green = pixels[index + 1];
          const blue = pixels[index + 2];
          const alpha = pixels[index + 3];
          if (alpha > 0 && red > 238 && green > 238 && blue > 238 && Math.abs(red - green) < 12 && Math.abs(red - blue) < 12 && Math.abs(green - blue) < 12) {
            const whiteness = Math.min(red, green, blue);
            pixels[index + 3] = whiteness > 250 ? 0 : Math.max(0, Math.min(alpha, (255 - whiteness) * 12));
          }
        }

        context.putImageData(imageData, 0, 0);
        const processedBuffer = await canvas.encode("png");
        const filename = `${baseSlug}-${Date.now()}.png`;
        const saved = await saveProductAsset(filename, processedBuffer, "image/png");
        res.json(saved);
        return;
      } catch (imageError) {
        console.warn("[Product Image Upload] Transparent-background conversion failed; saving original image.", imageError);
        const extension =
          mimeType.includes("webp") ? "webp" :
          mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" :
          mimeType.includes("gif") ? "gif" :
          mimeType.includes("png") ? "png" : "bin";
        const filename = `${baseSlug}-${Date.now()}.${extension}`;
        const saved = await saveProductAsset(filename, originalBuffer, mimeType);
        res.json(saved);
      }
    } catch (err: any) {
      console.error("[Product Image Upload Error]", err);
      res.status(500).send(err?.message || "Unable to upload product image");
    }
  });


  app.post("/api/product-preview/link", async (req, res) => {
    try {
      const makeSafeSlug = (value: string) => String(value || "preview-product").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "preview-product";
      const type = String(req.body?.type || "vial");
      const slug = makeSafeSlug(req.body?.slug || req.body?.name);
      const name = String(req.body?.name || slug.replace(/-/g, " ")).trim();
      const size = String(req.body?.size || "").trim();
      const minAmount = String(req.body?.minAmount || "").trim();
      const maxAmount = String(req.body?.maxAmount || "").trim();
      const displayName = size && !name.toLowerCase().includes(size.toLowerCase()) ? `${name} ${size}` : name;
      const formatGiftCardAmount = (value: string) => {
        const parsed = Number(String(value || "").replace(/[^0-9.]/g, ""));
        return Number.isFinite(parsed) && parsed > 0 ? `$${parsed.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "";
      };
      const giftCardRange = (() => {
        const min = formatGiftCardAmount(minAmount);
        const max = formatGiftCardAmount(maxAmount);
        if (min && max) return `${min} - ${max}`;
        if (min) return `${min}+`;
        if (max) return `Up to ${max}`;
        return "";
      })();

      let buffer: Buffer;
      let extension = "png";
      let contentType = "image/png";

      if (type === "cream") {
        buffer = readServedAsset("lotion-bottle-blank-hd-tube.png");
      } else if (type === "face-mask") {
        buffer = readServedAsset("face-mask-blank-hd.png");
      } else if (type === "gift-card") {
        const giftCardBuffer = readServedAsset("Gift-Card.png");
        if (giftCardRange) {
          try {
            const { createCanvas, loadImage } = await import("@napi-rs/canvas");
            const image = await loadImage(giftCardBuffer);
            const canvas = createCanvas(image.width, image.height);
            const context = canvas.getContext("2d");
            context.drawImage(image, 0, 0);
            const fontSize = Math.max(34, Math.round(image.width * 0.035));
            context.font = `700 ${fontSize}px Arial, sans-serif`;
            context.textAlign = "right";
            context.textBaseline = "top";
            context.shadowColor = "rgba(0,0,0,0.55)";
            context.shadowBlur = Math.round(fontSize * 0.16);
            context.shadowOffsetY = Math.max(1, Math.round(fontSize * 0.035));
            context.fillStyle = "#ffffff";
            context.fillText(giftCardRange, image.width - Math.round(image.width * 0.072), Math.round(image.height * 0.075));
            buffer = await canvas.encode("png");
          } catch (giftCardError) {
            console.warn("[Gift Card Preview] Amount-range rendering failed; saving base gift card image.", giftCardError);
            buffer = giftCardBuffer;
          }
        } else {
          buffer = giftCardBuffer;
        }
      } else {
        const { generateVialBuffer } = await import("../vialGenerator");
        buffer = await generateVialBuffer(displayName);
      }

      const amountSlug = type === "gift-card" && giftCardRange
        ? `-${makeSafeSlug(giftCardRange)}`
        : "";
      const filename = `${slug}-${type}${amountSlug}-preview.${extension}`;
      const saved = await saveProductAsset(filename, buffer, contentType);
      res.json({ url: saved.url, contentType });
    } catch (err: any) {
      console.error("[Product Preview Link Error]", err);
      res.status(500).send(err?.message || "Unable to link preview image");
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
