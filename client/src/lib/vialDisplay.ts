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

function escXml(value: string): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizeDoseText(value: string): string {
  const m = String(value || "").match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(mg|mcg|iu|ml|g)(?:\s*\/\s*(ml|vial))?/i);
  if (!m) return String(value || "").toUpperCase().trim();
  const per = m[3] ? `/${m[3].toUpperCase()}` : "";
  return `${m[1]} ${m[2].toUpperCase()}${per}`;
}

function extractDosage(name: string, explicitSize?: string): string {
  const source = explicitSize && String(explicitSize).trim() ? explicitSize : name;
  const matches = String(source || "").match(/\d+(?:,\d+)?(?:\.\d+)?\s*(?:mg|mcg|iu|ml|g)(?:\s*\/\s*(?:ml|vial))?/gi);
  if (!matches?.length) return "";
  return matches.map(normalizeDoseText).join(" / ");
}

function extractPeptideName(name: string): string {
  return String(name || "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\d+(?:,\d+)?(?:\.\d+)?\s*(?:mg|mcg|iu|ml|g)(?:\s*\/\s*(?:ml|vial))?/gi, " ")
    .replace(/\s*\/\s*$/g, "")
    .replace(/^\s*\/\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitLines(text: string, maxChars: number, maxLines: number): string[] {
  const clean = String(text || "").trim().replace(/\s*\/\s*/g, " / ").replace(/\s+/g, " ");
  if (!clean) return [];
  const words = clean.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (test.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = kept[maxLines - 1].replace(/\.{3}$|…$/g, "") + "…";
  return kept;
}

function textBlock(lines: string[], x: number, y: number, fontSize: number, lineHeight: number): string {
  if (!lines.length) return "";
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  return `<text x="${x}" y="${startY}" text-anchor="middle" dominant-baseline="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="900" fill="#005AA4">${lines.map((line, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}">${escXml(line)}</tspan>`).join("")}</text>`;
}

function buildPhotorealVialSvg(name?: string, size?: string): string {
  const W = 1116;
  const H = 1410;
  const cx = W / 2;
  const peptideName = (extractPeptideName(name || "") || "PRODUCT").toUpperCase();
  const dosage = extractDosage(name || "", size).toUpperCase();

  const nameLines = splitLines(peptideName, peptideName.length > 22 ? 13 : 16, 3);
  const doseLines = splitLines(dosage, 15, 2);
  const nameFont = nameLines.length >= 3 ? 36 : peptideName.length > 24 ? 40 : peptideName.length > 15 ? 48 : 60;
  const doseFont = doseLines.length > 1 || dosage.length > 14 ? 42 : 58;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <image href="/assets/rvr-photoreal-vial-template.png" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid meet"/>
  <defs>
    <clipPath id="labelClip"><rect x="318" y="452" width="480" height="660" rx="72"/></clipPath>
    <linearGradient id="sheen" x1="318" y1="0" x2="798" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="0.12" stop-color="#eaf4ff" stop-opacity="0.24"/>
      <stop offset="0.24" stop-color="#8fa8be" stop-opacity="0.08"/>
      <stop offset="0.78" stop-color="#eaf4ff" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <g clip-path="url(#labelClip)">
    <rect x="318" y="452" width="480" height="660" rx="72" fill="#fff" opacity="1"/>
    <rect x="330" y="470" width="456" height="620" rx="66" fill="url(#sheen)"/>
    ${textBlock(nameLines, cx, 640, Math.round(nameFont * 1.15), Math.round(nameFont * 1.05))}
    <image href="/assets/rvr-company-logo-large.png" x="340" y="720" width="440" height="232" preserveAspectRatio="xMidYMid meet"/>
    ${doseLines.length ? textBlock(doseLines, cx, 1025, Math.round(doseFont * 1.18), Math.round(doseFont * 1.08)) : ""}
  </g>
</svg>`;
}

export function generatedVialUrl(slug: string, name?: string, size?: string): string {
  const safeSlug = makeSlug(slug || name || "preview-product") || "preview-product";
  const params = new URLSearchParams();
  if (name) params.set("name", name);
  if (size) params.set("size", size);
  params.set("v", "rvr-photoreal-svg-final-2");
  return `/api/vial/${safeSlug}.png?${params.toString()}`;
}

export function productImageUrl(product: any, variant?: any): string {
  if (!isNonVialProduct(product)) {
    const variantLabel = variant?.label ? String(variant.label) : "";
    return generatedVialUrl(product?.slug || "product", product?.name || "Product", variantLabel || product?.size || "");
  }
  return variant?.imageUrl || product?.imageUrl || "";
}
