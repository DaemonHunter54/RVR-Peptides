import {
  VISUAL_BUILDER_MESSAGE_SOURCE,
  type VisualBuilderPatchMessage,
} from "@shared/visualBuilderRegions";
import { trpc } from "@/lib/trpc";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type VisualBuilderContextValue = {
  enabled: boolean;
  settings: Record<string, string>;
};

const VisualBuilderContext = createContext<VisualBuilderContextValue>({
  enabled: false,
  settings: {},
});

function isVisualBuilderMode() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("visualBuilder") === "1";
}

export function VisualBuilderProvider({ children }: { children: React.ReactNode }) {
  const enabled = isVisualBuilderMode();
  const settingsQuery = trpc.settings.public.useQuery();
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!enabled) return;

    const onMessage = (event: MessageEvent) => {
      const data = event.data as VisualBuilderPatchMessage | undefined;
      if (!data || data.source !== VISUAL_BUILDER_MESSAGE_SOURCE || data.type !== "patch") return;
      setOverrides(data.settings);
    };

    window.addEventListener("message", onMessage);
    window.parent.postMessage({ source: VISUAL_BUILDER_MESSAGE_SOURCE, type: "ready" }, "*");
    return () => window.removeEventListener("message", onMessage);
  }, [enabled]);

  const settings = useMemo(() => {
    const base = settingsQuery.data || {};
    return { ...base, ...overrides };
  }, [settingsQuery.data, overrides]);

  return (
    <VisualBuilderContext.Provider value={{ enabled, settings }}>
      {children}
    </VisualBuilderContext.Provider>
  );
}

export function useVisualBuilderSettings() {
  return useContext(VisualBuilderContext);
}
