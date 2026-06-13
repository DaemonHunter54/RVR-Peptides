import {
  DIRECT_MATCH_SCORE,
  findBestTemplateMatch,
  rankTemplateMatches,
  slugToTitle,
  type TemplateCatalogItem,
  type TemplateMatchResult,
} from "../shared/researchTemplateMatch";
import { parseCitationList, sanitizeImportedResearchFields } from "../shared/researchImportNormalize";

export type ListingSpecs = {
  productName: string;
  size?: string;
  purity?: string;
  form?: string;
  contents?: string;
  sku?: string;
  otherNames?: string;
  molecularFormula?: string;
  molecularWeight?: string;
};

export type TemplateImportResult = {
  shortDescription: string;
  overview: string;
  chemicalMakeup: string;
  researchContent: string;
  citations: Array<{
    title: string;
    authors: string;
    journal: string;
    year: string;
    url: string;
    summary: string;
  }>;
  appliedSpecs: ListingSpecs;
  templateSlug: string;
  templateTitle: string;
};

export type RawKnowledgeTemplate = {
  templateSlug: string;
  title: string;
  sourceSize: string;
  sourceContents: string;
  sourceForm: string;
  sourcePurity: string;
  sourceSku: string;
  overview: string;
  chemicalBlock: string;
  researchContent: string;
  citations: TemplateImportResult["citations"];
};

const CATALOG_URL = "https://www.corepeptides.com/peptides/";
const CATALOG_TTL_MS = 60 * 60 * 1000;

let catalogCache: { fetchedAt: number; items: TemplateCatalogItem[] } | null = null;

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
    .replace(/&ndash;/g, "–")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ");
}

function htmlToText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<\/(p|div|h1|h2|h3|h4|h5|li|br|tr|section)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
  );
}

function rebrandImportedText(text: string): string {
  return text
    .replace(/www\.corepeptides\.com/gi, "www.RVRPeptides.com")
    .replace(/corepeptides\.com/gi, "RVRPeptides.com")
    .replace(/Core Peptides/gi, "River Valley Research Peptides")
    .replace(/Dr\. Marinov[\s\S]*?peptide therapy research\./gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractSection(text: string, startPattern: RegExp, endPatterns: RegExp[]): string {
  const startMatch = startPattern.exec(text);
  if (!startMatch) return "";
  const startIndex = startMatch.index + startMatch[0].length;
  const remainder = text.slice(startIndex);
  let endIndex = remainder.length;
  for (const endPattern of endPatterns) {
    const endMatch = endPattern.exec(remainder);
    if (endMatch && endMatch.index < endIndex) {
      endIndex = endMatch.index;
    }
  }
  return remainder.slice(0, endIndex).trim();
}

function stripListingSpecLines(block: string): string {
  return block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^(size|contents|form|purity|sku):/i.test(line))
    .join("\n")
    .trim();
}

function parseOverview(text: string): string {
  const intro = extractSection(
    text,
    /\bDescription\b[\s\S]*?\n\s*([A-Z0-9][^\n]{2,40} Peptide)\s*\n/i,
    [/\n\s*Overview\s*\n/i, /\n\s*Chemical Makeup\s*\n/i]
  );

  const introFallback = extractSection(
    text,
    /\n\s*([A-Z0-9][^\n]{2,80}(?: Peptide| Blend| Complex| Stack))\s*\n/i,
    [/\n\s*Overview\s*\n/i, /\n\s*Chemical Makeup\s*\n/i]
  );

  const overviewSection = extractSection(text, /\n\s*Overview\s*\n/i, [
    /\n\s*Chemical Makeup\s*\n/i,
    /\n\s*Research and Clinical Studies\s*\n/i,
  ]);

  const merged = [intro || introFallback, overviewSection].filter(Boolean).join("\n\n");
  if (merged.trim()) return rebrandImportedText(merged);

  const descriptionBlock = stripListingSpecLines(
    extractSection(text, /\bDescription\b/i, [/\n\s*Chemical Makeup\s*\n/i, /\n\s*Overview\s*\n/i])
  );
  if (descriptionBlock.length > 40) return rebrandImportedText(descriptionBlock);

  const beforeChemical = stripListingSpecLines(text.split(/\n\s*Chemical Makeup\s*\n/i)[0] || "");
  const narrativeParagraph = beforeChemical
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .find((part) => part.length > 80 && !/^(home|shop|cart|login)/i.test(part));
  if (narrativeParagraph) return rebrandImportedText(narrativeParagraph);

  return "";
}

function overviewFromResearchContent(researchContent: string, productName: string): string {
  const firstParagraph =
    researchContent
      .split(/\n{2,}/)
      .map((part) => part.trim())
      .find((part) => part.length > 80) || "";
  if (firstParagraph.length > 320) {
    return `${firstParagraph.slice(0, 317).trim()}...`;
  }
  if (firstParagraph) return firstParagraph;
  return `${productName} is supplied by River Valley Research Peptides for laboratory and research use only.`;
}

function parseChemicalBlock(text: string): string {
  const block = extractSection(text, /\n\s*Chemical Makeup\s*\n/i, [
    /\n\s*Research and Clinical Studies\s*\n/i,
    /\n\s*References:?\s*\n/i,
  ]);

  return block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^size:/i.test(line))
    .filter((line) => !/^contents:/i.test(line))
    .filter((line) => !/^form:/i.test(line))
    .filter((line) => !/^purity:/i.test(line))
    .filter((line) => !/^sku:/i.test(line))
    .join("\n");
}

