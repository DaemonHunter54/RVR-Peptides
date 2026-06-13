import { invokeLLM, type InvokeResult } from "./_core/llm";

export type ProductCopyCitationInput = {
  title: string;
  authors?: string;
  journal?: string;
  year?: string;
  url?: string;
  summary?: string;
};

export type GenerateProductCopyInput = {
  productName: string;
  productBrief?: string;
  qualityNotes?: string;
  size?: string;
  purity?: string;
  form?: string;
  contents?: string;
  sku?: string;
  otherNames?: string;
  molecularFormula?: string;
  molecularWeight?: string;
  shortDescription?: string;
  sourceChemicalMakeup?: string;
  citations?: ProductCopyCitationInput[];
};

export type GeneratedProductCopy = {
  shortDescription: string;
  overview: string;
  chemicalMakeup: string;
  researchContent: string;
  citations: Array<ProductCopyCitationInput & { summary: string }>;
};

function extractAssistantText(result: InvokeResult): string {
  const content = result.choices[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join("")
      .trim();
  }
  return "";
}

function parseGeneratedCopy(raw: string): GeneratedProductCopy {
  const parsed = JSON.parse(raw);
  const citations = Array.isArray(parsed.citations)
    ? parsed.citations.map((citation: any) => ({
        title: String(citation.title || "").trim(),
        authors: String(citation.authors || "").trim(),
        journal: String(citation.journal || "").trim(),
        year: String(citation.year || "").trim(),
        url: String(citation.url || "").trim(),
        summary: String(citation.summary || "").trim(),
      }))
    : [];

  return {
    shortDescription: String(parsed.shortDescription || "").trim(),
    overview: String(parsed.overview || "").trim(),
    chemicalMakeup: String(parsed.chemicalMakeup || "").trim(),
    researchContent: String(parsed.researchContent || "").trim(),
    citations,
  };
}

const STYLE_EXAMPLE = `
EXAMPLE TONE (BPC-157 5mg lyophilized research vial — do not copy facts unless they match the target product):

Short description:
"BPC-157 5mg is supplied as a research-grade lyophilized peptide for in-vitro and laboratory investigation, with identity-focused documentation to support analytical workflows."

Overview:
"River Valley Research Peptides offers BPC-157 in a 5mg presentation designed for researchers who need a clearly defined unit size for protocol planning and repeat testing. This listing is built around transparent product identity — not broad peptide-category language — so your lab can evaluate the exact material referenced on the certificate of analysis.

Each batch is positioned for researchers who prioritize consistency, traceability, and third-party verification. Before use in any experimental model, confirm compound identity, purity, and handling requirements against your internal SOPs and the accompanying CoA/HPLC documentation when available.

This product is for laboratory, in-vitro, or analytical research only. It is not for human or animal consumption."

Chemical makeup (scannable):
"BPC-157 (Body Protection Compound-157)
Presentation: 5mg lyophilized peptide
Form: Research vial — reconstitution required for laboratory use
Purity: ≥99% (per product specification; verify on CoA)
Sequence: 15 amino acids (pentadecapeptide)
Research use only — not for consumption"

Research content:
"Peer-reviewed and database-indexed literature has examined BPC-157 primarily in preclinical repair, tissue-model, and mechanistic signaling contexts. Studies vary by model, route, and endpoint, so findings should be interpreted at the study level rather than as universal product claims.

Researchers evaluating this compound typically review published work on experimental tissue recovery models, gastrointestinal injury models, and related pathway investigations. River Valley Research Peptides provides this material strictly as a research reagent; nothing on this page constitutes medical advice or an approved therapeutic claim."
`.trim();

