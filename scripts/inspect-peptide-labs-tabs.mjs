async function extractTab(html, tabId) {
  const marker = `id="${tabId}"`;
  const start = html.indexOf(marker);
  if (start === -1) return null;
  const panelStart = html.indexOf(">", start) + 1;
  const nextPanel = html.indexOf('class="woocommerce-Tabs-panel', panelStart + 10);
  const end = nextPanel === -1 ? html.length : nextPanel;
  return html.slice(panelStart, end);
}

function htmlToText(html) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h1|h2|h3|h4|li)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

const url = process.argv[2] || "https://peptidelabs.us/cagrilintide/?attribute_strength=5%20mg";
const html = await fetch(url).then((r) => r.text());

for (const tabId of ["tab-description", "tab-pl_research", "tab-pl_storage", "tab-pl_molecular"]) {
  const panel = extractTab(html, tabId);
  console.log(`\n=== ${tabId} ===`);
  console.log(panel ? htmlToText(panel).slice(0, 500) : "NOT FOUND");
}
