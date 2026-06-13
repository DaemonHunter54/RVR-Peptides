import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import fs from "fs";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handlePaymentReturn, handlePaymentWebhook } from "../paymentcloud";
import { handleIpnWebhook } from "../nowpayments";
import { storagePut } from "../storage";
import mysql from "mysql2/promise";



function getProductAssetDirs(): string[] {
  const cwd = process.cwd();
  const dirs = [
    path.join(cwd, "dist", "public", "assets"),
    path.join(cwd, "client", "public", "assets"),
  ];

  // In the bundled production server, import.meta.dirname is usually /app/dist.
  // Static assets are served from `${import.meta.dirname}/public`, so uploaded
  // files must also be written there or the browser will receive a broken URL.
  dirs.push(path.join(import.meta.dirname, "public", "assets"));

  return Array.from(new Set(dirs));
}

function getPrimaryProductAssetDir(): string {
  const productionDir = path.join(import.meta.dirname, "public", "assets");
  if (process.env.NODE_ENV === "production") return productionDir;
  return path.join(process.cwd(), "client", "public", "assets");
}

function writeProductAssetToServedLocations(
  relativeName: string,
  data: Buffer | Uint8Array | string,
) {
  for (const assetsDir of getProductAssetDirs()) {
    fs.mkdirSync(assetsDir, { recursive: true });
    fs.writeFileSync(path.join(assetsDir, relativeName), data as any);
  }
}
function readServedAsset(relativeName: string): Buffer {
  const searchDirs = [
    ...getProductAssetDirs(),
    path.join(process.cwd(), "public", "assets"),
    path.join(process.cwd(), "client", "public", "assets"),
    path.join(process.cwd(), "dist", "public", "assets"),
    path.join(import.meta.dirname, "public", "assets"),
  ];

  for (const assetsDir of searchDirs) {
    const fullPath = path.join(assetsDir, relativeName);
    if (fs.existsSync(fullPath)) return fs.readFileSync(fullPath);
  }

  throw new Error(`Asset not found: ${relativeName}`);
}



async function getProductAssetConnection(): Promise<mysql.Connection | null> {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    return await mysql.createConnection({ uri: url, connectTimeout: 10000 });
  } catch (error) {
    console.warn("[Product Asset Storage] Database connection unavailable; using local asset path.", error);
    return null;
  }
}

async function ensureProductAssetsTable(conn: mysql.Connection) {
  await conn.execute(`CREATE TABLE IF NOT EXISTS productAssets (
    id int AUTO_INCREMENT NOT NULL,
    name varchar(255) NOT NULL,
    contentType varchar(100) NOT NULL,
    data LONGBLOB NOT NULL,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY productAssets_name_unique (name)
  )`);
}

async function saveProductAssetToDatabase(
  relativeName: string,
  data: Buffer | Uint8Array | string,
  contentType: string,
): Promise<boolean> {
  const conn = await getProductAssetConnection();
  if (!conn) return false;
  try {
    await ensureProductAssetsTable(conn);
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data as any);
    await conn.execute(
      `INSERT INTO productAssets (name, contentType, data)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE contentType = VALUES(contentType), data = VALUES(data), updatedAt = CURRENT_TIMESTAMP`,
      [relativeName, contentType, buffer]
    );
    return true;
  } catch (error) {
    console.warn("[Product Asset Storage] Database asset save failed; using local asset path.", error);
    return false;
  } finally {
    await conn.end().catch(() => {});
  }
}

async function readProductAssetFromDatabase(relativeName: string): Promise<{ data: Buffer; contentType: string } | null> {
  const conn = await getProductAssetConnection();
  if (!conn) return null;
  try {
    await ensureProductAssetsTable(conn);
    const [rows] = await conn.execute<any[]>(
      `SELECT contentType, data FROM productAssets WHERE name = ? LIMIT 1`,
      [relativeName]
    );
    const row = rows?.[0];
    if (!row) return null;
    return {
      data: Buffer.from(row.data),
      contentType: String(row.contentType || "application/octet-stream"),
    };
  } catch (error) {
    console.warn("[Product Asset Storage] Database asset read failed; trying local asset path.", error);
    return null;
  } finally {
    await conn.end().catch(() => {});
  }
}

async function saveProductAsset(
  relativeName: string,
  data: Buffer | Uint8Array | string,
  contentType: string,
): Promise<{ name: string; url: string }> {
  writeProductAssetToServedLocations(relativeName, data);

  // Hard-save generated/uploaded product images to the application database.
  // Railway replaces the local filesystem on redeploy, so database-backed
  // image URLs are the durable source for user-created product assets.
  const savedToDatabase = await saveProductAssetToDatabase(relativeName, data, contentType);
  if (savedToDatabase) {
    return { name: relativeName, url: `/api/product-assets/${encodeURIComponent(relativeName)}` };
  }

  try {
    const stored = await storagePut(`assets/${relativeName}`, data, contentType);
    return { name: relativeName, url: stored.url };
  } catch (error) {
    console.warn("[Product Asset Storage] Persistent storage unavailable; using local asset path.", error);
    return { name: relativeName, url: `/assets/${relativeName}` };
  }
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}


type ResearchSource = {
  title: string;
  url: string;
  database: string;
  supports: string;
  authors?: string;
  journal?: string;
  year?: string;
  abstract?: string;
};

type ResearchDetailsResult = {
  description_block: string;
  chemical_makeup_block: string;
  research_block: string;
  sources: ResearchSource[];
  confidence: "high" | "medium" | "low";
  missing_fields: string[];
  raw_source_json?: Record<string, unknown>;
};

