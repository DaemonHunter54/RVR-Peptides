import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Save, Sparkles, Trash2, Database, BookOpen } from "lucide-react";
import { parseResearchTemplateSourceUrl } from "@shared/researchTemplateSource";
import { parseCitationList, sanitizeImportedResearchFields } from "@shared/researchImportNormalize";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";

export type ResearchCitationDraft = {
  title: string;
  authors?: string;
  journal?: string;
  year?: string;
  url?: string;
  summary?: string;
};

export type ProductResearchDraft = {
  productBrief?: string;
  qualityNotes?: string;
  templateSourceUrl?: string;
  overview?: string;
  description?: string;
  chemicalMakeup: string;
  researchContent: string;
  citations: ResearchCitationDraft[];
};

export type ProductResearchMeta = {
  size?: string;
  purity?: string;
  form?: string;
  contents?: string;
  sku?: string;
  otherNames?: string;
  molecularFormula?: string;
  molecularWeight?: string;
  shortDescription?: string;
};

async function requestResearchSources(payload: {
  productId?: number | string;
  peptideName: string;
  synonyms?: string[];
  molecularFormula?: string;
  molecularWeight?: string;
}) {
  const response = await fetch("/api/get-research-details", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    try {
      const parsed = JSON.parse(errorBody);
      throw new Error(parsed?.error || "Unable to fetch research sources.");
    } catch {
      throw new Error(errorBody || "Unable to fetch research sources.");
    }
  }
  const details = await response.json();
  const sources = Array.isArray(details.sources) ? details.sources : [];
  return {
    chemicalMakeup: details.chemical_makeup_block || details.chemicalMakeup || "",
    citations: sources.map((source: any, index: number) => ({
      title: source.title || "Research source",
      authors: source.authors || "",
      journal: source.database || source.journal || "Scientific database",
      year: source.year || "",
      url: source.url || "",
      summary: source.supports || source.summary || "",
    })),
  };
}

function CitationEditorRow({
  citation,
  index,
  onChange,
  onRemove,
}: {
  citation: ResearchCitationDraft;
  index: number;
  onChange: (next: ResearchCitationDraft) => void;
  onRemove: () => void;
}) {
  return (
    <div className="p-4 rounded-lg border border-slate-100 bg-slate-50 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-blue-700">Source {index + 1}</span>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="h-7 text-red-500 px-2">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <Input value={citation.title || ""} onChange={(e) => onChange({ ...citation, title: e.target.value })} placeholder="Source title" className="bg-white" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Input value={citation.authors || ""} onChange={(e) => onChange({ ...citation, authors: e.target.value })} placeholder="Authors" className="bg-white" />
        <Input value={citation.journal || ""} onChange={(e) => onChange({ ...citation, journal: e.target.value })} placeholder="Journal / database" className="bg-white" />
        <Input value={citation.year || ""} onChange={(e) => onChange({ ...citation, year: e.target.value })} placeholder="Year" className="bg-white" />
      </div>
      <Input value={citation.url || ""} onChange={(e) => onChange({ ...citation, url: e.target.value })} placeholder="URL" className="bg-white" />
      <Textarea value={citation.summary || ""} onChange={(e) => onChange({ ...citation, summary: e.target.value })} placeholder="Why this source matters for this product" rows={2} className="bg-white" />
    </div>
  );
}

function buildImportPayload(
  productSlug: string,
  productName: string,
  productMeta: ProductResearchMeta | undefined,
  options: { templateSlug?: string; sourceUrl?: string }
) {
  return {
    productSlug,
    productName,
    templateSlug: options.templateSlug,
    sourceUrl: options.sourceUrl,
    size: productMeta?.size,
    purity: productMeta?.purity,
    form: productMeta?.form,
    contents: productMeta?.contents,
    sku: productMeta?.sku,
    otherNames: productMeta?.otherNames,
    molecularFormula: productMeta?.molecularFormula,
    molecularWeight: productMeta?.molecularWeight,
  };
}

function mergeImportedDraft(
  prev: ProductResearchDraft,
  imported: any,
  sourceUrl?: string
): ProductResearchDraft {
  const normalized = sanitizeImportedResearchFields({
    overview: imported.overview,
    chemicalMakeup: imported.chemicalMakeup,
    researchContent: imported.researchContent,
    citations: imported.citations,
  });

  return {
    ...prev,
    overview: normalized.overview,
    chemicalMakeup: normalized.chemicalMakeup,
    researchContent: normalized.researchContent,
    citations: normalized.citations.length ? normalized.citations : prev.citations,
    templateSourceUrl: sourceUrl || imported.sourceUrl || prev.templateSourceUrl,
  };
}

