import fs from "fs/promises";
import path from "path";
import {
  formatPeptideLabsBulkReportMarkdown,
} from "../server/peptideLabsBulkImport.ts";

const reportPath = path.join(process.cwd(), "reports/peptide-labs-import-latest.json");
const raw = await fs.readFile(reportPath, "utf8");
const report = JSON.parse(raw);
const md = [
  "# Peptide Labs Match Report",
  "",
  `- Matched: ${report.matched?.length || 0}`,
  `- Unmatched: ${report.unmatched?.length || 0}`,
  "",
  ...(report.matched?.length
    ? ["## Matched", "", ...report.matched.map((item: any) => `- **${item.name}** (\`${item.slug}\`) → ${item.sourceTitle}`), ""]
    : []),
  ...(report.unmatched?.length
    ? ["## Unmatched", "", ...report.unmatched.map((item: any) => `- **${item.name}** (\`${item.slug}\`)`), ""]
    : []),
].join("\n");

await fs.writeFile(path.join(process.cwd(), "reports/peptide-labs-import-latest.md"), md, "utf8");
console.log("Wrote reports/peptide-labs-import-latest.md");
