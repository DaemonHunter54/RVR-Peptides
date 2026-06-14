import fs from "fs";

const url = process.argv[2] || "https://peptidelabs.us/kisspeptin/?attribute_strength=10%20mg";
const html = await fetch(url).then((r) => r.text());
fs.writeFileSync("tmp-kiss.html", html);
console.log("length", html.length);
console.log("tab-description tabpanel", html.includes('id="tab-description" role="tabpanel"'));
console.log("woocommerce desc panel", html.match(/woocommerce-Tabs-panel--description/g)?.length);
