import type { Express } from "express";
import { ENV } from "./env";
import path from "path";
import fs from "fs";

export function registerStorageProxy(app: Express) {
  // Serve /manus-storage/* requests
  // In Railway/self-hosted mode: redirect to local /assets/ files
  // In Manus mode: proxy through forge API
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    // First try local assets (for Railway/self-hosted deployment)
    const localPath = path.join(process.cwd(), 'client', 'public', 'assets', key);
    if (fs.existsSync(localPath)) {
      res.set("Cache-Control", "public, max-age=31536000, immutable");
      res.redirect(301, `/assets/${key}`);
      return;
    }

    // Fallback to Manus forge proxy (for Manus-hosted mode)
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(404).send("Asset not found");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
