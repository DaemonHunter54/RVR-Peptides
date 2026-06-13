import { fetchPeptideLabsProduct } from "../server/peptideLabsImport.ts";

const url = process.argv[2] || "https://peptidelabs.us/cagrilintide/?attribute_strength=5%20mg";
const result = await fetchPeptideLabsProduct(url);
console.log({
  overview: result.overview.length,
  details: result.chemicalMakeup.length,
  apps: result.researchContent.length,
});
