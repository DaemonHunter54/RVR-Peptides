import {
  DIRECT_MATCH_SCORE,
  type TemplateMatchResult,
} from "../shared/researchTemplateMatch";
import {
  fetchResearchTemplate,
  fetchTemplateCatalog,
  searchResearchTemplates,
  type ListingSpecs,
} from "./corePeptidesImport";

export type BulkImportProduct = {
  id?: number;
  slug: string;
  name: string;
  category?: string;
  size?: string | null;
  purity?: string | null;
  form?: string | null;
  contents?: string | null;
  sku?: string | null;
  otherNames?: string | null;
  molecularFormula?: string | null;
  molecularWeight?: string | null;
};

export type BulkImportMatched = {
  slug: string;
  name: string;
  category?: string;
  templateSlug: string;
  templateTitle: string;
  score: number;
  applied: boolean;
  error?: string;
};

export type BulkImportUnmatched = {
  slug: string;
  name: string;
  category?: string;
  bestSuggestion?: TemplateMatchResult;
  suggestions: TemplateMatchResult[];
  recommendation: "pick-suggestion" | "create-from-scratch";
};

export type BulkImportReport = {
  generatedAt: string;
  knowledgeBaseTemplates: number;
  catalogTemplates: number;
  totalProducts: number;
  matched: BulkImportMatched[];
  unmatched: BulkImportUnmatched[];
  errors: Array<{ slug: string; name: string; error: string }>;
};

function listingSpecsFromProduct(product: BulkImportProduct): ListingSpecs {
  return {
    productName: product.name,
    size: product.size || undefined,
    purity: product.purity || undefined,
    form: product.form || undefined,
    contents: product.contents || undefined,
    sku: product.sku || undefined,
    otherNames: product.otherNames || undefined,
    molecularFormula: product.molecularFormula || undefined,
    molecularWeight: product.molecularWeight || undefined,
  };
}

async function applyImportedResearch(product: BulkImportProduct, imported: Awaited<ReturnType<typeof fetchResearchTemplate>>) {
  if (!product.id) return;
  const db = await import("./db");

  await db.upsertProductResearch(product.id, {
    overview: imported.overview,
    chemicalMakeup: imported.chemicalMakeup,
    researchContent: imported.researchContent,
  });

  const existing = await db.getProductCitations(product.id);
  for (const citation of existing) {
    await db.deleteCitation(citation.id);
  }

  for (let index = 0; index < imported.citations.length; index++) {
    const citation = imported.citations[index];
    await db.createCitation({
      productId: product.id,
      citationNumber: index + 1,
      title: citation.title,
      authors: citation.authors,
      journal: citation.journal,
      year: citation.year,
      url: citation.url,
      summary: citation.summary,
    });
  }

  const productPatch: Record<string, string> = {
    shortDescription: imported.shortDescription,
  };
  const applied = imported.appliedSpecs;
  if (!product.size && applied.size) productPatch.size = applied.size;
  if (!product.purity && applied.purity) productPatch.purity = applied.purity;
  if (!product.form && applied.form) productPatch.form = applied.form;
  if (!product.contents && applied.contents) productPatch.contents = applied.contents;
  if (!product.sku && applied.sku) productPatch.sku = applied.sku;

  await db.updateProduct(product.id, productPatch as any);
}

export async function buildBulkImportReport(products: BulkImportProduct[]): Promise<BulkImportReport> {
  const catalog = await fetchTemplateCatalog();
  const { getKnowledgeBaseCount } = await import("./researchKnowledgeBase");
  const kbCount = await getKnowledgeBaseCount();

  const report: BulkImportReport = {
    generatedAt: new Date().toISOString(),
    knowledgeBaseTemplates: kbCount,
    catalogTemplates: catalog.length,
    totalProducts: products.length,
    matched: [],
    unmatched: [],
    errors: [],
  };

  for (const product of products) {
    try {
      const search = await searchResearchTemplates(product.slug, product.name);
      const templateSlug =
        search.match?.slug ||
        search.suggestions.find((item) => item.score >= DIRECT_MATCH_SCORE)?.slug;

      if (!templateSlug || !search.match) {
        const suggestions = search.suggestions.slice(0, 5);
        const best = suggestions[0];
        report.unmatched.push({
          slug: product.slug,
          name: product.name,
          category: product.category,
          bestSuggestion: best,
          suggestions,
          recommendation:
            best && best.score >= 0.35 ? "pick-suggestion" : "create-from-scratch",
        });
        continue;
      }

      report.matched.push({
        slug: product.slug,
        name: product.name,
        category: product.category,
        templateSlug,
        templateTitle: search.match.title,
        score: search.match.score,
        applied: false,
      });
    } catch (error: any) {
      report.errors.push({
        slug: product.slug,
        name: product.name,
        error: error?.message || "Match failed",
      });
    }
  }

  return report;
}

