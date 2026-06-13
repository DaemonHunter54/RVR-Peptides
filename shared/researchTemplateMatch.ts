export type TemplateCatalogItem = {
  slug: string;
  title: string;
};

export type TemplateMatchResult = {
  slug: string;
  title: string;
  score: number;
};

const STOPWORDS = new Set([
  "for",
  "sale",
  "the",
  "and",
  "with",
  "peptide",
  "peptides",
  "research",
  "grade",
  "lyophilized",
  "powder",
  "topical",
  "blend",
  "blends",
  "mg",
  "ml",
  "mcg",
  "iu",
  "no",
  "dac",
  "mod",
  "grf",
  "copper",
  "acetate",
  "basic",
  "receptor",
]);

/** Known slug pairs where fuzzy matching alone is unreliable. */
const TEMPLATE_OVERRIDES: Record<string, string> = {
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
  "selank-semax-blend-10mg-10mg": "selank",
  "5-amino-1mq-50mg": "5-amino-1mq",
  "ss-31-30mg": "ss-31",
  "bpc-157-capsules-500mcg-30": "bpc-157",
  "glutathione-1200mg": "glutathione",
  "l-carnitine-300mg-ml-30ml": "l-carnitine",
};

const TOKEN_ALIASES: Record<string, string[]> = {
  epithalon: ["epitalon"],
  epitalon: ["epithalon"],
  tb500: ["tb", "500", "thymosin", "beta"],
  thymosin: ["tb", "500"],
  semaglutide: ["glp1", "glp", "semaglutide"],
  tirzepatide: ["glp1", "tirzepatide"],
  retatrutide: ["glp1", "retatrutide"],
  ipamorelin: ["ipa"],
  sermorelin: ["serm"],
  tesamorelin: ["tesa"],
  melanotan: ["mt"],
  oxytocin: ["oxytocin"],
  bacteriostatic: ["bac", "water"],
  wolverine: ["bpc", "157", "tb", "500"],
  wolf: ["bpc", "157", "tb", "500", "ghk"],
};

export const DIRECT_MATCH_SCORE = 0.68;
export const SUGGESTION_MIN_SCORE = 0.28;

export function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((part) => {
      if (/^\d+(\.\d+)?mg$/i.test(part)) return part.toUpperCase();
      if (/^\d+(\.\d+)?mcg$/i.test(part)) return part.toUpperCase();
      if (/^\d+(\.\d+)?ml$/i.test(part)) return part.toUpperCase();
      if (part === "cu") return "Cu";
      if (/^\d+$/.test(part)) return part;
      if (part.length <= 4 && /^[a-z0-9]+$/i.test(part)) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function normalizeText(value: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/epithalon/g, "epitalon")
    .replace(/thymosin-beta-4/g, "tb-500")
    .replace(/thymosin beta 4/g, "tb-500")
    .replace(/body protection compound/g, "bpc-157")
    .replace(/glp-1/g, "glp1")
    .replace(/no-dac/g, "nodac")
    .replace(/mod-grf-1-29/g, "cjc1295")
    .replace(/cjc-1295/g, "cjc1295")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenize(value: string): Set<string> {
  const normalized = normalizeText(value);
  const rawTokens = normalized.split(/\s+/).filter(Boolean);
  const tokens = new Set<string>();

  for (const token of rawTokens) {
    if (token.length < 2 || STOPWORDS.has(token)) continue;
    if (/^\d+(\.\d+)?(mg|mcg|ml|iu)?$/i.test(token)) continue;
    tokens.add(token);

    const aliases = TOKEN_ALIASES[token];
    if (aliases) {
      for (const alias of aliases) tokens.add(alias);
    }
  }

  return tokens;
}

function scoreTokens(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let overlap = 0;
  for (const token of a) {
    if (b.has(token)) overlap += 1;
  }
  const union = new Set([...a, ...b]).size;
  const jaccard = overlap / union;

  let weighted = 0;
  for (const token of a) {
    if (b.has(token)) {
      weighted += token.length >= 4 ? 1 : 0.5;
    }
  }
  const maxWeight = Math.max(
    [...a].reduce((sum, token) => sum + (token.length >= 4 ? 1 : 0.5), 0),
    [...b].reduce((sum, token) => sum + (token.length >= 4 ? 1 : 0.5), 0)
  );

  return maxWeight ? jaccard * 0.55 + (weighted / maxWeight) * 0.45 : jaccard;
}

function scoreProductToTemplate(
  productSlug: string,
  productName: string,
  template: TemplateCatalogItem
): number {
  const normalizedSlug = String(productSlug || "").trim().toLowerCase();
  const override = TEMPLATE_OVERRIDES[normalizedSlug];
  if (override && override === template.slug) return 1;

  const productTokens = tokenize(`${productSlug} ${productName}`);
  const templateTokens = tokenize(`${template.slug} ${template.title}`);
  let score = scoreTokens(productTokens, templateTokens);

  const productBase = normalizeText(productSlug).replace(/\b\d+(?:\.\d+)?(?:mg|mcg|ml|iu)\b/g, "").trim();
  const templateBase = normalizeText(template.slug).replace(/\b\d+(?:\.\d+)?(?:mg|mcg|ml|iu)\b/g, "").trim();
  if (productBase && templateBase && (productBase.includes(templateBase) || templateBase.includes(productBase))) {
    score = Math.max(score, 0.75);
  }

  if (normalizedSlug.includes(template.slug) || template.slug.includes(normalizedSlug.replace(/-\d+mg.*/, ""))) {
    score = Math.max(score, 0.7);
  }

  return Math.min(score, 1);
}

export function rankTemplateMatches(
  productSlug: string,
  productName: string,
  catalog: TemplateCatalogItem[],
  limit = 8
): TemplateMatchResult[] {
  const normalizedSlug = String(productSlug || "").trim().toLowerCase();
  const overrideSlug = TEMPLATE_OVERRIDES[normalizedSlug];

  const scored = catalog
    .map((item) => ({
      slug: item.slug,
      title: item.title,
      score: scoreProductToTemplate(productSlug, productName, item),
    }))
    .filter((item) => item.score >= SUGGESTION_MIN_SCORE)
    .sort((a, b) => b.score - a.score);

  if (overrideSlug) {
    const overrideItem = catalog.find((item) => item.slug === overrideSlug);
    if (overrideItem) {
      const withoutOverride = scored.filter((item) => item.slug !== overrideSlug);
      return [{ slug: overrideItem.slug, title: overrideItem.title, score: 1 }, ...withoutOverride].slice(0, limit);
    }
  }

  return scored.slice(0, limit);
}

export function findBestTemplateMatch(
  productSlug: string,
  productName: string,
  catalog: TemplateCatalogItem[]
): TemplateMatchResult | null {
  const ranked = rankTemplateMatches(productSlug, productName, catalog, 1);
  const best = ranked[0];
  if (!best || best.score < DIRECT_MATCH_SCORE) return null;
  return best;
}

export function resolveOverrideTemplateSlug(productSlug: string): string | null {
  return TEMPLATE_OVERRIDES[String(productSlug || "").trim().toLowerCase()] || null;
}
