import { parseRawKnowledgeTemplateFromHtml, fetchFreshKnowledgeTemplate } from "../server/corePeptidesImport.ts";

const oneLine =
  "Size: 70mg Contents: BPC-157 (10mg) & TB-500 (10mg) & GHK-Cu (50mg) Form: Lyophilized powder Purity: >99% SKU: BPC-157-TB-500-GHK-Cu-70mg";

function parseSpecField(text: string, label: string, stopBefore: string[]): string {
  const stopPattern = stopBefore.length ? `(?=\\s*(?:${stopBefore.join("|")}):)` : "$";
  const pattern = new RegExp(`${label}:\\s*([\\s\\S]*?)${stopPattern}`, "i");
  const match = pattern.exec(text);
  return match?.[1]?.trim() || "";
}

const specs = {
  size: parseSpecField(oneLine, "Size", ["Contents", "Form", "Purity", "SKU"]),
  contents: parseSpecField(oneLine, "Contents", ["Form", "Purity", "SKU"]),
  form: parseSpecField(oneLine, "Form", ["Purity", "SKU"]),
  purity: parseSpecField(oneLine, "Purity", ["SKU"]),
  sku: parseSpecField(oneLine, "SKU", []),
};

console.log("one-line specs", specs);

async function main() {
  const parsed = await fetchFreshKnowledgeTemplate("bpc-157-tb-500-ghk-cu-blend");
  console.log("live specs", {
    sourceSize: parsed.sourceSize,
    sourceContents: parsed.sourceContents,
    sourceForm: parsed.sourceForm,
    sourcePurity: parsed.sourcePurity,
    sourceSku: parsed.sourceSku,
  });
  console.log("lengths", {
    sourceSize: parsed.sourceSize.length,
    sourceContents: parsed.sourceContents.length,
    sourceForm: parsed.sourceForm.length,
    sourcePurity: parsed.sourcePurity.length,
    sourceSku: parsed.sourceSku.length,
  });
}

main().catch(console.error);
