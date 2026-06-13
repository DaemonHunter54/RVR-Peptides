import { resolveProductionDatabaseUrl } from "./resolveProductionDatabaseUrl.ts";

process.env.DATABASE_URL = resolveProductionDatabaseUrl();

const { getAllProducts, getProductResearchSummaryMap } = await import("../server/db.ts");
const { getMissingResearchFields, isResearchIncomplete, isGiftCardProduct } = await import(
  "../shared/researchCompleteness.ts"
);

const { products } = await getAllProducts({});
const researchMap = await getProductResearchSummaryMap();

const incomplete: Array<{ name: string; slug: string; missing: string[]; overview: number; details: number; apps: number }> = [];
const complete: string[] = [];

for (const product of products) {
  if (isGiftCardProduct(product)) continue;
  const research = researchMap.get(product.id);
  const missing = getMissingResearchFields(research);
  if (missing.length) {
    incomplete.push({
      name: product.name,
      slug: product.slug,
      missing,
      overview: String(research?.overview || "").trim().length,
      details: String(research?.chemicalMakeup || "").trim().length,
      apps: String(research?.researchContent || "").trim().length,
    });
  } else {
    complete.push(product.slug);
  }
}

console.log(`Total products: ${products.length}`);
console.log(`Complete: ${complete.length}`);
console.log(`Missing info: ${incomplete.length}`);
console.log("\n--- Incomplete ---");
for (const row of incomplete) {
  console.log(`${row.name} (${row.slug})`);
  console.log(`  missing: ${row.missing.join(", ")}`);
  console.log(`  lengths: desc=${row.overview} details=${row.details} apps=${row.apps}`);
}
