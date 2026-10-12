import { CONFIG as C } from "./config.js";
import { csv, pick, ne } from "./utils.js";
import { call } from "./api.js";

// ---------- legacy read-only path (published CSV), used only when API_URL is empty ----------
const gviz = (k) => `https://docs.google.com/spreadsheets/d/${C.SHEET_ID}/gviz/tq?gid=${C.TABS[k]}&headers=0`;
async function viaFetch(u) { const r = await fetch(u); if (!r.ok) throw new Error("HTTP " + r.status); const t = await r.text(); if (/^\s*<(!doctype|html)/i.test(t)) throw new Error("private sheet"); return csv(t); }
async function legacyTab(k) { const errs = []; for (const f of [() => viaFetch(`${C.PUB}?gid=${C.TABS[k]}&single=true&output=csv`), () => viaFetch(gviz(k) + "&tqx=out:csv")]) { try { return await f(); } catch (e) { errs.push(e.message); } } throw new Error(errs.join(" | ")); }

// ---------- parsing ----------
function parse(rows) {
  const hi = rows.findIndex((r) => ne(r) >= 4); if (hi < 0) return { data: [], notes: [] };
  const H = rows[hi].map((x) => (x || "").trim().toLowerCase()), data = [], notes = [];
  rows.slice(hi + 1).forEach((r, idx) => {
    const n = ne(r); if (!n) return; const t = r.filter((x) => x && x.trim()).map((x) => x.trim());
    if (n == 1 || /^(genr?al note|remarks?)/i.test(t[0])) { notes.push({ text: t.length > 1 ? t.slice(1).join(" ") : t[0] }); return; }
    if (n < 3) return;
    const o = { _row: hi + 2 + idx }; H.forEach((h, i) => { if (h) o[h] = (r[i] || "").trim(); }); data.push(o);
  });
  return { data, notes };
}
function parseNet(rows) {
  const out = []; let d = null; const c = (r, i) => (r[i] || "").trim();
  rows.slice(2).forEach((r) => {
    if (!ne(r.slice(0, 11))) return;
    if (c(r, 0)) { d = { name: c(r, 0), wan: [], lan: [], user: c(r, 3), pass: c(r, 4), ssids: [], area: c(r, 7), mode: c(r, 8), status: c(r, 9), desc: c(r, 10) }; out.push(d); }
    if (!d) return;
    if (!c(r, 0)) { if (c(r, 3)) d.user ||= c(r, 3); if (c(r, 4)) d.pass ||= c(r, 4); if (c(r, 7)) d.area ||= c(r, 7); if (c(r, 10)) d.desc ||= c(r, 10); }
    c(r, 1) && d.wan.push(c(r, 1)); c(r, 2) && d.lan.push(c(r, 2));
    if (c(r, 5) || c(r, 6)) { const a = c(r, 5).split(","), b = c(r, 6).split(","); a.forEach((s, i) => d.ssids.push({ ssid: s.trim(), pass: (b.length == a.length ? b[i] : c(r, 6)).trim() })); }
  });
  return out;
}
// One mapper per tab. To show a new column: add a field here.
const MAP = {
  laptops: (o) => ({ _row: o._row, sr: pick(o, "sr"), name: pick(o, "name"), dept: pick(o, "dept"), type: pick(o, "dev type", "type"), make: pick(o, "make"), model: pick(o, "model"), cpu: pick(o, "cpu"), ram: pick(o, "ram"), disk: pick(o, "hdd", "ssd"), serial: pick(o, "serial"), mac: pick(o, "mac"), cond: pick(o, "condition"), date: pick(o, "issue") }),
  monitors: (o) => ({ _row: o._row, name: pick(o, "name"), dept: pick(o, "dept"), make: pick(o, "make"), model: pick(o, "model"), size: pick(o, "size"), status: pick(o, "status") }),
  tickets: (o) => ({ _row: o._row, id: pick(o, "ticket"), date: pick(o, "date"), from: pick(o, "from"), subject: pick(o, "subject"), link: pick(o, "link"), status: pick(o, "status") || "New", assignee: pick(o, "assigned"), notes: pick(o, "notes") }),
};
function build(raw) {
  const data = {}, notes = [];
  for (const k of Object.keys(C.TABS)) {
    const rows = raw[k] || [];
    if (k == "network") data.network = parseNet(rows);
    else { const p = parse(rows); data[k] = p.data.map(MAP[k]); if (k != "tickets") notes.push(...p.notes); }
  }
  return { data, notes };
}
export async function loadAll() {
  if (C.API_URL) { const j = await call("read"); return { ...build(j.tabs), errors: {}, users: j.users, logs: j.logs || [] }; }
  const raw = {}, errors = {};
  await Promise.all(Object.keys(C.TABS).map(async (k) => { try { raw[k] = await legacyTab(k); } catch (e) { errors[k] = e.message; } }));
  return { ...build(raw), errors, users: [], logs: [] };
}