function parseResearchContent(text: string): string {
  const block = extractSection(text, /\n\s*Research and Clinical Studies\s*\n/i, [
    /\n\s*References:?\s*\n/i,
    /\n\s*Dr\. Marinov\b/i,
    /\nResearch and laboratory purposes only\b/i,
  ]);
  return rebrandImportedText(block);
}

function parseShortDescription(overview: string, productName: string): string {
  const firstParagraph = overview.split(/\n\n+/).find((part) => part.length > 40) || "";
  if (firstParagraph.length <= 260) return firstParagraph;
  return `${firstParagraph.slice(0, 257).trim()}...`;
}

function extractAuthorsAndTitle(body: string): { authors: string; title: string } {
  const withoutDoi = body.split(". doi:")[0]?.split(". https://")[0]?.split(". http://")[0]?.trim() || body;
  const segments = withoutDoi.split(". ");
  if (segments.length >= 2) {
    const maybeAuthors = segments[0]?.trim() || "";
    const looksLikeAuthors = /,/.test(maybeAuthors) && maybeAuthors.length <= 220;
    if (looksLikeAuthors) {
      return {
        authors: maybeAuthors,
        title: segments.slice(1).join(". ").trim() || withoutDoi,
      };
    }
  }
  return { authors: "", title: withoutDoi.slice(0, 500) };
}

function parseReferences(text: string) {
  const refBlock = extractSection(text, /\n\s*References:?\s*\n/i, [
    /\n\s*Dr\. Marinov\b/i,
    /\n\s*Your Cart\b/i,
    /\nResearch and laboratory purposes only\b/i,
  ]);
  if (!refBlock) return [];

  const lines = refBlock.split("\n").map((line) => line.trim()).filter(Boolean);
  const citations: TemplateImportResult["citations"] = [];

  for (const line of lines) {
    const numbered = line.match(/^\d+\.\s*(.+)$/);
    const body = numbered ? numbered[1] : line;
    if (body.length < 20) continue;
    const urlMatch = body.match(/(https?:\/\/[^\s)]+)/);
    const url = urlMatch ? urlMatch[1].replace(/[.,]$/, "") : "";
    const { authors, title } = extractAuthorsAndTitle(body);
    const yearMatch = body.match(/\b(19|20)\d{2}\b/);
    citations.push({
      title: title.slice(0, 500),
      authors,
      journal: "PubMed / peer-reviewed literature",
      year: yearMatch ? yearMatch[0] : "",
      url,
      summary: "Referenced in published research literature relevant to this compound.",
    });
    if (citations.length >= 5) break;
  }

  return citations;
}

function inferSize(productSlug: string, productName: string): string {
  const nameMatch = productName.match(/(\d+(?:\.\d+)?(?:mg|mcg|ml|iu)(?:\/\d+(?:\.\d+)?(?:mg|mcg|ml|iu))*)/i);
  if (nameMatch) return nameMatch[1];
  const slugMatch = productSlug.match(/(\d+(?:\.\d+)?(?:mg|mcg|ml|iu))/i);
  return slugMatch?.[1] || "";
}

function inferContents(productName: string, productSlug: string): string {
  const cleaned = productName
    .replace(/\d+(?:\.\d+)?(?:mg|mcg|ml|iu)(?:\/\d+(?:\.\d+)?(?:mg|mcg|ml|iu))*/gi, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned) return cleaned;
  return slugToTitle(productSlug.replace(/-\d+(?:\.\d+)?(?:mg|mcg|ml|iu).*$/i, ""));
}

