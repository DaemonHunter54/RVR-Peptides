import { fetchResearchTemplate } from "../server/corePeptidesImport.ts";
import { parseResearchTemplateSourceUrl } from "../shared/researchTemplateSource.ts";

async function main() {
  const url = "https://www.corepeptides.com/peptides/bpc-157-tb-500-ghk-cu-blend/";
  const slug = parseResearchTemplateSourceUrl(url);
  console.log("slug", slug);
  const r = await fetchResearchTemplate(slug!, { productName: "Glow" }, "glow");
  console.log("overview", r.overview.length, r.overview.slice(0, 120));
  console.log("chemical", r.chemicalMakeup.length);
  console.log("research", r.researchContent.length);
  console.log("citations", r.citations.length);
}

main().catch(console.error);