export async function generateProductCopyDraft(input: GenerateProductCopyInput): Promise<GeneratedProductCopy> {
  const citations = (input.citations || []).slice(0, 5);
  const productFacts = [
    input.productName ? `Product name: ${input.productName}` : "",
    input.size ? `Size / presentation: ${input.size}` : "",
    input.purity ? `Purity specification: ${input.purity}` : "",
    input.form ? `Form: ${input.form}` : "",
    input.contents ? `Contents: ${input.contents}` : "",
    input.sku ? `SKU: ${input.sku}` : "",
    input.otherNames ? `Synonyms / other names: ${input.otherNames}` : "",
    input.molecularFormula ? `Molecular formula: ${input.molecularFormula}` : "",
    input.molecularWeight ? `Molecular weight: ${input.molecularWeight}` : "",
  ].filter(Boolean);

  const citationBlock = citations.length
    ? citations
        .map(
          (citation, index) =>
            `[${index + 1}] ${citation.title}${citation.authors ? ` — ${citation.authors}` : ""}${citation.journal ? ` (${citation.journal}${citation.year ? `, ${citation.year}` : ""})` : ""}${citation.url ? `\nURL: ${citation.url}` : ""}${citation.summary ? `\nSource note: ${citation.summary}` : ""}`
        )
        .join("\n\n")
    : "No citations loaded yet. Write carefully using only confirmed product metadata.";

  const userPrompt = [
    "Write original River Valley Research Peptides catalog copy for the product below.",
    "",
    "PRODUCT FACTS (must be reflected accurately — do not invent specs):",
    productFacts.join("\n") || "Product name only — keep chemistry conservative if specs are missing.",
    "",
    input.productBrief?.trim()
      ? `OWNER / PRODUCT BRIEF (primary voice and positioning — follow closely):\n${input.productBrief.trim()}`
      : "OWNER / PRODUCT BRIEF: Not provided. Infer a professional research-catalog tone from product facts only.",
    "",
    input.qualityNotes?.trim()
      ? `QUALITY & RVR DIFFERENTIATORS:\n${input.qualityNotes.trim()}`
      : "QUALITY & RVR DIFFERENTIATORS: Mention third-party testing, CoA/HPLC availability, and batch traceability where appropriate without making unverified claims.",
    "",
    input.sourceChemicalMakeup?.trim()
      ? `DATABASE CHEMISTRY REFERENCE (use facts only; rewrite for customers — do not dump raw IDs as the whole section):\n${input.sourceChemicalMakeup.trim()}`
      : "",
    "",
    "AVAILABLE CITATIONS (keep titles/urls; rewrite summaries to be specific and useful):",
    citationBlock,
    "",
    "Return JSON only.",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: [
          "You write premium, product-specific research-catalog copy for River Valley Research Peptides (RVR Peptides).",
          "Audience: laboratory researchers and qualified buyers — professional, confident, and specific.",
          "",
          "STRICT RULES:",
          "- Write original prose. Never paste PubMed abstracts verbatim.",
          "- Never use generic filler such as 'published literature describes research interest' or 'source-backed records are used to describe'.",
          "- Name the exact product, size, and form repeatedly where relevant.",
          "- No human/animal consumption, no dosing, no treatment/cure/prevention claims.",
          "- No FDA approval implications. Research / laboratory / analytical use only.",
          "- chemicalMakeup should be scannable (short lines, labels, not one dense paragraph).",
          "- researchContent should explain what researchers explore in literature without overstating conclusions.",
          "- shortDescription: 1-2 compelling sentences for catalog cards.",
          "- overview: 2-3 short paragraphs with a personal, trustworthy RVR voice.",
          "- If specs are missing, say 'verify on CoA' rather than inventing values.",
          "",
          STYLE_EXAMPLE,
        ].join("\n"),
      },
      { role: "user", content: userPrompt },
    ],
    outputSchema: {
      name: "product_copy_draft",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          shortDescription: { type: "string" },
          overview: { type: "string" },
          chemicalMakeup: { type: "string" },
          researchContent: { type: "string" },
          citations: {
            type: "array",
            minItems: 0,
            maxItems: 5,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                authors: { type: "string" },
                journal: { type: "string" },
                year: { type: "string" },
                url: { type: "string" },
                summary: { type: "string" },
              },
              required: ["title", "authors", "journal", "year", "url", "summary"],
            },
          },
        },
        required: ["shortDescription", "overview", "chemicalMakeup", "researchContent", "citations"],
      },
    },
  });

  const raw = extractAssistantText(result);
  if (!raw) {
    throw new Error("AI copy generation returned an empty response.");
  }

  try {
    const draft = parseGeneratedCopy(raw);
    if (!draft.overview && !draft.researchContent) {
      throw new Error("AI copy generation returned incomplete content.");
    }

    if (!draft.citations.length && citations.length) {
      draft.citations = citations.map((citation) => ({
        ...citation,
        summary: citation.summary || "Peer-reviewed or database-indexed reference relevant to this compound.",
      }));
    }

    return draft;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `AI copy generation failed to parse: ${error.message}`
        : "AI copy generation failed to parse the response."
    );
  }
}