function normalizeResearchName(value: unknown): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\b\d+\s*(mg|mcg|ml|iu|capsules?|caps?)\b/gi, "")
    .trim();
}

function uniqueStrings(values: unknown[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const text = String(value || "").trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

function stripXml(value: string): string {
  return String(value || "")
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchJsonWithTimeout(url: string | URL, timeoutMs = 12000): Promise<any | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "Accept": "application/json" },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchTextWithTimeout(url: string | URL, timeoutMs = 12000): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "Accept": "application/xml,text/xml,text/plain,*/*" },
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function sourceKey(source: ResearchSource): string {
  return `${source.database}:${source.url || source.title}`.toLowerCase();
}

function rankedSources(sources: ResearchSource[]): ResearchSource[] {
  const priority: Record<string, number> = {
    PubChem: 1,
    PubMed: 2,
    "Europe PMC": 2,
    UniProt: 3,
    ChEMBL: 4,
    RCSB: 5,
    IUPHAR: 6,
  };
  const seen = new Set<string>();
  return sources
    .filter((source) => source.title && source.url)
    .filter((source) => {
      const key = sourceKey(source);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (priority[a.database] || 99) - (priority[b.database] || 99))
    ;
}

function chooseSourceCount(): number {
  return 3 + Math.floor(Math.random() * 3);
}

function ensureThreeSources(sources: ResearchSource[], peptideName: string): ResearchSource[] {
  const cleanName = normalizeResearchName(peptideName) || "peptide";
  const base = rankedSources(sources);
  const fallbacks: ResearchSource[] = [
    {
      title: `${cleanName} - PubMed literature search`,
      url: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(cleanName)}`,
      database: "PubMed",
      supports: "Peer-reviewed biomedical literature discovery for exact product-name research context.",
    },
    {
      title: `${cleanName} - Europe PMC literature search`,
      url: `https://europepmc.org/search?query=${encodeURIComponent(cleanName)}`,
      database: "Europe PMC",
      supports: "Additional biomedical literature metadata and abstract discovery.",
    },
    {
      title: `${cleanName} - PubChem compound search`,
      url: `https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(cleanName)}`,
      database: "PubChem",
      supports: "Public chemistry identifier and property search when an exact compound record is available.",
    },
  ];
  return rankedSources([...base, ...fallbacks]).slice(0, chooseSourceCount());
}

async function getResearchCacheConnection(): Promise<mysql.Connection | null> {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    return await mysql.createConnection({ uri: url, connectTimeout: 10000 });
  } catch (error) {
    console.warn("[Research Details] Database cache unavailable.", error);
    return null;
  }
}

async function ensureResearchCacheTable(conn: mysql.Connection) {
  await conn.execute(`CREATE TABLE IF NOT EXISTS researchDetailsCache (
    id int AUTO_INCREMENT NOT NULL,
    cacheKey varchar(255) NOT NULL,
    productId int,
    peptideName varchar(255) NOT NULL,
    researchDescription MEDIUMTEXT,
    chemicalMakeup MEDIUMTEXT,
    researchSummary MEDIUMTEXT,
    source1Title text,
    source1Url text,
    source1Supports text,
    source2Title text,
    source2Url text,
    source2Supports text,
    source3Title text,
    source3Url text,
    source3Supports text,
    researchConfidence varchar(20) DEFAULT 'low',
    rawSourceJson LONGTEXT,
    lastResearchedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY researchDetailsCache_cacheKey_unique (cacheKey)
  )`);
}

function makeResearchCacheKey(peptideName: string): string {
  return normalizeResearchName(peptideName).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "unknown";
}

async function getCachedResearchDetails(cacheKey: string): Promise<ResearchDetailsResult | null> {
  const conn = await getResearchCacheConnection();
  if (!conn) return null;
  try {
    await ensureResearchCacheTable(conn);
    const [rows] = await conn.execute<any[]>(
      `SELECT * FROM researchDetailsCache WHERE cacheKey = ? AND lastResearchedAt > DATE_SUB(NOW(), INTERVAL 30 DAY) LIMIT 1`,
      [cacheKey]
    );
    const row = rows?.[0];
    if (!row) return null;
    const sources = [
      { title: row.source1Title, url: row.source1Url, database: "Cached", supports: row.source1Supports },
      { title: row.source2Title, url: row.source2Url, database: "Cached", supports: row.source2Supports },
      { title: row.source3Title, url: row.source3Url, database: "Cached", supports: row.source3Supports },
    ].filter((source) => source.title && source.url) as ResearchSource[];
    return {
      description_block: row.researchDescription || "",
      chemical_makeup_block: row.chemicalMakeup || "",
      research_block: row.researchSummary || "",
      sources,
      confidence: (row.researchConfidence || "low") as "high" | "medium" | "low",
      missing_fields: [],
      raw_source_json: row.rawSourceJson ? JSON.parse(row.rawSourceJson) : undefined,
    };
  } catch (error) {
    console.warn("[Research Details] Cache read failed.", error);
    return null;
  } finally {
    await conn.end().catch(() => {});
  }
}

