import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { isValidPeptideLabsSourceUrl } from "@shared/peptideLabsSource";
import { Loader2, BookOpen } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
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
      toast.error("Paste a source product URL first.");
      return;
    }
    if (!isValidPeptideLabsSourceUrl(sourceUrl)) {
      toast.error("That URL is not supported. Use a full product page link.");
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
      toast.success("Content loaded. Review and save.");
    } catch (error: any) {
      toast.error(error?.message || "Unable to pull content from that URL.");
    } finally {
      setPulling(false);
    }
  };

  const busy = pulling || importTemplate.isPending;

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-5 mt-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="font-semibold text-slate-800">Product Description</h2>
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
