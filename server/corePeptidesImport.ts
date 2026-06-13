import { resolveCorePeptidesSlug } from "../shared/corePeptidesMap";

export type CoreImportResult = {
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
  sourceUrl: string;
};

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

function rebrandCoreText(text: string): string {
  return text
    .replace(/www\.corepeptides\.com/gi, "www.RVRPeptides.com")
    .replace(/corepeptides\.com/gi, "RVRPeptides.com")
    .replace(/Core Peptides/g, "River Valley Research Peptides")
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

function parseOverview(text: string): string {
  const intro = extractSection(
    text,
    /\bDescription\b[\s\S]*?\n\s*([A-Z0-9][^\n]{2,40} Peptide)\s*\n/i,
    [/\n\s*Overview\s*\n/i, /\n\s*Chemical Makeup\s*\n/i]
  );

  const introFallback = extractSection(
    text,
    /\n\s*([A-Z0-9][^\n]{2,60} Peptide)\s*\n/i,
    [/\n\s*Overview\s*\n/i, /\n\s*Chemical Makeup\s*\n/i]
  );

  const overviewSection = extractSection(text, /\n\s*Overview\s*\n/i, [
    /\n\s*Chemical Makeup\s*\n/i,
    /\n\s*Research and Clinical Studies\s*\n/i,
  ]);

  const combined = [intro || introFallback, overviewSection].filter(Boolean).join("\n\n");
  return rebrandCoreText(combined);
}

function parseChemicalMakeup(text: string, productName: string, specs: ReturnType<typeof parseSpecs>): string {
  const block = extractSection(text, /\n\s*Chemical Makeup\s*\n/i, [
    /\n\s*Research and Clinical Studies\s*\n/i,
    /\n\s*References:?\s*\n/i,
  ]);

  return rebrandCoreText(
    [
      productName,
      specs.size ? `Size: ${specs.size}` : "",
      specs.contents ? `Contents: ${specs.contents}` : "",
      specs.form ? `Form: ${specs.form}` : "",
      specs.purity ? `Purity: ${specs.purity}` : "",
      block,
    ]
      .filter(Boolean)
      .join("\n")
  );
}

function parseResearchContent(text: string): string {
  const block = extractSection(text, /\n\s*Research and Clinical Studies\s*\n/i, [
    /\n\s*References:?\s*\n/i,
    /\n\s*Dr\. Marinov\b/i,
    /\nResearch and laboratory purposes only\b/i,
  ]);
  return rebrandCoreText(block);
}

function parseShortDescription(overview: string, productName: string): string {
  const firstParagraph = overview.split(/\n\n+/).find((part) => part.length > 40) || "";
  if (firstParagraph.length <= 260) return firstParagraph;
  return `${firstParagraph.slice(0, 257).trim()}...`;
}

function parseReferences(text: string) {
  const refBlock = extractSection(text, /\n\s*References:?\s*\n/i, [
    /\n\s*Dr\. Marinov\b/i,
    /\n\s*Your Cart\b/i,
    /\nResearch and laboratory purposes only\b/i,
  ]);
  if (!refBlock) return [];

  const lines = refBlock.split("\n").map((line) => line.trim()).filter(Boolean);
  const citations: CoreImportResult["citations"] = [];

  for (const line of lines) {
    const numbered = line.match(/^\d+\.\s*(.+)$/);
    const body = numbered ? numbered[1] : line;
    if (body.length < 20) continue;
    const urlMatch = body.match(/(https?:\/\/[^\s)]+)/);
    const url = urlMatch ? urlMatch[1].replace(/[.,]$/, "") : "";
    const title =
      body.split(". doi:")[0]?.split(". https://")[0]?.split(". http://")[0]?.trim() ||
      body.slice(0, 180);
    const yearMatch = body.match(/\b(19|20)\d{2}\b/);
    citations.push({
      title: title.slice(0, 500),
      authors: "",
      journal: "PubMed / peer-reviewed literature",
      year: yearMatch ? yearMatch[0] : "",
      url,
      summary: "Referenced in published research literature relevant to this compound.",
    });
    if (citations.length >= 5) break;
  }

  return citations;
}

function parseSpecs(text: string) {
  const sizeMatch = text.match(/Size:\s*([^\n]+)/i);
  const contentsMatch = text.match(/Contents:\s*([^\n]+)/i);
  const formMatch = text.match(/Form:\s*([^\n]+)/i);
  const purityMatch = text.match(/Purity:\s*([^\n]+)/i);
  return {
    size: sizeMatch?.[1]?.trim() || "",
    contents: contentsMatch?.[1]?.trim() || "",
    form: formMatch?.[1]?.trim() || "",
    purity: purityMatch?.[1]?.trim() || "",
  };
}

export async function fetchCorePeptidesTemplate(productSlug: string, productName: string): Promise<CoreImportResult> {
  const coreSlug = resolveCorePeptidesSlug(productSlug);
  if (!coreSlug) {
    throw new Error(
      `No Core Peptides template is mapped for "${productSlug}". Add a mapping in shared/corePeptidesMap.ts or use Fetch Sources + Generate Draft Copy.`
    );
  }

  const sourceUrl = `https://www.corepeptides.com/peptides/${coreSlug}/`;
  const response = await fetch(sourceUrl, {
    headers: {
      "User-Agent": "RVR-Peptides-Template-Import/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to load Core Peptides template (${response.status}) from ${sourceUrl}`);
  }

  const html = await response.text();
  const text = htmlToText(html);
  const specs = parseSpecs(text);
  const overview = parseOverview(text);
  const chemicalMakeup = parseChemicalMakeup(text, productName, specs);
  const researchContent = parseResearchContent(text);
  const citations = parseReferences(text);

  if (!overview && !researchContent) {
    throw new Error(`Core Peptides page loaded but content could not be parsed: ${sourceUrl}`);
  }

  const shortDescription =
    parseShortDescription(overview, productName) ||
    `${productName} is supplied by River Valley Research Peptides for laboratory and research use only.`;

  return {
    shortDescription: rebrandCoreText(shortDescription),
    overview,
    chemicalMakeup,
    researchContent,
    citations,
    sourceUrl,
  };
}