async function saveCachedResearchDetails(cacheKey: string, productId: number | null, peptideName: string, result: ResearchDetailsResult) {
  const conn = await getResearchCacheConnection();
  if (!conn) return;
  try {
    await ensureResearchCacheTable(conn);
    const sources = ensureThreeSources(result.sources, peptideName);
    await conn.execute(
      `INSERT INTO researchDetailsCache (
        cacheKey, productId, peptideName, researchDescription, chemicalMakeup, researchSummary,
        source1Title, source1Url, source1Supports, source2Title, source2Url, source2Supports,
        source3Title, source3Url, source3Supports, researchConfidence, rawSourceJson, lastResearchedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        productId = VALUES(productId),
        peptideName = VALUES(peptideName),
        researchDescription = VALUES(researchDescription),
        chemicalMakeup = VALUES(chemicalMakeup),
        researchSummary = VALUES(researchSummary),
        source1Title = VALUES(source1Title),
        source1Url = VALUES(source1Url),
        source1Supports = VALUES(source1Supports),
        source2Title = VALUES(source2Title),
        source2Url = VALUES(source2Url),
        source2Supports = VALUES(source2Supports),
        source3Title = VALUES(source3Title),
        source3Url = VALUES(source3Url),
        source3Supports = VALUES(source3Supports),
        researchConfidence = VALUES(researchConfidence),
        rawSourceJson = VALUES(rawSourceJson),
        lastResearchedAt = NOW()`,
      [
        cacheKey,
        productId,
        peptideName,
        result.description_block,
        result.chemical_makeup_block,
        result.research_block,
        sources[0]?.title || "",
        sources[0]?.url || "",
        sources[0]?.supports || "",
        sources[1]?.title || "",
        sources[1]?.url || "",
        sources[1]?.supports || "",
        sources[2]?.title || "",
        sources[2]?.url || "",
        sources[2]?.supports || "",
        result.confidence,
        JSON.stringify(result.raw_source_json || {}),
      ]
    );
  } catch (error) {
    console.warn("[Research Details] Cache save failed.", error);
  } finally {
    await conn.end().catch(() => {});
  }
}

async function lookupPubChem(peptideName: string, synonyms: string[]) {
  const terms = uniqueStrings([peptideName, ...synonyms]).slice(0, 4);
  for (const term of terms) {
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(term)}/property/MolecularFormula,MolecularWeight,IUPACName,CanonicalSMILES,IsomericSMILES,InChIKey/JSON`;
    const json = await fetchJsonWithTimeout(url);
    const props = json?.PropertyTable?.Properties?.[0];
    if (props) {
      const cid = props.CID ? String(props.CID) : "";
      const source: ResearchSource = {
        title: `${term} PubChem compound record${cid ? ` (CID ${cid})` : ""}`,
        url: cid ? `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}` : `https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(term)}`,
        database: "PubChem",
        supports: "Chemical identifiers, molecular formula, molecular weight, IUPAC name, SMILES, and InChIKey.",
      };
      return { term, props, source, raw: json };
    }
  }
  return null;
}

async function lookupPubMed(peptideName: string, synonyms: string[]) {
  const cleanName = normalizeResearchName(peptideName);
  const termParts = uniqueStrings([cleanName, ...synonyms]).slice(0, 3);
  const exactTerm = termParts.map((term) => `"${term}"`).join(" OR ") || `"${cleanName}"`;
  const searchUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi");
  searchUrl.searchParams.set("db", "pubmed");
  searchUrl.searchParams.set("retmode", "json");
  searchUrl.searchParams.set("retmax", "8");
  searchUrl.searchParams.set("sort", "relevance");
  searchUrl.searchParams.set("term", `${exactTerm} AND (peptide OR compound OR pharmacology OR mechanism OR chemistry OR assay OR receptor OR pathway)`);
  if (process.env.NCBI_API_KEY) searchUrl.searchParams.set("api_key", process.env.NCBI_API_KEY);

  const searchJson = await fetchJsonWithTimeout(searchUrl);
  const ids = (searchJson?.esearchresult?.idlist || []).slice(0, 8);
  if (!ids.length) return { sources: [], abstracts: [], raw: searchJson };

  const summaryUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi");
  summaryUrl.searchParams.set("db", "pubmed");
  summaryUrl.searchParams.set("retmode", "json");
  summaryUrl.searchParams.set("id", ids.join(","));
  if (process.env.NCBI_API_KEY) summaryUrl.searchParams.set("api_key", process.env.NCBI_API_KEY);
  const summaryJson = await fetchJsonWithTimeout(summaryUrl);

  const fetchUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi");
  fetchUrl.searchParams.set("db", "pubmed");
  fetchUrl.searchParams.set("retmode", "xml");
  fetchUrl.searchParams.set("id", ids.slice(0, 5).join(","));
  if (process.env.NCBI_API_KEY) fetchUrl.searchParams.set("api_key", process.env.NCBI_API_KEY);
  const xml = await fetchTextWithTimeout(fetchUrl);
  const abstracts = xml
    ? Array.from(xml.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/gi)).map((match) => stripXml(match[1])).filter(Boolean).slice(0, 6)
    : [];

  const sources = ids
    .map((id: string) => summaryJson?.result?.[id])
    .filter(Boolean)
    .slice(0, 3)
    .map((item: any): ResearchSource => ({
      title: String(item.title || `${cleanName} PubMed article`).replace(/\.$/, ""),
      authors: Array.isArray(item.authors) ? item.authors.map((author: any) => author.name).filter(Boolean).join(", ") : "",
      journal: item.fulljournalname || item.source || "PubMed",
      year: item.pubdate ? String(item.pubdate).slice(0, 4) : "",
      url: item.uid ? `https://pubmed.ncbi.nlm.nih.gov/${item.uid}/` : `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(cleanName)}`,
      database: "PubMed",
      supports: "Peer-reviewed literature describing research context, mechanisms, targets, assay findings, or compound-specific investigation.",
    }));

  return { sources, abstracts, raw: { searchJson, summaryJson } };
}

