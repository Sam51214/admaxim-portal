export const $ = (s) => document.querySelector(s);
export const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const ne = (r) => r.filter((x) => x && x.trim()).length;
export const na = (v) => !v || /^n\/a$/i.test(v);
export const shared = (n) => !n || /^(it|cctv|inventory)$/i.test(n);
export function csv(t) {
  const r = []; let w = [], c = "", q = 0;
  for (let i = 0; i < t.length; i++) {
    const h = t[i];
    if (q) { if (h == '"') { if (t[i + 1] == '"') { c += '"'; i++; } else q = 0; } else c += h; }
    else if (h == '"') q = 1;
    else if (h == ",") { w.push(c); c = ""; }
    else if (h == "\n" || h == "\r") { if (h == "\r" && t[i + 1] == "\n") i++; w.push(c); r.push(w); w = []; c = ""; }
    else c += h;
  }
  if (c || w.length) { w.push(c); r.push(w); }
  return r;
}
// first non-empty value whose header contains any of the given words
export const pick = (o, ...k) => { for (const s of k) { const f = Object.keys(o).find((x) => x.includes(s)); if (f && o[f]) return o[f]; } return ""; };
