import fs from "fs/promises";
import path from "path";
import { DEFAULT_PRODUCTS } from "../shared/rvrProductCatalog.ts";
import {
  fetchPeptideLabsCatalog,
  findCatalogMatch,
} from "../server/peptideLabsImport.ts";

async function main() {
  const catalog = await fetchPeptideLabsCatalog(true);
  const matched: Array<{ slug: string; name: string; sourceUrl: string; sourceTitle: string }> = [];
  const unmatched: Array<{ slug: string; name: string }> = [];

  for (const product of DEFAULT_PRODUCTS) {
    const hit = findCatalogMatch(product.name, catalog);
    if (hit) {
      matched.push({ slug: product.slug, name: product.name, sourceUrl: hit.url, sourceTitle: hit.title });
    } else {
      unmatched.push({ slug: product.slug, name: product.name });
    }
  }

  const report = { matched, unmatched, catalogCount: catalog.length };
  const reportsDir = path.join(process.cwd(), "reports");
  await fs.mkdir(reportsDir, { recursive: true });
  await fs.writeFile(path.join(reportsDir, "peptide-labs-import-latest.json"), JSON.stringify(report, null, 2), "utf8");

  console.log(`Catalog items: ${catalog.length}`);
  console.log(`Matched: ${matched.length}`);
  console.log(`Unmatched: ${unmatched.length}`);
  for (const item of unmatched) console.log(`- ${item.name}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
