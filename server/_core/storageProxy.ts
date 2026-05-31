import type { Express } from "express";
import { ENV } from "./env";
import path from "path";

const LOCAL_STORAGE_FALLBACKS: Record<string, string> = {
  "rvr-logo_19fbf80f.png": "/rvr-logo-fallback.svg",
  "rvr-logo-icon_1e565e30.png": "/rvr-logo-icon-fallback.svg",
  "rvr-hero-3vials-transparent_af6612a1.png": "/rvr-hero-3vials-transparent_af6612a1.png",
  "rvr-vial-template-single_c7ba8797.png": "/rvr-vial-template-single_c7ba8797.png",
};

function redirectToLocalFallback(key: string, res: any) {
  const filename = path.basename(key);
  const fallback = LOCAL_STORAGE_FALLBACKS[filename];
  if (fallback) {
    res.set("Cache-Control", "public, max-age=3600");
    res.redirect(302, fallback);
    return true;
  }
  return false;
}

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      if (redirectToLocalFallback(key, res)) return;
      res.status(404).send("Storage asset not available");
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
        if (redirectToLocalFallback(key, res)) return;
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        if (redirectToLocalFallback(key, res)) return;
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      if (redirectToLocalFallback(key, res)) return;
      res.status(502).send("Storage proxy error");
    }
  });
}
