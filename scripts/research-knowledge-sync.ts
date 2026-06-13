import fs from "fs/promises";
import path from "path";
import { syncFullKnowledgeBase } from "../server/researchKnowledgeBase.ts";

const force = process.argv.includes("--force");

async function main() {
  console.log(`Syncing research knowledge base${force ? " (force refresh)" : ""}...`);
  const report = await syncFullKnowledgeBase({ force });
  console.log(JSON.stringify(report, null, 2));
  console.log(`Synced ${report.synced}/${report.total} templates (${report.failed.length} failed).`);
  if (report.failed.length) {
    console.log("Failed templates:");
    for (const item of report.failed) {
      console.log(`- ${item.templateSlug}: ${item.error}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
