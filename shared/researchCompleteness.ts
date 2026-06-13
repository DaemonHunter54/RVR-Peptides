import { isCitationJsonBlob } from "./researchImportNormalize";

export type ResearchCompletenessInput = {
  overview?: string | null;
  chemicalMakeup?: string | null;
  researchContent?: string | null;
};

export function isGiftCardProduct(product: { slug?: string | null; name?: string | null }) {
  const slug = String(product.slug || "").toLowerCase();
  const name = String(product.name || "").toLowerCase();
  return slug === "gift-card" || name.includes("gift card");
}

export function getMissingResearchFields(research?: ResearchCompletenessInput | null): string[] {
  const missing: string[] = [];
  const overview = String(research?.overview || "").trim();
  const chemicalMakeup = String(research?.chemicalMakeup || "").trim();
  const researchContent = String(research?.researchContent || "").trim();

  if (overview.length < 20) missing.push("description");
  if (chemicalMakeup.length < 10) missing.push("product details");
  if (researchContent.length < 20 || isCitationJsonBlob(researchContent)) missing.push("research applications");

  return missing;
}

export function isResearchIncomplete(
  research: ResearchCompletenessInput | null | undefined,
  product: { slug?: string | null; name?: string | null }
) {
  if (isGiftCardProduct(product)) return false;
  return getMissingResearchFields(research).length > 0;
}
