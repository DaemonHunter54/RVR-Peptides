import fs from "fs/promises";
import path from "path";
import { DEFAULT_PRODUCTS } from "../shared/rvrProductCatalog.ts";
import {
  buildBulkImportReport,
  formatBulkImportReportMarkdown,
  runBulkResearchImport,
} from "../server/researchBulkImport.ts";
import { syncFullKnowledgeBase } from "../server/researchKnowledgeBase.ts";

const apply = process.argv.includes("--apply");
const syncKb = process.argv.includes("--sync-kb");

async function main() {
  const products = DEFAULT_PRODUCTS.map((product) => ({
    slug: product.slug,
    name: product.name,
    category: product.category,
  }));

  if (syncKb) {
    console.log("Syncing research knowledge base first...");
    const syncReport = await syncFullKnowledgeBase();
    console.log(`Knowledge base: ${syncReport.synced}/${syncReport.total} templates cached.`);
  }

  const report = apply
    ? await runBulkResearchImport({ products, apply: true, syncKnowledgeBase: false })
    : await buildBulkImportReport(products);

  const reportsDir = path.join(process.cwd(), "reports");
  await fs.mkdir(reportsDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = path.join(reportsDir, `research-import-report-${stamp}.json`);
  const mdPath = path.join(reportsDir, `research-import-report-${stamp}.md`);

  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), "utf8");
  await fs.writeFile(mdPath, formatBulkImportReportMarkdown(report), "utf8");

  await fs.writeFile(path.join(reportsDir, "research-import-report-latest.json"), JSON.stringify(report, null, 2), "utf8");
  await fs.writeFile(path.join(reportsDir, "research-import-report-latest.md"), formatBulkImportReportMarkdown(report), "utf8");

  console.log(`Report written to:\n- ${jsonPath}\n- ${mdPath}`);
  console.log(`Matched: ${report.matched.length}`);
  console.log(`Unmatched: ${report.unmatched.length}`);
  if (report.unmatched.length) {
    console.log("\nUnmatched products:");
    for (const item of report.unmatched) {
      const best = item.bestSuggestion
        ? ` → best: ${item.bestSuggestion.title} (${Math.round(item.bestSuggestion.score * 100)}%)`
        : "";
      console.log(`- ${item.name} [${item.slug}] (${item.recommendation})${best}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