async function lookupEuropePmc(peptideName: string, synonyms: string[]) {
  const cleanName = normalizeResearchName(peptideName);
  const query = uniqueStrings([cleanName, ...synonyms]).slice(0, 3).map((term) => `"${term}"`).join(" OR ");
  const url = new URL("https://www.ebi.ac.uk/europepmc/webservices/rest/search");
  url.searchParams.set("query", `${query || `"${cleanName}"`} AND (peptide OR pharmacology OR mechanism OR assay OR chemistry)`);
  url.searchParams.set("format", "json");
  url.searchParams.set("pageSize", "5");
  const json = await fetchJsonWithTimeout(url);
  const records = json?.resultList?.result || [];
  const sources = records.slice(0, 2).map((item: any): ResearchSource => ({
    title: item.title || `${cleanName} Europe PMC source`,
    authors: item.authorString || "",
    journal: item.journalTitle || "Europe PMC",
    year: item.pubYear || "",
    url: item.doi ? `https://doi.org/${item.doi}` : item.pmid ? `https://europepmc.org/article/MED/${item.pmid}` : `https://europepmc.org/search?query=${encodeURIComponent(cleanName)}`,
    database: "Europe PMC",
    supports: "Biomedical literature metadata, abstract context, and additional citation support.",
    abstract: item.abstractText || "",
  }));
  return { sources, abstracts: records.map((item: any) => String(item.abstractText || "")).filter(Boolean).slice(0, 4), raw: json };
}

async function lookupUniProt(peptideName: string, synonyms: string[]) {
  const cleanName = normalizeResearchName(peptideName);
  const query = uniqueStrings([cleanName, ...synonyms]).slice(0, 2).map((term) => `"${term}"`).join(" OR ");
  const url = new URL("https://rest.uniprot.org/uniprotkb/search");
  url.searchParams.set("query", query || `"${cleanName}"`);
  url.searchParams.set("format", "json");
  url.searchParams.set("size", "3");
  const json = await fetchJsonWithTimeout(url);
  const item = json?.results?.[0];
  if (!item) return { sources: [], notes: [], raw: json };
  const accession = item.primaryAccession || "";
  const proteinName = item.proteinDescription?.recommendedName?.fullName?.value || item.proteinDescription?.submissionNames?.[0]?.fullName?.value || "";
  return {
    sources: [{
      title: `${proteinName || cleanName} UniProt record${accession ? ` (${accession})` : ""}`,
      url: accession ? `https://www.uniprot.org/uniprotkb/${accession}/entry` : `https://www.uniprot.org/uniprotkb?query=${encodeURIComponent(cleanName)}`,
      database: "UniProt",
      supports: "Protein/peptide sequence context, organism, gene names, and functional annotations when applicable.",
    } as ResearchSource],
    notes: [
      accession ? `UniProt accession: ${accession}` : "",
      proteinName ? `Protein/sequence context: ${proteinName}` : "",
      item.organism?.scientificName ? `Organism: ${item.organism.scientificName}` : "",
    ].filter(Boolean),
    raw: json,
  };
}

async function lookupChembl(peptideName: string, synonyms: string[]) {
  const cleanName = normalizeResearchName(peptideName);
  const url = `https://www.ebi.ac.uk/chembl/api/data/molecule/search.json?q=${encodeURIComponent(cleanName)}`;
  const json = await fetchJsonWithTimeout(url);
  const molecule = json?.molecules?.[0];
  if (!molecule) return { sources: [], notes: [], raw: json };
  const id = molecule.molecule_chembl_id || "";
  return {
    sources: [{
      title: `${molecule.pref_name || cleanName} ChEMBL molecule record${id ? ` (${id})` : ""}`,
      url: id ? `https://www.ebi.ac.uk/chembl/explore/compound/${id}` : `https://www.ebi.ac.uk/chembl/g/#search_results/all/query=${encodeURIComponent(cleanName)}`,
      database: "ChEMBL",
      supports: "Bioactivity, molecule, target, and assay metadata where the compound is represented in ChEMBL.",
    } as ResearchSource],
    notes: [
      id ? `ChEMBL ID: ${id}` : "",
      molecule.molecule_type ? `Molecule type: ${molecule.molecule_type}` : "",
      molecule.max_phase !== undefined ? `Development phase metadata: ${molecule.max_phase}` : "",
    ].filter(Boolean),
    raw: json,
  };
}

async function lookupRcsb(peptideName: string, synonyms: string[]) {
  const cleanName = normalizeResearchName(peptideName);
  const query = {
    query: {
      type: "terminal",
      service: "text",
      parameters: {
        attribute: "struct.title",
        operator: "contains_phrase",
        value: cleanName,
      },
    },
    return_type: "entry",
    request_options: { paginate: { start: 0, rows: 3 } },
  };
  const json = await fetchJsonWithTimeout("https://search.rcsb.org/rcsbsearch/v2/query?json=" + encodeURIComponent(JSON.stringify(query)));
  const id = json?.result_set?.[0]?.identifier;
  if (!id) return { sources: [], notes: [], raw: json };
  return {
    sources: [{
      title: `${cleanName} RCSB PDB structure search (${id})`,
      url: `https://www.rcsb.org/structure/${id}`,
      database: "RCSB",
      supports: "3D structure or structure-search context where related peptide, receptor, or complex records are available.",
    } as ResearchSource],
    notes: [`RCSB PDB matching entry: ${id}`],
    raw: json,
  };
}