function inferSku(productSlug: string): string {
  const base = productSlug.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return base ? `P-${base}` : "";
}

function parseSpecs(text: string) {
  const sizeMatch = text.match(/Size:\s*([^\n]+)/i);
  const contentsMatch = text.match(/Contents:\s*([^\n]+)/i);
  const formMatch = text.match(/Form:\s*([^\n]+)/i);
  const purityMatch = text.match(/Purity:\s*([^\n]+)/i);
  const skuMatch = text.match(/SKU:\s*([^\n]+)/i);
  return {
    size: sizeMatch?.[1]?.trim() || "",
    contents: contentsMatch?.[1]?.trim() || "",
    form: formMatch?.[1]?.trim() || "",
    purity: purityMatch?.[1]?.trim() || "",
    sku: skuMatch?.[1]?.trim() || "",
  };
}

export function parseRawKnowledgeTemplateFromHtml(html: string, templateSlug: string): RawKnowledgeTemplate {
  const text = htmlToText(html);
  const specs = parseSpecs(text);

  return {
    templateSlug,
    title: slugToTitle(templateSlug),
    sourceSize: specs.size,
    sourceContents: specs.contents,
    sourceForm: specs.form,
    sourcePurity: specs.purity,
    sourceSku: specs.sku,
    overview: parseOverview(text),
    chemicalBlock: parseChemicalBlock(text),
    researchContent: parseResearchContent(text),
    citations: parseReferences(text),
  };
}

export function resolveListingSpecs(specs: ListingSpecs, productSlug: string): ListingSpecs {
  const size = specs.size?.trim() || inferSize(productSlug, specs.productName);
  const contents = specs.contents?.trim() || inferContents(specs.productName, productSlug);
  const sku = specs.sku?.trim() || inferSku(productSlug);
  const form = specs.form?.trim() || "Lyophilized powder";
  const purity = specs.purity?.trim() || ">99%";

  return {
    ...specs,
    size,
    contents,
    sku,
    form,
    purity,
  };
}

function buildChemicalMakeup(resolved: ListingSpecs, chemicalBlock: string): string {
  return rebrandImportedText(
    [
      resolved.productName,
      resolved.size ? `Size: ${resolved.size}` : "",
      resolved.contents ? `Contents: ${resolved.contents}` : "",
      resolved.form ? `Form: ${resolved.form}` : "",
      resolved.purity ? `Purity: ${resolved.purity}` : "",
      resolved.sku ? `SKU: ${resolved.sku}` : "",
      resolved.molecularFormula ? `Molecular Formula: ${resolved.molecularFormula}` : "",
      resolved.molecularWeight ? `Molecular Weight: ${resolved.molecularWeight}` : "",
      resolved.otherNames ? `Other Names: ${resolved.otherNames}` : "",
      chemicalBlock,
    ]
      .filter(Boolean)
      .join("\n")
  );
}

function applyListingSpecsToText(text: string, resolved: ListingSpecs): string {
  let result = text;

  if (resolved.size) {
    result = result.replace(/Size:\s*[^\n]+/gi, `Size: ${resolved.size}`);
    result = result.replace(
      /\(\s*\d+(?:\.\d+)?(?:mg|mcg|ml|iu)(?:\s*[\/–-]\s*\d+(?:\.\d+)?(?:mg|mcg|ml|iu))*\s*\)/gi,
      `(${resolved.size})`
    );
    result = result.replace(
      /\b\d+(?:\.\d+)?(?:mg|mcg|ml|iu)\s*[\/–-]\s*\d+(?:\.\d+)?(?:mg|mcg|ml|iu)\b/gi,
      resolved.size
    );
  }

  if (resolved.contents) {
    result = result.replace(/Contents:\s*[^\n]+/gi, `Contents: ${resolved.contents}`);
  }
  if (resolved.form) {
    result = result.replace(/Form:\s*[^\n]+/gi, `Form: ${resolved.form}`);
  }
  if (resolved.purity) {
    result = result.replace(/Purity:\s*[^\n]+/gi, `Purity: ${resolved.purity}`);
  }
  if (resolved.sku) {
    result = result.replace(/SKU:\s*[^\n]+/gi, `SKU: ${resolved.sku}`);
  }

  return rebrandImportedText(result);
}

