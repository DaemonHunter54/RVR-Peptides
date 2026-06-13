import {
  VISUAL_BUILDER_MESSAGE_SOURCE,
  VISUAL_BUILDER_REGIONS,
} from "@shared/visualBuilderRegions";
import { useVisualBuilderSettings } from "@/contexts/VisualBuilderContext";
import { useEffect, useRef } from "react";

export default function VisualBuilderInspector() {
  const { enabled } = useVisualBuilderSettings();
  const highlightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const highlight = document.createElement("div");
    highlight.setAttribute("data-rvr-highlight", "true");
    highlight.style.cssText =
      "position:fixed;pointer-events:none;z-index:99999;border:2px solid #2563eb;border-radius:4px;box-shadow:0 0 0 2px rgba(37,99,235,0.25);transition:all 0.12s ease;display:none;";
    document.body.appendChild(highlight);
    highlightRef.current = highlight;

    const showHighlight = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      highlight.style.display = "block";
      highlight.style.top = `${rect.top - 2}px`;
      highlight.style.left = `${rect.left - 2}px`;
      highlight.style.width = `${rect.width + 4}px`;
      highlight.style.height = `${rect.height + 4}px`;
    };

    const hideHighlight = () => {
      highlight.style.display = "none";
    };

    const onMouseMove = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || target.closest("[data-rvr-highlight]")) return;
      const region = target.closest("[data-rvr-setting]") as HTMLElement | null;
      if (region) {
        showHighlight(region);
        document.body.style.cursor = "crosshair";
      } else {
        hideHighlight();
        document.body.style.cursor = "";
      }
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const region = target.closest("[data-rvr-setting]") as HTMLElement | null;
      if (!region) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const key = region.dataset.rvrSetting || "";
      const meta = VISUAL_BUILDER_REGIONS[key];
      window.parent.postMessage(
        {
          source: VISUAL_BUILDER_MESSAGE_SOURCE,
          type: "select",
          key,
          label: meta?.label || key,
          fieldType: meta?.type || "color",
        },
        "*"
      );
      showHighlight(region);
    };

    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("mousemove", onMouseMove, true);
      document.removeEventListener("click", onClick, true);
      document.body.style.cursor = "";
      highlight.remove();
      highlightRef.current = null;
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[99998] pointer-events-none">
      <div className="rounded-full bg-blue-600 text-white text-xs font-medium px-4 py-1.5 shadow-lg">
        Click a highlighted area to edit its color or text
      </div>
    </div>
  );
}
