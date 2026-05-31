export function makeSlug(value: string): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const NON_VIAL_TERMS = [
  "capsule", "capsules", "cream", "cleanser", "sunscreen", "mask", "lotion", "serum",
  "kit", "box", "card", "storage", "cap", "bottle", "spray", "dropper"
];

export function isNonVialProduct(product: any): boolean {
  const text = [product?.slug, product?.name, product?.form, product?.category, ...(product?.categories || []).map((c: any) => c?.name)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return NON_VIAL_TERMS.some((term) => text.includes(term));
}

export function generatedVialUrl(slug: string, name?: string, size?: string): string {
  const safeSlug = makeSlug(slug || name || "preview-product") || "preview-product";
  const params = new URLSearchParams();
  if (name) params.set("name", name);
  if (size) params.set("size", size);
  params.set("v", "rvr-photoreal-template-v6");
  return `/api/vial/${safeSlug}.png?${params.toString()}`;
}

export function productImageUrl(product: any, variant?: any): string {
  if (!isNonVialProduct(product)) {
    const variantLabel = variant?.label ? String(variant.label) : "";
    return generatedVialUrl(product?.slug || "product", product?.name || "Product", variantLabel || product?.size || "");
  }
  return variant?.imageUrl || product?.imageUrl || "";
}
