import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Save, Sparkles, Trash2, Database } from "lucide-react";
import { useEffect, useState } from "react";
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

export function ProductResearchWorkflow({
  productName,
  productMeta,
  value,
  onChange,
  onShortDescriptionChange,
  onOverviewPreview,
}: {
  productName: string;
  productMeta?: ProductResearchMeta;
  value: ProductResearchDraft;
  onChange: (next: ProductResearchDraft) => void;
  onShortDescriptionChange?: (shortDescription: string) => void;
  onOverviewPreview?: (overview: string) => void;
}) {
  const [fetchingSources, setFetchingSources] = useState(false);
  const generateDraft = trpc.admin.research.generateDraft.useMutation();

  const update = (patch: Partial<ProductResearchDraft>) => onChange({ ...value, ...patch });

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

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm text-blue-900 font-medium mb-1">Two-step workflow</p>
        <p className="text-xs text-blue-800/80 leading-relaxed">
          <strong>1. Fetch Sources</strong> pulls PubChem / PubMed citations and raw chemistry.
          <strong> 2. Generate Draft Copy</strong> uses AI with your Product Brief to write original, product-specific catalog content — not generic template text.
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-800">Product Brief</h2>
          <p className="text-xs text-slate-400 mt-1">
            Tell the AI what makes this listing unique — size, use case, audience, and tone. This drives the customer-facing voice.
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
        <div className="flex flex-wrap gap-2">
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

      <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-800">Published Research Content</h2>
          <p className="text-xs text-slate-400 mt-1">Review and edit before saving. This appears on the product detail page.</p>
        </div>
        <div>
          <Label>Overview</Label>
          <Textarea
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
        {value.citations.length ? (
          <div className="space-y-3">
            {value.citations.map((citation, index) => (
              <CitationEditorRow
                key={index}
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
  productMeta,
  onShortDescriptionChange,
}: {
  productId: number;
  productName: string;
  productMeta?: ProductResearchMeta;
  onShortDescriptionChange?: (shortDescription: string) => void;
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

  const [draft, setDraft] = useState<ProductResearchDraft>({
    productBrief: "",
    qualityNotes: "",
    overview: "",
    chemicalMakeup: "",
    researchContent: "",
    citations: [],
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded || researchQuery.isLoading) return;
    const research = researchQuery.data?.research;
    const citations = researchQuery.data?.citations || [];
    setDraft({
      productBrief: research?.productBrief || "",
      qualityNotes: research?.qualityNotes || "",
      overview: research?.overview || "",
      chemicalMakeup: research?.chemicalMakeup || "",
      researchContent: research?.researchContent || "",
      citations: citations.map((citation: any) => ({
        title: citation.title || "",
        authors: citation.authors || "",
        journal: citation.journal || "",
        year: citation.year || "",
        url: citation.url || "",
        summary: citation.summary || "",
      })),
    });
    setLoaded(true);
  }, [researchQuery.data, researchQuery.isLoading, loaded]);

  const saveAll = async () => {
    await upsertResearch.mutateAsync({
      productId,
      productBrief: draft.productBrief || "",
      qualityNotes: draft.qualityNotes || "",
      overview: draft.overview || "",
      chemicalMakeup: draft.chemicalMakeup || "",
      researchContent: draft.researchContent || "",
    });

    const existing = researchQuery.data?.citations || [];
    for (const citation of existing) {
      await deleteCitation.mutateAsync({ id: citation.id });
    }
    for (let index = 0; index < draft.citations.length; index++) {
      const citation = draft.citations[index];
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
    await researchQuery.refetch();
    setLoaded(false);
  };

  return (
    <div className="space-y-4 mt-6">
      <ProductResearchWorkflow
        productName={productName}
        productMeta={productMeta}
        value={draft}
        onChange={setDraft}
        onShortDescriptionChange={onShortDescriptionChange}
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