export async function fetchTemplateCatalog(force = false): Promise<TemplateCatalogItem[]> {
  if (!force && catalogCache && Date.now() - catalogCache.fetchedAt < CATALOG_TTL_MS) {
    return catalogCache.items;
  }

  const response = await fetch(CATALOG_URL, {
    headers: {
      "User-Agent": "RVR-Peptides-Template-Import/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to load research template catalog (${response.status}).`);
  }

  const html = await response.text();
  const matches = [...html.matchAll(/href="https:\/\/www\.corepeptides\.com\/peptides\/([^"\/]+)\/"/gi)];
  const slugs = [...new Set(matches.map((match) => match[1].trim()).filter(Boolean))];
  const items = slugs
    .map((slug) => ({ slug, title: slugToTitle(slug) }))
    .sort((a, b) => a.title.localeCompare(b.title));

  catalogCache = { fetchedAt: Date.now(), items };
  return items;
}

export async function searchResearchTemplates(
  productSlug: string,
  productName: string
): Promise<{ match: TemplateMatchResult | null; suggestions: TemplateMatchResult[] }> {
  const catalog = await fetchTemplateCatalog();
  const suggestions = rankTemplateMatches(productSlug, productName, catalog, 10);
  const match = findBestTemplateMatch(productSlug, productName, catalog);

  if (match && match.score >= DIRECT_MATCH_SCORE) {
    return { match, suggestions };
  }

  return { match: null, suggestions };
}

async function fetchTemplatePageHtml(templateSlug: string): Promise<string> {
  const sourceUrl = `https://www.corepeptides.com/peptides/${templateSlug}/`;
  const response = await fetch(sourceUrl, {
    headers: {
      "User-Agent": "RVR-Peptides-Template-Import/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to load research template (${response.status}).`);
  }

  return response.text();
}

export { fetchTemplatePageHtml };

async function loadKnowledgeTemplate(
  templateSlug: string,
  options?: { forceFresh?: boolean }
): Promise<RawKnowledgeTemplate> {
  const { getKnowledgeTemplate, syncKnowledgeTemplate } = await import("./researchKnowledgeBase");
  if (!options?.forceFresh) {
    const cached = await getKnowledgeTemplate(templateSlug);
    if (cached) return cached;
  }
  return syncKnowledgeTemplate(templateSlug);
}

export async function fetchResearchTemplate(
  templateSlug: string,
  listingSpecs: ListingSpecs,
  productSlug: string,
  options?: { forceFresh?: boolean }
): Promise<TemplateImportResult> {
  const knowledge = await loadKnowledgeTemplate(templateSlug, options);
  const resolved = resolveListingSpecs(listingSpecs, productSlug);

  let chemicalMakeup = buildChemicalMakeup(resolved, knowledge.chemicalBlock);
  let researchContent = applyListingSpecsToText(knowledge.researchContent, resolved);
  let citations = parseCitationList(knowledge.citations);

  let overview = applyListingSpecsToText(knowledge.overview, resolved);
  if (!overview.trim() && researchContent.trim()) {
    overview = applyListingSpecsToText(
      overviewFromResearchContent(knowledge.researchContent, resolved.productName),
      resolved
    );
  }

  const sanitized = sanitizeImportedResearchFields({
    overview,
    chemicalMakeup,
    researchContent,
    citations,
  });
  overview = sanitized.overview;
  chemicalMakeup = sanitized.chemicalMakeup;
  researchContent = sanitized.researchContent;
  citations = sanitized.citations;

  if (!overview && !researchContent && !chemicalMakeup && !citations.length) {
    throw new Error("Template loaded but research content could not be parsed.");
  }

  const shortDescription =
    applyListingSpecsToText(
      parseShortDescription(overview, resolved.productName) ||
        `${resolved.productName} is supplied by River Valley Research Peptides for laboratory and research use only.`,
      resolved
    );

  return {
    shortDescription,
    overview,
    chemicalMakeup,
    researchContent,
    citations,
    appliedSpecs: resolved,
    templateSlug,
    templateTitle: knowledge.title,
  };
}

/** @deprecated Use fetchResearchTemplate */
export async function fetchCorePeptidesTemplate(productSlug: string, productName: string) {
  const { match, suggestions } = await searchResearchTemplates(productSlug, productName);
  const templateSlug = match?.slug || suggestions[0]?.slug;
  if (!templateSlug) {
    throw new Error("No matching research template was found for this product.");
  }

  const result = await fetchResearchTemplate(
    templateSlug,
    { productName },
    productSlug
  );

  return {
    shortDescription: result.shortDescription,
    overview: result.overview,
    chemicalMakeup: result.chemicalMakeup,
    researchContent: result.researchContent,
    citations: result.citations,
    sourceUrl: `https://www.corepeptides.com/peptides/${templateSlug}/`,
  };
}
