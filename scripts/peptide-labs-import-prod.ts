import { resolveProductionDatabaseUrl } from "./resolveProductionDatabaseUrl.ts";

try {
  process.env.DATABASE_URL = resolveProductionDatabaseUrl();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

await import("./peptide-labs-import.ts");
