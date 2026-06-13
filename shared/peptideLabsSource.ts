const PEPTIDE_LABS_HOST = "peptidelabs.us";

export type DoseToken = { value: number; unit: string };

export function extractDoseTokens(name: string): DoseToken | null {
  const match = String(name || "").match(/(\d+(?:\.\d+)?)\s*(mg|ml|iu|mcg)/i);
  if (!match) return null;
  return { value: Number(match[1]), unit: match[2].toLowerCase() };
}

export function normalizeProductMatchKey(name: string, options?: { stripDose?: boolean }): string {
  let normalized = String(name || "")
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/no\s*dac/gi, "nodac")
    .replace(/\bdac\b/g, "dac")
    .replace(/glp-1\s*/g, "")
    .replace(/\bmt-1\b/g, "melanotan1")
    .replace(/\bmt-2\b/g, "melanotan2")
    .replace(/wolverine blend/g, "bpc157tb500")
    .replace(/selank\s*\/\s*semax|semax\s*\+\s*selank|semax\s*\/\s*selank/g, "semaxselank")
    .replace(/cagrilintide\s*\/\s*semaglutide/g, "cagrilintidesemaglutide")
    .replace(/\bcapsules\b.*$/g, "")
    .replace(/[^a-z0-9]+/g, "");

  if (options?.stripDose) {
    normalized = normalized.replace(/\d+(?:\.\d+)?(mg|ml|iu|mcg)/g, "");
  }

  return normalized;
}

export function parsePeptideLabsSourceUrl(input: string): string | null {
  const raw = String(input || "").trim();
  if (!raw) return null;

  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(withProtocol);
    if (!url.hostname.replace(/^www\./i, "").endsWith(PEPTIDE_LABS_HOST)) return null;
    const path = url.pathname.replace(/^\/+|\/+$/g, "");
    if (!path || path.includes("/")) {
      const segment = path.split("/").filter(Boolean)[0];
      return segment || null;
    }
    return path;
  } catch {
    return null;
  }
}

export function isValidPeptideLabsSourceUrl(input: string): boolean {
  return Boolean(parsePeptideLabsSourceUrl(input));
}

export function normalizePeptideLabsUrl(input: string): string | null {
  const raw = String(input || "").trim();
  if (!raw) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(withProtocol);
    if (!url.hostname.replace(/^www\./i, "").endsWith(PEPTIDE_LABS_HOST)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function isPowderPeptideCatalogItem(title: string): boolean {
  return !/(premixed|tablet|pen starter|capsule|cartridge|kit|needle|water|cream|sunscreen|cleanser|booster|reusable injection)/i.test(title);
}
