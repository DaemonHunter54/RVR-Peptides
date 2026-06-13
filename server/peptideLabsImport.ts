import {
  extractDoseTokens,
  isPowderPeptideCatalogItem,
  normalizePeptideLabsUrl,
  normalizeProductMatchKey,
  parsePeptideLabsSourceUrl,
} from "../shared/peptideLabsSource";

export type PeptideLabsCatalogItem = {
  title: string;
  url: string;
  matchKey: string;
};

export type PeptideLabsImportResult = {
  overview: string;
  chemicalMakeup: string;
  researchContent: string;
  sourceUrl: string;
  sourceTitle: string;
};

const CATALOG_URL = "https://peptidelabs.us/research-peptides/";
const CATALOG_TTL_MS = 60 * 60 * 1000;

let catalogCache: { fetchedAt: number; items: PeptideLabsCatalogItem[] } | null = null;

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ");
}

function htmlToText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h1|h2|h3|h4|h5|li|tr|section)>/gi, "\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
  ).trim();
}

function rebrandImportedText(text: string): string {
  return text
    .replace(/peptidelabs\.us/gi, "RVRPeptides.com")
    .replace(/Peptide Labs/gi, "River Valley Research Peptides")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractTabPanel(html: string, tabId: string): string {
  const marker = `id="${tabId}"`;
  let searchFrom = 0;

  while (searchFrom < html.length) {
    const idx = html.indexOf(marker, searchFrom);
    if (idx === -1) return "";

    const snippet = html.slice(idx, idx + 220);
    if (!/role\s*=\s*"tabpanel"/i.test(snippet)) {
      searchFrom = idx + marker.length;
      continue;
    }

    const panelStart = html.indexOf(">", idx);
    if (panelStart === -1) return "";
    const contentStart = panelStart + 1;

    const nextPanel = html.indexOf('class="woocommerce-Tabs-panel', contentStart + 10);
    if (nextPanel === -1) {
      return html.slice(contentStart);
    }

    return html.slice(contentStart, nextPanel);
  }

  return "";
}

function extractDescriptionPanel(html: string): string {
  return extractTabPanel(html, "tab-description");
}

function splitDescriptionTab(text: string) {
  const productDetailsIdx = text.search(/Product Details\s*:/i);
  const researchAppsIdx = text.search(/Potential Research Applications\s*:/i);
  const formStabilityIdx = text.search(/Form\s*&\s*Stability/i);

  let overview = text;
  let productDetails = "";
  let researchApplications = "";

  if (productDetailsIdx !== -1) {
    overview = text.slice(0, productDetailsIdx).trim();
    if (researchAppsIdx !== -1 && researchAppsIdx > productDetailsIdx) {
      productDetails = text.slice(productDetailsIdx, researchAppsIdx).replace(/^Product Details\s*:/i, "").trim();
      researchApplications = text.slice(researchAppsIdx).replace(/^Potential Research Applications\s*:/i, "").trim();
    } else {
      productDetails = text.slice(productDetailsIdx).replace(/^Product Details\s*:/i, "").trim();
    }
  } else if (formStabilityIdx !== -1) {
    overview = text.slice(0, formStabilityIdx).trim();
    productDetails = text.slice(formStabilityIdx).trim();
  } else if (researchAppsIdx !== -1) {
    overview = text.slice(0, researchAppsIdx).trim();
    researchApplications = text.slice(researchAppsIdx).replace(/^Potential Research Applications\s*:/i, "").trim();
  }

  return { overview, productDetails, researchApplications };
}

function parseProductPage(html: string) {
  const descriptionHtml = extractDescriptionPanel(html);
  if (!descriptionHtml.trim()) {
    return { overview: "", productDetails: "", researchApplications: "" };
  }

  const descriptionText = htmlToText(descriptionHtml);
  const split = splitDescriptionTab(descriptionText);

  const researchHtml = extractTabPanel(html, "tab-pl_research");
  const storageHtml = extractTabPanel(html, "tab-pl_storage");
  const molecularHtml = extractTabPanel(html, "tab-pl_molecular");

  const researchTab = researchHtml ? htmlToText(researchHtml) : "";
  const storageTab = storageHtml ? htmlToText(storageHtml) : "";
  const molecularTab = molecularHtml ? htmlToText(molecularHtml) : "";

  let productDetails = split.productDetails;
  if (molecularTab) {
    productDetails = productDetails
      ? `${productDetails}\n\nMolecular Structure\n${molecularTab}`
      : molecularTab;
  }
  if (storageTab) {
    productDetails = productDetails
      ? `${productDetails}\n\nStorage\n${storageTab}`
      : storageTab;
  }

  return {
    overview: rebrandImportedText(split.overview),
    productDetails: rebrandImportedText(productDetails),
    researchApplications: rebrandImportedText(split.researchApplications || researchTab),
  };
}

function parseDescriptionSections(panelHtml: string) {
  const text = htmlToText(panelHtml);
  const split = splitDescriptionTab(text);
  return {
    overview: rebrandImportedText(split.overview),
    productDetails: rebrandImportedText(split.productDetails),
    researchApplications: rebrandImportedText(split.researchApplications),
  };
}

export async function fetchPeptideLabsCatalog(forceFresh = false): Promise<PeptideLabsCatalogItem[]> {
  if (!forceFresh && catalogCache && Date.now() - catalogCache.fetchedAt < CATALOG_TTL_MS) {
    return catalogCache.items;
  }

  const response = await fetch(CATALOG_URL, {
    headers: { "User-Agent": "RVR-Peptides-Import/1.0" },
  });
  if (!response.ok) {
    throw new Error(`Unable to load reference catalog (${response.status}).`);
  }

  const html = await response.text();
  const items: PeptideLabsCatalogItem[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(/pl-op-card-title"><a href="([^"]+)">([^<]+)<\/a>/gi)) {
    const url = normalizePeptideLabsUrl(match[1]);
    const title = decodeHtmlEntities(match[2].trim());
    if (!url || !title) continue;
    const dedupeKey = `${title}::${url}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    items.push({ title, url, matchKey: normalizeProductMatchKey(title) });
  }

  catalogCache = { fetchedAt: Date.now(), items };
  return items;
}

export function findCatalogMatch(
  productName: string,
  catalog: PeptideLabsCatalogItem[]
): PeptideLabsCatalogItem | null {
  const key = normalizeProductMatchKey(productName);
  if (!key) return null;

  const exact = catalog.find((item) => item.matchKey === key);
  if (exact) return exact;

  const targetDose = extractDoseTokens(productName);
  const baseKey = normalizeProductMatchKey(productName, { stripDose: true });
  const candidates = catalog.filter((item) => {
    const itemBase = normalizeProductMatchKey(item.title, { stripDose: true });
    if (!itemBase || !baseKey) return false;
    return itemBase === baseKey || itemBase.includes(baseKey) || baseKey.includes(itemBase);
  });

  const filtered = candidates.filter((item) => isPowderPeptideCatalogItem(item.title));
  let pool = filtered.length ? filtered : candidates;
  if (!pool.length) return null;

  const wantsNoDac = /no\s*dac/i.test(productName);
  if (wantsNoDac) {
    const noDacPool = pool.filter((item) => /no\s*dac/i.test(item.title));
    if (noDacPool.length) pool = noDacPool;
  }

  if (!targetDose) return pool[0];

  let best = pool[0];
  let bestDiff = Number.POSITIVE_INFINITY;
  for (const item of pool) {
    const dose = extractDoseTokens(item.title);
    if (!dose || dose.unit !== targetDose.unit) continue;
    const diff = Math.abs(dose.value - targetDose.value);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = item;
    }
  }

  return bestDiff === Number.POSITIVE_INFINITY ? pool[0] : best;
}

export async function fetchPeptideLabsProduct(sourceUrlInput: string): Promise<PeptideLabsImportResult> {
  const sourceUrl = normalizePeptideLabsUrl(sourceUrlInput);
  if (!sourceUrl) {
    throw new Error("Paste a valid source product URL.");
  }

  const response = await fetch(sourceUrl, {
    headers: { "User-Agent": "RVR-Peptides-Import/1.0" },
  });
  if (!response.ok) {
    throw new Error(`Unable to load product page (${response.status}). Check the URL and try again.`);
  }

  const html = await response.text();
  const parsed = parseProductPage(html);
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const sourceTitle = decodeHtmlEntities(titleMatch?.[1]?.split("|")[0]?.trim() || parsePeptideLabsSourceUrl(sourceUrl) || "Product");

  if (!parsed.overview && !parsed.productDetails && !parsed.researchApplications) {
    throw new Error("Could not parse description sections from that page.");
  }

  return {
    overview: parsed.overview,
    chemicalMakeup: parsed.productDetails,
    researchContent: parsed.researchApplications,
    sourceUrl,
    sourceTitle,
  };
}

export async function importPeptideLabsForProduct(
  productName: string,
  sourceUrl?: string
): Promise<PeptideLabsImportResult & { matchedTitle?: string }> {
  if (sourceUrl?.trim()) {
    return fetchPeptideLabsProduct(sourceUrl);
  }

  const catalog = await fetchPeptideLabsCatalog();
  const match = findCatalogMatch(productName, catalog);
  if (!match) {
    throw new Error(`No reference match for "${productName}". Paste a source product URL and try again.`);
  }

  const imported = await fetchPeptideLabsProduct(match.url);
  return { ...imported, matchedTitle: match.title, sourceUrl: match.url };
}