function buildChemicalMakeupBlock(peptideName: string, pubChem: any, provided: { sequence?: string; molecularFormula?: string; molecularWeight?: string }, notes: string[]): { text: string; missing: string[] } {
  const lines: string[] = [];
  const missing: string[] = [];
  const props = pubChem?.props;
  lines.push(`${peptideName}`);
  if (props?.CID) lines.push(`PubChem CID: ${props.CID}`);
  const formula = provided.molecularFormula || props?.MolecularFormula;
  const mw = provided.molecularWeight || props?.MolecularWeight;
  if (formula) lines.push(`Molecular formula: ${formula}`); else { lines.push("Molecular formula: Not confirmed from available sources."); missing.push("molecularFormula"); }
  if (mw) lines.push(`Molecular weight: ${mw}`); else { lines.push("Molecular weight: Not confirmed from available sources."); missing.push("molecularWeight"); }
  if (provided.sequence) lines.push(`Sequence: ${provided.sequence}`); else { lines.push("Sequence: Not confirmed from available sources."); missing.push("sequence"); }
  if (props?.IUPACName) lines.push(`IUPAC name: ${props.IUPACName}`);
  if (props?.CanonicalSMILES) lines.push(`Canonical SMILES: ${props.CanonicalSMILES}`);
  if (props?.IsomericSMILES) lines.push(`Isomeric SMILES: ${props.IsomericSMILES}`);
  if (props?.InChIKey) lines.push(`InChIKey: ${props.InChIKey}`);
  if (notes.length) lines.push(...notes);
  return { text: lines.join("\n"), missing };
}

function buildDescriptionBlock(peptideName: string, chemicalText: string, abstracts: string[], sources: ResearchSource[], confidence: "high" | "medium" | "low"): string {
  const sourceTitles = sources.map((s) => s.title).slice(0, 3).join("; ");
  const abstractSummary = abstracts.join(" ").replace(/\s+/g, " ").slice(0, 1800);
  return [
    `${peptideName} is presented as a research-use compound for laboratory, analytical, and scientific investigation. Source-backed records are used to describe the compound identity, available chemistry, and the literature context associated with the exact product name or its closest confirmed synonyms.`,
    `Available chemical and identifier information is summarized from public scientific databases. ${chemicalText.includes("Molecular formula: Not confirmed") ? "Some chemistry fields were not confirmed from the available records, so those values should be verified against the product certificate of analysis before publication." : "The available chemistry record provides a confirmed starting point for identity review, including formula, molecular weight, and structural identifiers where available."}`,
    abstractSummary
      ? `Published biomedical literature describes research interest in ${peptideName} through experimental, mechanism-focused, assay, formulation, analytical, or pharmacology contexts. The most relevant available records discuss the compound in relation to its investigated pathways, measurable laboratory effects, and study-model findings.`
      : `Public literature searches returned limited exact abstract text for ${peptideName}; the description is therefore limited to verified database identifiers and source-backed discovery links rather than unconfirmed mechanism claims.`,
    sourceTitles
      ? `The most useful source context currently comes from ${sourceTitles}. These sources support the product description, chemistry review, and research-summary sections without implying approved clinical use.`
      : "",
    `Research confidence: ${confidence}. This product is not intended to diagnose, treat, cure, or prevent any disease. It is offered for research, laboratory, or analytical use only and is not for human or animal consumption.`,
  ].filter(Boolean).join("\n\n");
}

function buildResearchBlock(peptideName: string, abstracts: string[], notes: string[], sources: ResearchSource[], confidence: "high" | "medium" | "low"): string {
  const snippets = abstracts.join("\n\n").replace(/\s+/g, " ").trim();
  const noteText = notes.length ? `Additional database context: ${notes.join("; ")}.` : "";
  return [
    snippets
      ? snippets.slice(0, 4200)
      : `${peptideName} currently has limited exact-name abstract text available through the queried public databases. The available source records should be used to confirm compound identity, chemistry, and literature relevance before publishing detailed mechanism-specific claims.`,
    "",
    `Mechanism, pathway, receptor, or assay information is included only when it appears in the retrieved scientific records or product metadata. If a target, receptor relationship, or pathway is not represented in the confirmed records, it should be treated as not confirmed rather than inferred from broad peptide-category language.`,
    noteText,
    `The cited sources below provide the evidence basis for this entry. The content is written for a neutral research-use catalog and intentionally avoids dosing, treatment, cure, or human-use claims.`,
    "",
    `Disclaimer: This product is not intended to diagnose, treat, cure, or prevent any disease. It is offered for research, laboratory, or analytical use only and is not for human or animal consumption.`,
  ].filter(Boolean).join("\n");
}

