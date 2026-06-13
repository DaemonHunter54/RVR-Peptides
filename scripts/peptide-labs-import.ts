import fs from "fs/promises";
import path from "path";
import * as db from "../server/db.ts";
import {
  formatPeptideLabsBulkReportMarkdown,
  runPeptideLabsBulkImport,
} from "../server/peptideLabsBulkImport.ts";

const apply = process.argv.includes("--apply");

async function main() {
  const { products } = await db.getAllProducts({});
  const items = products
    .filter((product: any) => {
      const slug = String(product.slug || "").toLowerCase();
      const name = String(product.name || "").toLowerCase();
      return slug !== "gift-card" && !name.includes("gift card");
    })
    .map((product: any) => ({
      productId: product.id,
      slug: product.slug,
      name: product.name,
    }));

  const report = await runPeptideLabsBulkImport({ products: items, apply });
  const reportsDir = path.join(process.cwd(), "reports");
  await fs.mkdir(reportsDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = path.join(reportsDir, `peptide-labs-import-${stamp}.json`);
  const mdPath = path.join(reportsDir, `peptide-labs-import-${stamp}.md`);

  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), "utf8");
  await fs.writeFile(mdPath, formatPeptideLabsBulkReportMarkdown(report), "utf8");
  await fs.writeFile(path.join(reportsDir, "peptide-labs-import-latest.json"), JSON.stringify(report, null, 2), "utf8");
  await fs.writeFile(path.join(reportsDir, "peptide-labs-import-latest.md"), formatPeptideLabsBulkReportMarkdown(report), "utf8");

  console.log(`Mode: ${apply ? "APPLY" : "DRY RUN"}`);
  console.log(`Cleared: ${report.clearedProducts}`);
  console.log(`Matched: ${report.matched.length}`);
  console.log(`Unmatched: ${report.unmatched.length}`);
  console.log(`Failed: ${report.failed.length}`);
  console.log(`Report: ${mdPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
