import { execSync } from "node:child_process";

function readRailwayMysqlPublicUrl(): string | null {
  try {
    const output = execSync("railway variables --service MySQL --kv", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const line = output
      .split(/\r?\n/)
      .find((entry) => entry.startsWith("MYSQL_PUBLIC_URL="));
    if (!line) return null;
    return line.slice("MYSQL_PUBLIC_URL=".length).trim() || null;
  } catch {
    return null;
  }
}

export function resolveProductionDatabaseUrl(): string {
  const explicitPublic =
    process.env.MYSQL_PUBLIC_URL?.trim() ||
    process.env.DATABASE_PUBLIC_URL?.trim();

  if (explicitPublic) return explicitPublic;

  const current = process.env.DATABASE_URL?.trim();
  if (current && !current.includes("railway.internal")) {
    return current;
  }

  const fromRailway = readRailwayMysqlPublicUrl();
  if (fromRailway) return fromRailway;

  throw new Error(
    [
      "Could not connect to production MySQL from your computer.",
      "",
      "Railway's app DATABASE_URL uses mysql.railway.internal, which only works inside Railway.",
      "",
      "Fix options:",
      "  1. Run: npm run peptide-labs:import:prod -- --apply",
      "  2. Or set MYSQL_PUBLIC_URL from Railway → MySQL → Variables",
      "  3. Or run: railway login && railway link",
    ].join("\n")
  );
}