async function buildResearchDetails(input: {
  productId?: string | number;
  peptideName: string;
  synonyms?: string[];
  sequence?: string;
  molecularFormula?: string;
  molecularWeight?: string;
}, allowCache = true): Promise<ResearchDetailsResult> {
  const peptideName = normalizeResearchName(input.peptideName);
  if (!peptideName) throw new Error("peptideName is required");

  const cacheKey = makeResearchCacheKey(peptideName);
  if (allowCache) {
    const cached = await getCachedResearchDetails(cacheKey);
    if (cached?.description_block || cached?.research_block) return cached;
  }

  const synonyms = uniqueStrings(input.synonyms || []);
  const [pubChem, pubMed, europePmc, uniProt, chembl, rcsb] = await Promise.all([
    lookupPubChem(peptideName, synonyms),
    lookupPubMed(peptideName, synonyms),
    lookupEuropePmc(peptideName, synonyms),
    lookupUniProt(peptideName, synonyms),
    lookupChembl(peptideName, synonyms),
    lookupRcsb(peptideName, synonyms),
  ]);

  const notes = [
    ...(uniProt?.notes || []),
    ...(chembl?.notes || []),
    ...(rcsb?.notes || []),
  ];
  const abstracts = uniqueStrings([...(pubMed?.abstracts || []), ...(europePmc?.abstracts || [])]).slice(0, 8);
  const sources = ensureThreeSources([
    pubChem?.source,
    ...(pubMed?.sources || []),
    ...(europePmc?.sources || []),
    ...(uniProt?.sources || []),
    ...(chembl?.sources || []),
    ...(rcsb?.sources || []),
  ].filter(Boolean) as ResearchSource[], peptideName);

  const chem = buildChemicalMakeupBlock(peptideName, pubChem, {
    sequence: input.sequence,
    molecularFormula: input.molecularFormula,
    molecularWeight: input.molecularWeight,
  }, notes);

  const confidence: "high" | "medium" | "low" =
    !!pubChem && (pubMed?.sources?.length || europePmc?.sources?.length) ? "high" :
    (pubMed?.sources?.length || europePmc?.sources?.length || !!pubChem) ? "medium" :
    "low";

  const result: ResearchDetailsResult = {
    description_block: buildDescriptionBlock(peptideName, chem.text, abstracts, sources, confidence),
    chemical_makeup_block: chem.text,
    research_block: buildResearchBlock(peptideName, abstracts, notes, sources, confidence),
    sources,
    confidence,
    missing_fields: chem.missing,
    raw_source_json: {
      pubchem: pubChem?.raw,
      pubmed: pubMed?.raw,
      europepmc: europePmc?.raw,
      uniprot: uniProt?.raw,
      chembl: chembl?.raw,
      rcsb: rcsb?.raw,
    },
  };

  await saveCachedResearchDetails(cacheKey, input.productId ? Number(input.productId) : null, peptideName, result);
  return result;
}

function researchDetailsToLegacyResponse(details: ResearchDetailsResult) {
  return {
    overview: "",
    description: details.description_block,
    chemicalMakeup: details.chemical_makeup_block,
    researchContent: details.research_block,
    citations: details.sources.map((source, index) => ({
      title: source.title,
      authors: source.authors || "",
      journal: source.database || source.journal || "",
      year: source.year || "",
      url: source.url,
      summary: source.supports,
      citationNumber: index + 1,
    })),
    description_block: details.description_block,
    chemical_makeup_block: details.chemical_makeup_block,
    research_block: details.research_block,
    sources: details.sources,
    confidence: details.confidence,
    missing_fields: details.missing_fields,
  };
}