export async function runBulkResearchImport(options: {
  products?: BulkImportProduct[];
  apply?: boolean;
  syncKnowledgeBase?: boolean;
}): Promise<BulkImportReport> {
  let products = options.products;
  if (!products) {
    const db = await import("./db");
    const { products: allProducts } = await db.getAllProducts({});
    products = allProducts.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      size: product.size,
      purity: product.purity,
      form: product.form,
      contents: product.contents,
      sku: product.sku,
      otherNames: product.otherNames,
      molecularFormula: product.molecularFormula,
      molecularWeight: product.molecularWeight,
    }));
  }

  if (options.syncKnowledgeBase !== false) {
    const { syncFullKnowledgeBase } = await import("./researchKnowledgeBase");
    await syncFullKnowledgeBase();
  }

  const report = await buildBulkImportReport(products);

  if (!options.apply) {
    return report;
  }

  for (const matched of report.matched) {
    const product = products.find((item) => item.slug === matched.slug);
    if (!product) continue;

    try {
      const imported = await fetchResearchTemplate(
        matched.templateSlug,
        listingSpecsFromProduct(product),
        product.slug
      );
      await applyImportedResearch(product, imported);
      matched.applied = true;
    } catch (error: any) {
      matched.applied = false;
      matched.error = error?.message || "Import failed";
      report.errors.push({
        slug: product.slug,
        name: product.name,
        error: matched.error,
      });
    }
  }

  return report;
}

export function formatBulkImportReportMarkdown(report: BulkImportReport): string {
  const lines: string[] = [
    `# Research Template Bulk Import Report`,
    ``,
    `Generated: ${report.generatedAt}`,
    `Knowledge base templates: ${report.knowledgeBaseTemplates}`,
    `Source catalog templates: ${report.catalogTemplates}`,
    `RVR products scanned: ${report.totalProducts}`,
    ``,
    `## Matched (${report.matched.length})`,
    ``,
  ];

  if (!report.matched.length) {
    lines.push(`_None_`, ``);
  } else {
    for (const item of report.matched) {
      lines.push(
        `- **${item.name}** (\`${item.slug}\`) → ${item.templateTitle} (\`${item.templateSlug}\`, ${Math.round(item.score * 100)}%)${item.applied ? " ✓ applied" : ""}${item.error ? ` — ${item.error}` : ""}`
      );
    }
    lines.push(``);
  }

  lines.push(`## Unmatched (${report.unmatched.length})`, ``);

  if (!report.unmatched.length) {
    lines.push(`_None_`, ``);
  } else {
    for (const item of report.unmatched) {
      lines.push(`### ${item.name}`, `- Slug: \`${item.slug}\`${item.category ? `\n- Category: ${item.category}` : ""}`);
      lines.push(`- Recommendation: **${item.recommendation === "pick-suggestion" ? "Review similar templates below" : "Create from scratch"}**`);
      if (item.suggestions.length) {
        lines.push(`- Similar templates:`);
        for (const suggestion of item.suggestions) {
          lines.push(`  - ${suggestion.title} (\`${suggestion.slug}\`, ${Math.round(suggestion.score * 100)}%)`);
        }
      } else {
        lines.push(`- Similar templates: _none found_`);
      }
      lines.push(``);
    }
  }

  if (report.errors.length) {
    lines.push(`## Errors (${report.errors.length})`, ``);
    for (const item of report.errors) {
      lines.push(`- **${item.name}** (\`${item.slug}\`): ${item.error}`);
    }
  }

  return lines.join("\n");
}
