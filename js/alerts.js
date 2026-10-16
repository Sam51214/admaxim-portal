import { na } from "./utils.js";
// Add new rules here. Each pushes {lvl:"bad"|"warn", t:"message"}
export function buildAlerts({ laptops: L, monitors: M, tickets: T }, notes, extra = {}) {
  const a = [];
  const dup = (k) => { const m = {}; L.forEach((l) => !na(l[k]) && (m[l[k].toLowerCase()] ??= []).push(l.name || "stock")); return Object.entries(m).filter((e) => e[1].length > 1); };
  L.forEach((l) => {
    const who = l.name || "Unassigned laptop";
    if (/(late|mid|early)\s*(0\d|1[0-2])\b|20(0\d|1[0-2])\b/i.test(l.type + " " + l.model + " " + l.cpu)) a.push({ lvl: "bad", t: `${who}: very old device (${l.type || l.model}) — consider replacing` });
    if (/issue|problem|battery|faulty|repair|broken/i.test(l.cond)) a.push({ lvl: "bad", t: `${who}: ${l.cond}` });
    if (l.name && !l.serial) a.push({ lvl: "warn", t: `${who}: serial number missing` });
  });
  dup("serial").forEach(([s, n]) => a.push({ lvl: "warn", t: `Duplicate serial ${s.toUpperCase()} on: ${n.join(", ")}` }));
  dup("mac").forEach(([s, n]) => a.push({ lvl: "warn", t: `Duplicate MAC ${s} on: ${n.join(", ")}` }));
  M.forEach((m) => !m.make && a.push({ lvl: "warn", t: `Monitor ${m.model || ""}: make missing` }));
  const p = T.filter((t) => t.status == "Pending Approval").length; if (p) a.push({ lvl: "warn", t: `${p} helpdesk ticket(s) waiting for approval` });
  Object.entries(extra).forEach(([n, t]) => t.rows.forEach((r) => { const bad = t.cols.findIndex((h, i) => /status|state|result/i.test(h) && /fail|error|down|miss|stop|critical/i.test(r["c" + i])); if (bad >= 0) a.push({ lvl: "bad", t: `${n}: ${r.c0 || "row"} — ${r["c" + bad]}` }); }));
  notes.forEach((n) => a.push({ lvl: /replace|urgent|faulty|issue/i.test(n.text) ? "bad" : "warn", t: n.text }));
  return a;
}