async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // Vial image endpoints - redirect to pre-generated HD images stored in S3
  app.get("/api/vial/hero.png", (req, res) => {
    res.redirect('/assets/rvr-hero-vials-new-transparent.png');
  });

  app.get("/api/vial/:slug.png", async (req, res) => {
    try {
      const { getProductBySlug } = await import("../db");
      const { generateVialSvgBuffer } = await import("../vialGenerator");
      const product = await getProductBySlug(req.params.slug);
      const queryName = typeof req.query.name === "string" ? req.query.name : "";
      const querySize = typeof req.query.size === "string" ? req.query.size : "";
      const productName = (queryName || product?.name || req.params.slug.replace(/-/g, " ")).trim();
      const productSize = (querySize || (product as any)?.size || "").trim();
      const displayName = productSize && !productName.toLowerCase().includes(productSize.toLowerCase())
        ? `${productName} ${productSize}`
        : productName;
      const buffer = await generateVialSvgBuffer(displayName);
      res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.send(buffer);
    } catch (err: any) {
      console.error('[Vial Generate Error]', err.message);
      res.status(500).send('Error');
    }
  });



  app.get("/api/product-assets/:name", async (req, res) => {
    try {
      const requestedName = path.basename(String(req.params.name || ""));
      if (!requestedName) {
        res.status(400).send("Missing asset name");
        return;
      }

      const databaseAsset = await readProductAssetFromDatabase(requestedName);
      if (databaseAsset) {
        res.setHeader("Content-Type", databaseAsset.contentType);
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.send(databaseAsset.data);
        return;
      }

      const localBuffer = readServedAsset(requestedName);
      const ext = path.extname(requestedName).toLowerCase();
      const contentType =
        ext === ".png" ? "image/png" :
        ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
        ext === ".webp" ? "image/webp" :
        ext === ".gif" ? "image/gif" :
        ext === ".svg" ? "image/svg+xml" :
        "application/octet-stream";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(localBuffer);
    } catch (err: any) {
      res.status(404).send("Product asset not found");
    }
  });


  app.get("/api/product-assets", async (req, res) => {
    try {
      const seen = new Set<string>();
      const assets = getProductAssetDirs()
        .flatMap((assetsDir) => fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [])
        .filter((file) => /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(file))
        .filter((file) => {
          if (seen.has(file)) return false;
          seen.add(file);
          return true;
        })
        .map((file) => ({ name: file, url: `/assets/${file}` }))
        .sort((a, b) => a.name.localeCompare(b.name));

      res.json(assets);
    } catch (err: any) {
      res.status(500).send(err?.message || "Unable to list assets");
    }
  });


  app.get("/api/nih-report", async (req, res) => {
    try {
      const name = String(req.query?.name || "").trim();
      if (!name) {
        res.status(400).send("Product name is required");
        return;
      }

      const searchUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi");
      searchUrl.searchParams.set("db", "pubmed");
      searchUrl.searchParams.set("retmode", "json");
      searchUrl.searchParams.set("retmax", "8");
      searchUrl.searchParams.set("sort", "relevance");
      searchUrl.searchParams.set("term", `${name} peptide OR ${name}`);

      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) throw new Error("NIH search failed");
      const searchJson: any = await searchResponse.json();
      const ids = searchJson?.esearchresult?.idlist || [];
      if (!ids.length) {
        res.status(404).send(`No NIH/PubMed report found for ${name}`);
        return;
      }

      const summaryUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi");
      summaryUrl.searchParams.set("db", "pubmed");
      summaryUrl.searchParams.set("retmode", "json");
      summaryUrl.searchParams.set("id", ids.join(","));

      const summaryResponse = await fetch(summaryUrl);
      if (!summaryResponse.ok) throw new Error("NIH summary failed");
      const summaryJson: any = await summaryResponse.json();

      const articles = ids
        .map((id: string) => summaryJson?.result?.[id])
        .filter(Boolean)
        .map((item: any, index: number) => {
          const authors = Array.isArray(item.authors) ? item.authors.map((author: any) => author.name).filter(Boolean).join(", ") : "";
          return [
            `${index + 1}. ${item.title || "Untitled NIH/PubMed record"}`,
            authors ? `Authors: ${authors}` : "",
            item.fulljournalname ? `Journal: ${item.fulljournalname}${item.pubdate ? ` (${item.pubdate})` : ""}` : "",
            `NIH/PubMed: https://pubmed.ncbi.nlm.nih.gov/${item.uid}/`,
          ].filter(Boolean).join("\n");
        });

      res.json({
        description: [
          `NIH/PubMed Research Report for ${name}`,
          "",
          "The following NIH-indexed PubMed records were found for this product name. Review for accuracy before publishing.",
          "",
          ...articles,
        ].join("\n\n"),
      });
    } catch (err: any) {
      console.error("[NIH Report Error]", err);
      res.status(500).send(err?.message || "Unable to pull NIH report");
    }
  });


  app.post("/api/get-research-details", async (req, res) => {
    try {
      const body = req.body || {};
      const peptideName = normalizeResearchName(body.peptideName || body.name || body.productName);
      if (!peptideName) {
        res.status(400).json({ error: "peptideName is required" });
        return;
      }

      const details = await buildResearchDetails({
        productId: body.productId || "",
        peptideName,
        synonyms: Array.isArray(body.synonyms) ? body.synonyms : [],
        sequence: String(body.sequence || ""),
        molecularFormula: String(body.molecularFormula || ""),
        molecularWeight: String(body.molecularWeight || ""),
      });

      res.json(details);
    } catch (err: any) {
      console.error("[Research Details API Error]", err);
      res.status(500).json({ error: err?.message || "Unable to get research details" });
    }
  });

  app.get("/api/product-research-details", async (req, res) => {
    try {
      const name = String(req.query?.name || "").trim();
      if (!name) {
        res.status(400).send("Product name is required");
        return;
      }

      const details = await buildResearchDetails({
        peptideName: name,
        synonyms: [],
        sequence: "",
        molecularFormula: "",
        molecularWeight: "",
      });
      res.json(researchDetailsToLegacyResponse(details));
    } catch (err: any) {
      console.error("[Research Details Error]", err);
      res.status(500).send(err?.message || "Unable to get research details");
    }
  });


  app.post("/api/product-image/upload", async (req, res) => {
    try {
      const makeSafeSlug = (value: string) => String(value || "product-image").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "product-image";
      const dataUrl = String(req.body?.dataUrl || "");
      const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) {
        res.status(400).send("Invalid image upload");
        return;
      }

      const mimeType = match[1].toLowerCase();
      const originalBuffer = Buffer.from(match[2], "base64");
      const baseSlug = makeSafeSlug(req.body?.slug || req.body?.filename);
      const requestedName = String(req.body?.filename || "").toLowerCase();

      if (mimeType === "image/svg+xml" || mimeType === "image/svg" || requestedName.endsWith(".svg")) {
        const svgText = originalBuffer.toString("utf8").trim();
        if (!/<svg[\s>]/i.test(svgText) || /<script[\s>]/i.test(svgText) || /on\w+\s*=/i.test(svgText)) {
          res.status(400).send("SVG uploads must be valid, safe SVG files. Please upload a PNG, JPG, WEBP, GIF, or a clean SVG.");
          return;
        }
        const filename = `${baseSlug}-${Date.now()}.svg`;
        const saved = await saveProductAsset(filename, svgText, "image/svg+xml");
        res.json(saved);
        return;
      }

      try {
        const { createCanvas, loadImage } = await import("@napi-rs/canvas");
        const image = await loadImage(originalBuffer);
        const canvas = createCanvas(image.width, image.height);
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        for (let index = 0; index < pixels.length; index += 4) {
          const red = pixels[index];
          const green = pixels[index + 1];
          const blue = pixels[index + 2];
          const alpha = pixels[index + 3];
          if (alpha > 0 && red > 238 && green > 238 && blue > 238 && Math.abs(red - green) < 12 && Math.abs(red - blue) < 12 && Math.abs(green - blue) < 12) {
            const whiteness = Math.min(red, green, blue);
            pixels[index + 3] = whiteness > 250 ? 0 : Math.max(0, Math.min(alpha, (255 - whiteness) * 12));
          }
        }

        context.putImageData(imageData, 0, 0);
        const processedBuffer = await canvas.encode("png");
        const filename = `${baseSlug}-${Date.now()}.png`;
        const saved = await saveProductAsset(filename, processedBuffer, "image/png");
        res.json(saved);
        return;
      } catch (imageError) {
        console.warn("[Product Image Upload] Transparent-background conversion failed; saving original image.", imageError);
        const extension =
          mimeType.includes("webp") ? "webp" :
          mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" :
          mimeType.includes("gif") ? "gif" :
          mimeType.includes("png") ? "png" : "bin";
        const filename = `${baseSlug}-${Date.now()}.${extension}`;
        const saved = await saveProductAsset(filename, originalBuffer, mimeType);
        res.json(saved);
      }
    } catch (err: any) {
      console.error("[Product Image Upload Error]", err);
      res.status(500).send(err?.message || "Unable to upload product image");
    }
  });


  app.post("/api/product-preview/link", async (req, res) => {
    try {
      const makeSafeSlug = (value: string) => String(value || "preview-product").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "preview-product";
      const type = String(req.body?.type || "vial");
      const slug = makeSafeSlug(req.body?.slug || req.body?.name);
      const name = String(req.body?.name || slug.replace(/-/g, " ")).trim();
      const size = String(req.body?.size || "").trim();
      const minAmount = String(req.body?.minAmount || "").trim();
      const displayName = size && !name.toLowerCase().includes(size.toLowerCase()) ? `${name} ${size}` : name;
      const formatGiftCardAmount = (value: string) => {
        const parsed = Number(String(value || "").replace(/[^0-9.]/g, ""));
        return Number.isFinite(parsed) && parsed > 0 ? `$${parsed.toLocaleString("en-US", { maximumFractionDigits: 2 })}+` : "";
      };
      const giftCardRange = formatGiftCardAmount(minAmount);

      let buffer: Buffer;
      let extension = "png";
      let contentType = "image/png";

      if (type === "cream") {
        buffer = readServedAsset("lotion-bottle-blank-hd-tube.png");
      } else if (type === "face-mask") {
        buffer = readServedAsset("face-mask-blank-hd.png");
      } else if (type === "gift-card") {
        const giftCardBuffer = readServedAsset("Gift-Card.png");
        if (giftCardRange) {
          try {
            const { createCanvas, loadImage } = await import("@napi-rs/canvas");
            const image = await loadImage(giftCardBuffer);
            const canvas = createCanvas(image.width, image.height);
            const context = canvas.getContext("2d");
            context.drawImage(image, 0, 0);
            const fontSize = Math.max(34, Math.round(image.width * 0.035));
            context.font = `700 ${fontSize}px Arial, sans-serif`;
            context.textAlign = "right";
            context.textBaseline = "top";
            context.shadowColor = "rgba(0,0,0,0.55)";
            context.shadowBlur = Math.round(fontSize * 0.16);
            context.shadowOffsetY = Math.max(1, Math.round(fontSize * 0.035));
            context.fillStyle = "#ffffff";
            context.textAlign = "left";
            context.fillText(giftCardRange, Math.round(image.width * 0.64), Math.round(image.height * 0.22));
            buffer = await canvas.encode("png");
          } catch (giftCardError) {
            console.warn("[Gift Card Preview] Amount-range rendering failed; saving base gift card image.", giftCardError);
            buffer = giftCardBuffer;
          }
        } else {
          buffer = giftCardBuffer;
        }
      } else {
        const { generateVialBuffer } = await import("../vialGenerator");
        buffer = await generateVialBuffer(displayName);
      }

      const amountSlug = type === "gift-card" && giftCardRange
        ? `-${makeSafeSlug(giftCardRange)}`
        : "";
      const filename = `${slug}-${type}${amountSlug}-preview.${extension}`;
      const saved = await saveProductAsset(filename, buffer, contentType);
      res.json({ url: saved.url, contentType });
    } catch (err: any) {
      console.error("[Product Preview Link Error]", err);
      res.status(500).send(err?.message || "Unable to link preview image");
    }
  });


  // PaymentCloud return + webhook endpoints
  app.all("/api/paymentcloud/return", async (req, res) => {
    try {
      const orderNumber = String(req.query.order || "");
      if (!orderNumber) {
        res.status(400).send("Missing order reference.");
        return;
      }

      const payload = { ...(req.query as Record<string, unknown>), ...(req.body as Record<string, unknown>) };
      const result = await handlePaymentReturn(payload, orderNumber);
      const status = result.success ? "success" : "failed";
      res.redirect(`/order/${encodeURIComponent(orderNumber)}?status=${status}`);
    } catch (err: any) {
      console.error("[PaymentCloud Return Error]", err.message);
      res.status(400).send(err.message || "Payment return failed");
    }
  });

  app.post("/api/paymentcloud/webhook", async (req, res) => {
    try {
      await handlePaymentWebhook(req.body as Record<string, unknown>);
      res.status(200).send("OK");
    } catch (err: any) {
      console.error("[PaymentCloud Webhook Error]", err.message);
      res.status(400).send(err.message || "Webhook failed");
    }
  });

  // Legacy NowPayments IPN webhook endpoint (deprecated)
  app.post("/api/nowpayments/ipn", async (req, res) => {
    try {
      const signature = req.headers["x-nowpayments-sig"] as string || "";
      const result = await handleIpnWebhook(req.body, signature);
      res.json(result);
    } catch (err: any) {
      console.error("[NowPayments IPN Error]", err.message);
      res.status(400).json({ error: err.message });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
