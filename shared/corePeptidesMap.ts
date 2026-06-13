/**
 * Maps RVR product slugs to Core Peptides `/peptides/{slug}/` URL segments.
 * Only products with a mapping can use "Import Core Template".
 */
export const CORE_PEPTIDES_SLUG_MAP: Record<string, string> = {
  "bpc-157-5mg": "bpc-157",
  "bpc-157-10mg": "bpc-157",
  "tb-500": "tb-500",
  "dsip-5mg": "dsip",
  "epithalon-10mg": "epitalon-25mg",
  "ghk-cu-50mg": "ghk-cu-50mg-copper",
  "kisspeptin-10mg": "kisspeptin-10",
  "kpv-10mg": "kpv",
  "melanotan-1-10mg": "melanotan-1",
  "melanotan-2-10mg": "melanotan-2",
  "mots-c-5mg": "mots-c",
  "mots-c-10mg": "mots-c",
  "nad-500mg": "nad",
  "nad-1000mg": "nad",
  "oxytocin-acetate-5mg": "oxytocin",
  "pe-22-28-10mg": "pe-22-28",
  "pinealon-20mg": "pinealon",
  "pt-141-10mg": "pt-141",
  "selank-10mg": "selank",
  "semax-10mg": "semax",
  "sermorelin-10mg": "sermorelin",
  "tesamorelin-10mg": "tesamorelin",
  "thymosin-alpha-1-10mg": "thymosin-alpha-1",
  "cjc-1295-no-dac-ipamorelin-5mg-5mg": "cjc-1295-ipamorelin-10mg-blend",
  "wolverine-blend-20mg": "bpc-157-tb-500-10mg-blend",
  "super-wolf-10mg-10mg-10mg": "bpc-157-tb-500-ghk-cu-blend",
};

export function resolveCorePeptidesSlug(productSlug: string): string | null {
  const normalized = String(productSlug || "").trim().toLowerCase();
  return CORE_PEPTIDES_SLUG_MAP[normalized] || null;
}

export function listCoreMappableSlugs(): string[] {
  return Object.keys(CORE_PEPTIDES_SLUG_MAP);
}
