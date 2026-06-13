/**
 * Parses a research template source URL or slug into a catalog template slug.
 * Supports full URLs or bare slugs (e.g. bpc-157-tb-500-ghk-cu-blend).
 */
export function parseResearchTemplateSourceUrl(input: string): string | null {
  const raw = String(input || "").trim();
  if (!raw) return null;

  if (!raw.includes("/") && !raw.includes(".")) {
    const bare = raw.toLowerCase().replace(/^\/+|\/+$/g, "");
    return bare.length >= 2 ? bare : null;
  }

  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(withProtocol);
    const match = url.pathname.match(/\/peptides\/([^/]+)\/?$/i);
    if (match?.[1]) return match[1].trim().toLowerCase();
  } catch {
    // fall through
  }

  const pathMatch = raw.match(/\/peptides\/([^/?#]+)/i);
  if (pathMatch?.[1]) return pathMatch[1].trim().toLowerCase();

  return null;
}

export function isValidResearchTemplateSource(input: string): boolean {
  return Boolean(parseResearchTemplateSourceUrl(input));
}
