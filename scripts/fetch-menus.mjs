// Saves the Knox College café menus as small JSON files the app reads.
// Runs nightly on GitHub Actions (see .github/workflows/site.yml). Node 20+, no packages needed.
//
//   node scripts/fetch-menus.mjs          today + the next 3 days of Hard Knox, plus Gizmo
//
// Output: menus/hard-knox-YYYY-MM-DD.json and menus/gizmo.json
// Each file: { date, cafe, source, fetchedAt, format, dayparts: [{ l, s, e, i: ["id|name|station|serving|kcal|protein|carbs|fat", ...] }] }

import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "menus");
const BASE = "https://knox-college.cafebonappetit.com/cafe";
const DAYS_AHEAD = 3;
const KEEP_DAYS = 14;
const UA = "CutTracker menu sync (personal student project; once nightly)";

/** Today's date in Galesburg, as YYYY-MM-DD. */
function chicagoDate(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 864e5);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Reads the JSON object literal that starts at `from` (a "{"), respecting strings. */
function readObject(text, from) {
  let depth = 0, inStr = false, esc = false;
  for (let k = from; k < text.length; k++) {
    const ch = text[k];
    if (inStr) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return JSON.parse(text.slice(from, k + 1));
  }
  throw new Error("Unclosed object in page");
}

/** Pulls Bamco.menu_items and every Bamco.dayparts['N'] out of a café page. Exported for testing. */
export function parseCafeHtml(html) {
  const mAt = html.search(/Bamco\.menu_items\s*=\s*\{/);
  if (mAt < 0) return [];
  const items = readObject(html, html.indexOf("{", mAt));
  const dayparts = [];
  const re = /Bamco\.dayparts\['[^']+'\]\s*=\s*\{/g;
  let m;
  while ((m = re.exec(html))) dayparts.push(readObject(html, m.index + m[0].length - 1));

  const num = v => { const n = parseFloat(v); return isFinite(n) ? Math.round(n * 10) / 10 : ""; };
  const clean = s => String(s || "").replace(/<[^>]+>/g, "").replace(/^@/, "").replace(/\|/g, "/").replace(/&amp;/g, "&").replace(/;$/, "").trim();

  return dayparts.map(dp => {
    const seen = new Set();
    const i = (dp.stations || []).flatMap(st => (st.items || []).map(id => {
      const it = items[id]; if (!it) return null;
      const nd = it.nutrition_details || {};
      const k = num(nd.calories?.value ?? it.nutrition?.kcal);
      if (k === "" || k === 0) return null;
      const key = (it.label || "").toLowerCase() + "|" + k;
      if (seen.has(key)) return null; seen.add(key);
      const sv = nd.servingSize && nd.servingSize.value ? `${nd.servingSize.value} ${nd.servingSize.unit || ""}`.trim() : "";
      return [id, clean(it.label), clean(st.label), sv, k, num(nd.proteinContent?.value), num(nd.carbohydrateContent?.value), num(nd.fatContent?.value)].join("|");
    }).filter(Boolean));
    return { l: dp.label, s: dp.starttime, e: dp.endtime, i };
  }).filter(d => d.i.length);
}

async function fetchCafe(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html" } });
  if (!r.ok) throw new Error(`${url} answered ${r.status}`);
  return parseCafeHtml(await r.text());
}

async function save(name, doc) {
  await writeFile(path.join(OUT, name), JSON.stringify(doc) + "\n");
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const log = [];
  let failures = 0;

  for (let d = 0; d <= DAYS_AHEAD; d++) {
    const date = chicagoDate(d), url = `${BASE}/the-hard-knox-cafe/${date}/`;
    try {
      const dayparts = await fetchCafe(url);
      if (!dayparts.length) { log.push(`${date}: no menu posted yet`); continue; }
      await save(`hard-knox-${date}.json`, { date, cafe: "The Hard Knox Café", source: url, fetchedAt: new Date().toISOString(), format: "id|name|station|serving|kcal|protein|carbs|fat", dayparts });
      log.push(`${date}: ${dayparts.map(p => `${p.l} ${p.i.length}`).join(", ")}`);
    } catch (e) { failures++; log.push(`${date}: FAILED ${e.message}`); }
  }

  try {
    const url = `${BASE}/gizmo/`, dayparts = await fetchCafe(url);
    if (dayparts.length) {
      await save("gizmo.json", { date: chicagoDate(0), cafe: "Gizmo", source: url, fetchedAt: new Date().toISOString(), format: "id|name|station|serving|kcal|protein|carbs|fat", dayparts });
      log.push(`gizmo: ${dayparts.reduce((n, p) => n + p.i.length, 0)} items`);
    } else log.push("gizmo: no items found, kept the old file");
  } catch (e) { failures++; log.push(`gizmo: FAILED ${e.message}`); }

  // Drop Hard Knox files older than KEEP_DAYS so the site stays small.
  const cutoff = chicagoDate(-KEEP_DAYS);
  for (const f of await readdir(OUT)) {
    const m = /^hard-knox-(\d{4}-\d\d-\d\d)\.json$/.exec(f);
    if (m && m[1] < cutoff) { await rm(path.join(OUT, f)); log.push(`removed ${f}`); }
  }

  console.log(log.join("\n"));
  // Fail the run (GitHub then emails you) only if nothing at all could be read.
  if (failures === DAYS_AHEAD + 2) process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
