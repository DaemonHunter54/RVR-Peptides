import fs from "fs/promises";
import path from "path";
import {
  parseRawKnowledgeTemplateFromHtml,
  fetchTemplateCatalog,
  fetchTemplatePageHtml,
  type RawKnowledgeTemplate,
} from "./corePeptidesImport";

const KB_JSON_PATH = path.join(process.cwd(), "data", "research-knowledge-base.json");
const SYNC_DELAY_MS = 250;

export type KnowledgeBaseSnapshot = {
  syncedAt: string;
  templateCount: number;
  templates: RawKnowledgeTemplate[];
};

async function readJsonKnowledgeBase(): Promise<Map<string, RawKnowledgeTemplate>> {
  try {
    const raw = await fs.readFile(KB_JSON_PATH, "utf8");
    const parsed = JSON.parse(raw) as KnowledgeBaseSnapshot;
    return new Map(parsed.templates.map((item) => [item.templateSlug, item]));
  } catch {
    return new Map();
  }
}

async function writeJsonKnowledgeBase(templates: RawKnowledgeTemplate[]) {
  await fs.mkdir(path.dirname(KB_JSON_PATH), { recursive: true });
  const snapshot: KnowledgeBaseSnapshot = {
    syncedAt: new Date().toISOString(),
    templateCount: templates.length,
    templates: templates.sort((a, b) => a.title.localeCompare(b.title)),
  };
  await fs.writeFile(KB_JSON_PATH, JSON.stringify(snapshot, null, 2), "utf8");
}

export async function getKnowledgeTemplate(templateSlug: string): Promise<RawKnowledgeTemplate | null> {
  const jsonMap = await readJsonKnowledgeBase();
  const fromJson = jsonMap.get(templateSlug);
  if (fromJson) return fromJson;

  if (process.env.DATABASE_URL) {
    const db = await import("./db");
    const fromDb = await db.getResearchKnowledgeTemplate(templateSlug);
    if (fromDb) return fromDb;
  }

  return null;
}

export async function upsertKnowledgeTemplate(template: RawKnowledgeTemplate): Promise<void> {
  if (process.env.DATABASE_URL) {
    const db = await import("./db");
    await db.upsertResearchKnowledgeTemplate(template);
  }

  const jsonMap = await readJsonKnowledgeBase();
  jsonMap.set(template.templateSlug, template);
  await writeJsonKnowledgeBase([...jsonMap.values()]);
}

export async function syncKnowledgeTemplate(templateSlug: string): Promise<RawKnowledgeTemplate> {
  const html = await fetchTemplatePageHtml(templateSlug);
  const parsed = parseRawKnowledgeTemplateFromHtml(html, templateSlug);
  try {
    await upsertKnowledgeTemplate(parsed);
  } catch (error) {
    console.warn(`Knowledge base persist failed for ${templateSlug}:`, error);
  }
  return parsed;
}

export type KnowledgeBaseSyncReport = {
  syncedAt: string;
  total: number;
  synced: number;
  failed: Array<{ templateSlug: string; error: string }>;
};

export async function syncFullKnowledgeBase(options?: { force?: boolean }): Promise<KnowledgeBaseSyncReport> {
  const catalog = await fetchTemplateCatalog(Boolean(options?.force));
  const report: KnowledgeBaseSyncReport = {
    syncedAt: new Date().toISOString(),
    total: catalog.length,
    synced: 0,
    failed: [],
  };

  const templates: RawKnowledgeTemplate[] = [];

  for (const item of catalog) {
    try {
      if (!options?.force) {
        const existing = await getKnowledgeTemplate(item.slug);
        if (existing) {
          templates.push(existing);
          report.synced += 1;
          continue;
        }
      }

      const parsed = await syncKnowledgeTemplate(item.slug);
      templates.push(parsed);
      report.synced += 1;
      await new Promise((resolve) => setTimeout(resolve, SYNC_DELAY_MS));
    } catch (error: any) {
      report.failed.push({
        templateSlug: item.slug,
        error: error?.message || "Sync failed",
      });
    }
  }

  if (templates.length) {
    await writeJsonKnowledgeBase(templates);
  }

  return report;
}

export async function getKnowledgeBaseCount(): Promise<number> {
  const jsonMap = await readJsonKnowledgeBase();
  if (jsonMap.size > 0) return jsonMap.size;

  if (!process.env.DATABASE_URL) return 0;

  const db = await import("./db");
  const dbCount = await db.getResearchKnowledgeTemplateCount();
  if (dbCount > 0) return dbCount;
  return jsonMap.size;
}
