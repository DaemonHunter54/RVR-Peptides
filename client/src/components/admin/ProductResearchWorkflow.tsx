import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { isValidPeptideLabsSourceUrl } from "@shared/peptideLabsSource";
import { Loader2, Save, BookOpen } from "lucide-react";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";

export type ProductResearchDraft = {
  templateSourceUrl?: string;
  overview?: string;
  chemicalMakeup: string;
  researchContent: string;
};

export type ProductResearchMeta = {
  size?: string;
  purity?: string;
  form?: string;
};

const emptyResearchDraft = (): ProductResearchDraft => ({
  templateSourceUrl: "",
  overview: "",
  chemicalMakeup: "",
  researchContent: "",
});

export function ProductResearchWorkflow({
  productName,
  value,
  onChange,
}: {
  productName: string;
  value: ProductResearchDraft;
  onChange: Dispatch<SetStateAction<ProductResearchDraft>>;
}) {
  const [pulling, setPulling] = useState(false);
  const importTemplate = trpc.admin.research.importTemplate.useMutation();

  const update = (patch: Partial<ProductResearchDraft>) => {
    onChange((prev) => ({ ...prev, ...patch }));
  };

  const pullReferenceResearch = async () => {
    const sourceUrl = String(value.templateSourceUrl || "").trim();
    if (!sourceUrl) {
      toast.error("Paste a Peptide Labs product URL first.");
      return;
    }
    if (!isValidPeptideLabsSourceUrl(sourceUrl)) {
      toast.error("Use a Peptide Labs URL like https://peptidelabs.us/bpc-157/");
      return;
    }

    setPulling(true);
    try {
      const imported = await importTemplate.mutateAsync({
        productName: String(productName || "").trim() || "Product",
        sourceUrl,
      });

      update({
        overview: imported.overview || "",
        chemicalMakeup: imported.chemicalMakeup || "",
        researchContent: imported.researchContent || "",
        templateSourceUrl: imported.sourceUrl || sourceUrl,
      });
      toast.success("Content loaded from Peptide Labs. Review and save.");
    } catch (error: any) {
      toast.error(error?.message || "Unable to pull content from that URL.");
    } finally {
      setPulling(false);
    }
  };

  const busy = pulling || importTemplate.isPending;

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-5 mt-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="font-semibold text-slate-800">Product Description</h2>
          <p className="text-xs text-slate-400 mt-1">Matches the Peptide Labs layout: Description, Product Details, and Potential Research Applications.</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={pullReferenceResearch}
          disabled={busy}
          className="gap-1.5"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookOpen className="h-3.5 w-3.5" />}
          {busy ? "Pulling..." : "Pull Reference Research"}
        </Button>
      </div>

      <div>
        <Label>Peptide Labs product URL</Label>
        <Input
          value={value.templateSourceUrl || ""}
          onChange={(e) => update({ templateSourceUrl: e.target.value })}
          placeholder="https://peptidelabs.us/bpc-157/?attribute_strength=5%20mg"
          className="mt-1.5"
        />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={value.overview || ""}
          onChange={(e) => update({ overview: e.target.value })}
          className="mt-1.5"
          rows={6}
          placeholder="Intro paragraphs about this product."
        />
      </div>

      <div>
        <Label>Product Details</Label>
        <Textarea
          value={value.chemicalMakeup}
          onChange={(e) => update({ chemicalMakeup: e.target.value })}
          className="mt-1.5"
          rows={6}
          placeholder="Peptide, purity, form, quantity, storage, grade."
        />
      </div>

      <div>
        <Label>Potential Research Applications</Label>
        <Textarea
          value={value.researchContent}
          onChange={(e) => update({ researchContent: e.target.value })}
          className="mt-1.5"
          rows={6}
          placeholder="Bullet list of research application areas."
        />
      </div>
    </div>
  );
}

export function PersistedProductResearchWorkflow({
  productId,
  productName,
}: {
  productId: number;
  productName: string;
}) {
  const utils = trpc.useUtils();
  const researchQuery = trpc.admin.research.get.useQuery({ productId });
  const upsertResearch = trpc.admin.research.upsert.useMutation({
    onSuccess: () => {
      toast.success("Product description saved!");
      researchQuery.refetch();
      utils.admin.products.list.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const [draft, setDraft] = useState<ProductResearchDraft>(emptyResearchDraft());
  const [hydrated, setHydrated] = useState(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    dirtyRef.current = false;
    setHydrated(false);
    setDraft(emptyResearchDraft());
  }, [productId]);

  useEffect(() => {
    if (hydrated || researchQuery.isLoading || dirtyRef.current) return;
    if (!researchQuery.data) return;

    const research = researchQuery.data.research;
    setDraft({
      templateSourceUrl: research?.templateSourceUrl || "",
      overview: research?.overview || "",
      chemicalMakeup: research?.chemicalMakeup || "",
      researchContent: research?.researchContent || "",
    });
    setHydrated(true);
  }, [hydrated, researchQuery.data, researchQuery.isLoading, productId]);

  const handleDraftChange: Dispatch<SetStateAction<ProductResearchDraft>> = (action) => {
    dirtyRef.current = true;
    setDraft(action);
  };

  const saveAll = async () => {
    await upsertResearch.mutateAsync({
      productId,
      templateSourceUrl: draft.templateSourceUrl || "",
      overview: draft.overview || "",
      chemicalMakeup: draft.chemicalMakeup || "",
      researchContent: draft.researchContent || "",
      productBrief: "",
      qualityNotes: "",
    });
    dirtyRef.current = false;
    setHydrated(false);
    await researchQuery.refetch();
  };

  return (
    <div className="space-y-4">
      <ProductResearchWorkflow productName={productName} value={draft} onChange={handleDraftChange} />
      <div className="flex justify-end">
        <Button type="button" onClick={saveAll} disabled={upsertResearch.isPending} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Save className="h-4 w-4" />
          {upsertResearch.isPending ? "Saving..." : "Save Description"}
        </Button>
      </div>
    </div>
  );
}