const emptyResearchDraft = (): ProductResearchDraft => ({
  productBrief: "",
  qualityNotes: "",
  overview: "",
  chemicalMakeup: "",
  researchContent: "",
  citations: [],
});

function friendlyImportError(error: any, fallback: string) {
  const message = String(error?.message || "").trim();
  if (!message) return fallback;
  if (message.includes("Failed query:") || message.includes("insert into `researchKnowledgeTemplates`")) {
    return "Template import hit a database cache error. Retry after deploy, or contact support if it persists.";
  }
  if (message.length > 200) return fallback;
  return message;
}

export function ProductResearchWorkflow({
  productName,
  productSlug,
  productMeta,
  value,
  onChange,
  onShortDescriptionChange,
  onOverviewPreview,
  onListingSpecsApply,
}: {
  productName: string;
  productSlug?: string;
  productMeta?: ProductResearchMeta;
  value: ProductResearchDraft;
  onChange: Dispatch<SetStateAction<ProductResearchDraft>>;
  onShortDescriptionChange?: (shortDescription: string) => void;
  onOverviewPreview?: (overview: string) => void;
  onListingSpecsApply?: (specs: Partial<ProductResearchMeta>) => void;
}) {
  const [fetchingSources, setFetchingSources] = useState(false);
  const [pullingReference, setPullingReference] = useState(false);
  const [importRevision, setImportRevision] = useState(0);

  const utils = trpc.useUtils();
  const generateDraft = trpc.admin.research.generateDraft.useMutation();
  const importTemplate = trpc.admin.research.importTemplate.useMutation();

  const update = (patch: Partial<ProductResearchDraft>) => {
    onChange((prev) => ({ ...prev, ...patch }));
  };

  const importedHasContent = (imported: {
    overview?: string;
    chemicalMakeup?: string;
    researchContent?: string;
    citations?: unknown;
  }) => {
    const normalized = sanitizeImportedResearchFields(imported);
    return Boolean(
      normalized.overview ||
        normalized.chemicalMakeup ||
        normalized.researchContent ||
        normalized.citations.length > 0
    );
  };

  const applyImportedTemplate = async (imported: any, sourceUrl?: string) => {
    if (!importedHasContent(imported)) {
      throw new Error("Import returned no research content. Try a different source URL or re-sync the knowledge base.");
    }

    let merged = mergeImportedDraft(value, imported, sourceUrl);
    onChange((prev) => {
      merged = mergeImportedDraft(prev, imported, sourceUrl);
      return merged;
    });
    setImportRevision((revision) => revision + 1);

    onShortDescriptionChange?.(imported.shortDescription);
    onOverviewPreview?.(imported.overview || merged.overview);

    const applied = imported.appliedSpecs || {};
    onListingSpecsApply?.({
      size: productMeta?.size ? undefined : applied.size,
      purity: productMeta?.purity ? undefined : applied.purity,
      form: productMeta?.form ? undefined : applied.form,
      contents: productMeta?.contents ? undefined : applied.contents,
      sku: productMeta?.sku ? undefined : applied.sku,
      molecularFormula: productMeta?.molecularFormula ? undefined : applied.molecularFormula,
      molecularWeight: productMeta?.molecularWeight ? undefined : applied.molecularWeight,
    });
  };

  const runImport = async (templateSlug: string) => {
    const name = String(productName || "").trim();
    const slug = String(productSlug || "").trim();
    if (!name || !slug) {
      toast.error("Enter a product name and slug first.");
      return;
    }

    const imported = await importTemplate.mutateAsync(
      buildImportPayload(slug, name, productMeta, { templateSlug })
    );
    await applyImportedTemplate(imported);
    toast.success(`Reference research loaded for ${name}. Review your dose, SKU, and specs, then save.`);
  };

  const runImportFromSourceUrl = async (sourceUrlInput: string) => {
    const sourceUrl = String(sourceUrlInput || "").trim();
    const name = String(productName || "").trim();
    const slug = String(productSlug || "").trim();

    if (!name || !slug) {
      toast.error("Enter a product name and slug first.");
      return;
    }
    if (!sourceUrl) {
      toast.error("Paste a reference product URL first.");
      return;
    }
    if (!parseResearchTemplateSourceUrl(sourceUrl)) {
      toast.error("That link does not look valid. Use a URL ending in /peptides/product-slug/");
      return;
    }

    const imported = await importTemplate.mutateAsync(
      buildImportPayload(slug, name, productMeta, { sourceUrl })
    );
    await applyImportedTemplate(imported, sourceUrl);
    toast.success(`Reference research loaded for ${name}. Review your dose, SKU, and specs, then save.`);
  };

  const pullReferenceResearch = async () => {
    const name = String(productName || "").trim();
    const slug = String(productSlug || "").trim();
    if (!name || !slug) {
      toast.error("Enter a product name and slug first.");
      return;
    }

    const sourceUrl = String(value.templateSourceUrl || "").trim();
    setPullingReference(true);
    try {
      if (sourceUrl && parseResearchTemplateSourceUrl(sourceUrl)) {
        await runImportFromSourceUrl(sourceUrl);
        return;
      }

      const search = await utils.admin.research.searchTemplate.fetch({
        productSlug: slug,
        productName: name,
      });

      if (search.match) {
        await runImport(search.match.slug);
        return;
      }

      toast.error(
        "No automatic match found. Paste a reference product URL below (must end in /peptides/product-slug/), then click Pull Reference Research again."
      );
    } catch (error: any) {
      toast.error(friendlyImportError(error, "Unable to pull reference research."));
    } finally {
      setPullingReference(false);
    }
  };

  const fetchSources = async () => {
    const name = String(productName || "").trim();
    if (!name) {
      toast.error("Enter a product name first.");
      return;
    }

    setFetchingSources(true);
    try {
      const sources = await requestResearchSources({
        peptideName: name,
        synonyms: productMeta?.otherNames
          ? productMeta.otherNames.split(/[,;|]/).map((item) => item.trim()).filter(Boolean)
          : [],
        molecularFormula: productMeta?.molecularFormula,
        molecularWeight: productMeta?.molecularWeight,
      });
      update({
        chemicalMakeup: sources.chemicalMakeup || value.chemicalMakeup,
        citations: sources.citations.length ? sources.citations.slice(0, 5) : value.citations,
      });
      toast.success("Research sources loaded. Click Generate Draft Copy to write customer-facing content.");
    } catch (error: any) {
      toast.error(error?.message || "Unable to fetch research sources.");
    } finally {
      setFetchingSources(false);
    }
  };

  const generateCopy = async () => {
    const name = String(productName || "").trim();
    if (!name) {
      toast.error("Enter a product name first.");
      return;
    }

    try {
      const draft = await generateDraft.mutateAsync({
        productName: name,
        productBrief: value.productBrief || "",
        qualityNotes: value.qualityNotes || "",
        size: productMeta?.size,
        purity: productMeta?.purity,
        form: productMeta?.form,
        contents: productMeta?.contents,
        sku: productMeta?.sku,
        otherNames: productMeta?.otherNames,
        molecularFormula: productMeta?.molecularFormula,
        molecularWeight: productMeta?.molecularWeight,
        shortDescription: productMeta?.shortDescription,
        sourceChemicalMakeup: value.chemicalMakeup,
        citations: value.citations,
      });

      update({
        overview: draft.overview,
        chemicalMakeup: draft.chemicalMakeup,
        researchContent: draft.researchContent,
        citations: draft.citations.length ? draft.citations : value.citations,
      });
      onShortDescriptionChange?.(draft.shortDescription);
      onOverviewPreview?.(draft.overview);
      toast.success("Draft copy generated. Review and edit before publishing.");
    } catch (error: any) {
      toast.error(error?.message || "Unable to generate draft copy.");
    }
  };

  const researchActionsBusy = pullingReference || importTemplate.isPending;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm text-blue-900 font-medium mb-1">Research content workflow</p>
        <p className="text-xs text-blue-800/80 leading-relaxed">
          <strong>Pull Reference Research</strong> loads overview, chemical makeup, research sections, and citations from the shared reference catalog (matched by product name, or from a URL you paste).
          <strong> Fetch Sources</strong> pulls PubChem / PubMed citations.
          <strong> Generate Draft Copy</strong> uses AI with your Product Brief for original RVR-specific copy.
          Nothing saves until you click <strong>Save Research Content</strong>.
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-800">Product Brief</h2>
          <p className="text-xs text-slate-400 mt-1">
            Optional notes for AI draft copy — size, use case, audience, and tone.
          </p>
        </div>
        <div>
          <Label>What should customers know about this specific product?</Label>
          <Textarea
            value={value.productBrief || ""}
            onChange={(e) => update({ productBrief: e.target.value })}
            className="mt-1.5"
            rows={4}
            placeholder="Example: 5mg lyophilized BPC-157 for researchers running tissue-repair model studies. Emphasize batch traceability, ≥99% purity target, and that this is the exact 5mg unit size labs use for repeat protocols."
          />
        </div>
        <div>
          <Label>Quality & RVR differentiators</Label>
          <Textarea
            value={value.qualityNotes || ""}
            onChange={(e) => update({ qualityNotes: e.target.value })}
            className="mt-1.5"
            rows={3}
            placeholder="Example: Third-party tested, CoA/HPLC available, same-day processing, research-grade handling standards."
          />
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">Published Research Content</h2>
            <p className="text-xs text-slate-400 mt-1">Review and edit before saving. This appears on the product detail page.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={pullReferenceResearch}
              disabled={researchActionsBusy}
              className="gap-1.5"
            >
              {researchActionsBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookOpen className="h-3.5 w-3.5" />}
              {researchActionsBusy ? "Pulling..." : "Pull Reference Research"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={fetchSources} disabled={fetchingSources} className="gap-1.5">
              {fetchingSources ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
              {fetchingSources ? "Fetching..." : "Fetch Sources"}
            </Button>
            <Button type="button" size="sm" onClick={generateCopy} disabled={generateDraft.isPending} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
              {generateDraft.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {generateDraft.isPending ? "Generating..." : "Generate Draft Copy"}
            </Button>
          </div>
        </div>
        <div>
          <Label>Reference product URL (optional fallback)</Label>
          <p className="text-xs text-slate-400 mt-1 mb-1.5">
            Use when this product has no automatic catalog match. Paste any reference listing URL ending in <code className="text-xs">/peptides/product-slug/</code>, then click Pull Reference Research.
          </p>
          <Input
            value={value.templateSourceUrl || ""}
            onChange={(e) => update({ templateSourceUrl: e.target.value })}
            placeholder="https://your-reference-site.com/peptides/product-slug/"
            className="flex-1"
          />
        </div>
        <div>
          <Label>Overview</Label>
          <Textarea
            key={`overview-${importRevision}`}
            value={value.overview || ""}
            onChange={(e) => update({ overview: e.target.value })}
            className="mt-1.5"
            rows={5}
            placeholder="Customer-facing introduction — specific to this product size and use case."
          />
        </div>
        <div>
          <Label>Chemical Makeup</Label>
          <Textarea
            key={`chemical-${importRevision}`}
            value={value.chemicalMakeup}
            onChange={(e) => update({ chemicalMakeup: e.target.value })}
            className="mt-1.5 font-mono text-sm"
            rows={6}
            placeholder="Scannable identity facts: name, size, form, purity, sequence, identifiers."
          />
        </div>
        <div>
          <Label>Research Content</Label>
          <Textarea
            key={`research-${importRevision}`}
            value={value.researchContent}
            onChange={(e) => update({ researchContent: e.target.value })}
            className="mt-1.5"
            rows={7}
            placeholder="What the literature explores — written for researchers, not copied from abstracts."
          />
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-800">Research Citations</h2>
            <p className="text-xs text-slate-400">Fetch Sources fills these automatically. Generate Draft Copy rewrites summaries.</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => update({ citations: [...value.citations, { title: "", authors: "", journal: "", year: "", url: "", summary: "" }] })}
            className="gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Add Source
          </Button>
        </div>
        {Array.isArray(value.citations) && value.citations.length ? (
          <div className="space-y-3">
            {value.citations.map((citation, index) => (
              <CitationEditorRow
                key={`${importRevision}-${index}-${citation.title?.slice(0, 24) || index}`}
                citation={citation}
                index={index}
                onChange={(next) => {
                  const citations = [...value.citations];
                  citations[index] = next;
                  update({ citations });
                }}
                onRemove={() => update({ citations: value.citations.filter((_, i) => i !== index) })}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-8">No sources yet. Click Fetch Sources or add manually.</p>
        )}
      </div>
    </div>
  );
}

export function PersistedProductResearchWorkflow({
  productId,
  productName,
  productSlug,
  productMeta,
  onShortDescriptionChange,
  onListingSpecsApply,
}: {
  productId: number;
  productName: string;
  productSlug?: string;
  productMeta?: ProductResearchMeta;
  onShortDescriptionChange?: (shortDescription: string) => void;
  onListingSpecsApply?: (specs: Partial<ProductResearchMeta>) => void;
}) {
  const researchQuery = trpc.admin.research.get.useQuery({ productId });
  const upsertResearch = trpc.admin.research.upsert.useMutation({
    onSuccess: () => {
      toast.success("Research content saved!");
      researchQuery.refetch();
    },
    onError: (err: any) => toast.error(err.message),
  });
  const addCitation = trpc.admin.research.addCitation.useMutation();
  const deleteCitation = trpc.admin.research.deleteCitation.useMutation();

  const [draft, setDraft] = useState<ProductResearchDraft>(emptyResearchDraft());
  const [hydrated, setHydrated] = useState(false);
  const dirtyRef = useRef(false);

  const draftFromServer = (research: any, citations: any[]): ProductResearchDraft => {
    const normalized = sanitizeImportedResearchFields({
      overview: research?.overview,
      chemicalMakeup: research?.chemicalMakeup,
      researchContent: research?.researchContent,
      citations: parseCitationList(citations),
    });

    return {
      productBrief: research?.productBrief || "",
      qualityNotes: research?.qualityNotes || "",
      templateSourceUrl: research?.templateSourceUrl || "",
      overview: normalized.overview,
      chemicalMakeup: normalized.chemicalMakeup,
      researchContent: normalized.researchContent,
      citations: normalized.citations.map((citation) => ({
        title: citation.title || "",
        authors: citation.authors || "",
        journal: citation.journal || "",
        year: citation.year || "",
        url: citation.url || "",
        summary: citation.summary || "",
      })),
    };
  };

  useEffect(() => {
    dirtyRef.current = false;
    setHydrated(false);
    setDraft(emptyResearchDraft());
  }, [productId]);

  useEffect(() => {
    if (hydrated || researchQuery.isLoading || dirtyRef.current) return;
    if (!researchQuery.data) return;

    setDraft(draftFromServer(researchQuery.data.research, researchQuery.data.citations || []));
    setHydrated(true);
  }, [hydrated, researchQuery.data, researchQuery.isLoading, productId]);

  const handleDraftChange: Dispatch<SetStateAction<ProductResearchDraft>> = (action) => {
    dirtyRef.current = true;
    setDraft(action);
  };

  const syncDraftToServer = async (nextDraft: ProductResearchDraft) => {
    await upsertResearch.mutateAsync({
      productId,
      productBrief: nextDraft.productBrief || "",
      qualityNotes: nextDraft.qualityNotes || "",
      templateSourceUrl: nextDraft.templateSourceUrl || "",
      overview: nextDraft.overview || "",
      chemicalMakeup: nextDraft.chemicalMakeup || "",
      researchContent: nextDraft.researchContent || "",
    });

    const existing = researchQuery.data?.citations || [];
    for (const citation of existing) {
      await deleteCitation.mutateAsync({ id: citation.id });
    }
    for (let index = 0; index < nextDraft.citations.length; index++) {
      const citation = nextDraft.citations[index];
      if (!String(citation.title || "").trim()) continue;
      await addCitation.mutateAsync({
        productId,
        citationNumber: index + 1,
        title: citation.title,
        authors: citation.authors || "",
        journal: citation.journal || "",
        year: citation.year || "",
        url: citation.url || "",
        summary: citation.summary || "",
      });
    }
  };

  const saveAll = async () => {
    await syncDraftToServer(draft);
    dirtyRef.current = false;
    setHydrated(false);
    await researchQuery.refetch();
  };

  return (
    <div className="space-y-4 mt-6">
      <ProductResearchWorkflow
        productName={productName}
        productSlug={productSlug}
        productMeta={productMeta}
        value={draft}
        onChange={handleDraftChange}
        onShortDescriptionChange={onShortDescriptionChange}
        onListingSpecsApply={onListingSpecsApply}
      />
      <div className="flex justify-end">
        <Button type="button" onClick={saveAll} disabled={upsertResearch.isPending} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Save className="h-4 w-4" />
          {upsertResearch.isPending ? "Saving..." : "Save Research Content"}
        </Button>
      </div>
    </div>
  );
}
