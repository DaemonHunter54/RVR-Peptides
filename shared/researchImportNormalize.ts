export type NormalizedCitation = {
  title: string;
  authors?: string;
  journal?: string;
  year?: string;
  url?: string;
  summary?: string;
};

function normalizeCitationEntry(entry: unknown): NormalizedCitation | null {
  if (!entry || typeof entry !== "object") return null;
  const record = entry as Record<string, unknown>;
  const title = String(record.title || "").trim();
  if (!title) return null;
  return {
    title,
    authors: String(record.authors || "").trim(),
    journal: String(record.journal || "").trim(),
    year: String(record.year || "").trim(),
    url: String(record.url || "").trim(),
    summary: String(record.summary || "").trim(),
  };
}

export function parseCitationList(value: unknown): NormalizedCitation[] {
  if (Array.isArray(value)) {
    return value.map(normalizeCitationEntry).filter((item): item is NormalizedCitation => Boolean(item));
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeCitationEntry).filter((item): item is NormalizedCitation => Boolean(item));
      }
    } catch {
      // ignore invalid JSON
    }
  }
  return [];
}

export function isCitationJsonBlob(text: string): boolean {
  const trimmed = String(text || "").trim();
  if (!trimmed.startsWith("[")) return false;
  try {
    const parsed = JSON.parse(trimmed);
    return (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      parsed.every((item) => item && typeof item === "object" && typeof (item as any).title === "string")
    );
  } catch {
    return false;
  }
}

export function sanitizeImportedResearchFields(fields: {
  overview?: string;
  chemicalMakeup?: string;
  researchContent?: string;
  citations?: unknown;
}) {
  let overview = String(fields.overview || "").trim();
  let chemicalMakeup = String(fields.chemicalMakeup || "").trim();
  let researchContent = String(fields.researchContent || "").trim();
  let citations = parseCitationList(fields.citations);

  if (isCitationJsonBlob(researchContent)) {
    if (!citations.length) citations = parseCitationList(researchContent);
    researchContent = "";
  }
  if (isCitationJsonBlob(overview)) {
    if (!citations.length) citations = parseCitationList(overview);
    overview = "";
  }
  if (isCitationJsonBlob(chemicalMakeup)) {
    if (!citations.length) citations = parseCitationList(chemicalMakeup);
    chemicalMakeup = "";
  }

  return { overview, chemicalMakeup, researchContent, citations };
}
