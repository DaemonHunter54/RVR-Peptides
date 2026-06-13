import * as db from "./db";
import {
  fetchPeptideLabsCatalog,
  fetchPeptideLabsProduct,
  findCatalogMatch,
  type PeptideLabsCatalogItem,
} from "./peptideLabsImport";

export type PeptideLabsBulkItem = {
  productId: number;
  slug: string;
  name: string;
  category?: string;
};

export type PeptideLabsBulkReport = {
  clearedProducts: number;
  matched: Array<{ slug: string; name: string; sourceUrl: string; sourceTitle: string }>;
  unmatched: Array<{ slug: string; name: string; reason: string; suggestion?: string }>;
  failed: Array<{ slug: string; name: string; error: string }>;
};

export async function clearAllProductResearchContent(): Promise<number> {
  return db.clearAllProductResearchContent();
}

export async function runPeptideLabsBulkImport(options: {
  products: PeptideLabsBulkItem[];
  apply?: boolean;
  catalog?: PeptideLabsCatalogItem[];
}): Promise<PeptideLabsBulkReport> {
  const catalog = options.catalog || (await fetchPeptideLabsCatalog(true));
  const report: PeptideLabsBulkReport = {
    clearedProducts: 0,
    matched: [],
    unmatched: [],
    failed: [],
  };

  if (options.apply) {
    report.clearedProducts = await clearAllProductResearchContent();
  }

  for (const product of options.products) {
    const match = findCatalogMatch(product.name, catalog);
    if (!match) {
      report.unmatched.push({
        slug: product.slug,
        name: product.name,
        reason: "No Peptide Labs catalog match",
      });
      continue;
    }

    try {
      const imported = await fetchPeptideLabsProduct(match.url);
      report.matched.push({
        slug: product.slug,
        name: product.name,
        sourceUrl: match.url,
        sourceTitle: match.title,
      });

      if (options.apply && product.productId) {
        await db.upsertProductResearch(product.productId, {
          templateSourceUrl: match.url,
          overview: imported.overview,
          chemicalMakeup: imported.chemicalMakeup,
          researchContent: imported.researchContent,
          productBrief: "",
          qualityNotes: "",
        });
        await db.deleteProductCitations(product.productId);
      }
    } catch (error: any) {
      report.failed.push({
        slug: product.slug,
        name: product.name,
        error: String(error?.message || error),
      });
    }
  }

  return report;
}

export function formatPeptideLabsBulkReportMarkdown(report: PeptideLabsBulkReport): string {
  const lines = [
    "# Peptide Labs Import Report",
    "",
    `- Cleared research rows: ${report.clearedProducts}`,
    `- Matched: ${report.matched.length}`,
    `- Unmatched: ${report.unmatched.length}`,
    `- Failed: ${report.failed.length}`,
    "",
  ];

  if (report.matched.length) {
    lines.push("## Matched", "");
    for (const item of report.matched) {
      lines.push(`- **${item.name}** (\`${item.slug}\`) → [${item.sourceTitle}](${item.sourceUrl})`);
    }
    lines.push("");
  }

  if (report.unmatched.length) {
    lines.push("## Needs manual URL", "");
    for (const item of report.unmatched) {
      lines.push(`- **${item.name}** (\`${item.slug}\`) — ${item.reason}`);
    }
    lines.push("");
  }

  if (report.failed.length) {
    lines.push("## Failed", "");
    for (const item of report.failed) {
      lines.push(`- **${item.name}** (\`${item.slug}\`) — ${item.error}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
