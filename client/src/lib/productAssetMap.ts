// Non-vial product assets only. Vial products use the approved HD /api/vial renderer.

export const PRODUCT_ASSET_MAP: Record<string, string> = {
  "bpc-157-capsules-500mcg-30": "/assets/bpc-157-capsules-500mcg-30_hd.webp?v=4",
  "cindelria": "/assets/cindelria-hd-tube.png",
  "curenex-daily-care-rejuvenating-cream": "/assets/curenex-daily-care-rejuvenating-cream-hd-tube.png",
  "curenex-daily-care-skin-booster": "/assets/curenex-daily-care-skin-booster-hd-tube.png",
  "curenex-hydrating-cleanser": "/assets/curenex-hydrating-cleanser-hd-tube.png",
  "curenex-sheer-sunscreen-50-spf": "/assets/curenex-sheer-sunscreen-50-spf-hd-tube.png",
  "dermagen": "/assets/dermagen-soothing-face-mask-hd.png",
  "reconstitution-kit": "/assets/reconstitution-kit-hd.png",
  "rm-repair-moisturizing-cream": "/assets/rm-repair-moisturizing-cream-hd-tube.png",
  "urea-cream-skin-softener": "/assets/urea-cream-skin-softener-hd-tube.png",
};

export function productAssetForSlug(slug?: string | null): string {
  if (!slug) return "";
  return PRODUCT_ASSET_MAP[String(slug).toLowerCase()] || "";
}
