import { esc, ts } from "./utils.js";
import { can } from "./api.js";
export const state = { data: { laptops: [], monitors: [], network: [], tickets: [] }, users: [], logs: [], extra: {}, notes: [], alerts: [], q: "", sortK: null, dir: 1, cur: null, filters: {}, ticketView: "board" };
export const match = (o) => !state.q || JSON.stringify(o).toLowerCase().includes(state.q);
export const mono = (k) => (r) => (r[k] ? `<span class="mono">${esc(r[k])}</span>` : "—");
export const secret = (v) => (v ? `<span class="mono pw" data-p="${esc(v)}">••••••••</span> <button class="btn sm rv">Show</button>` : can("admin") ? "—" : '<span class="sub">🔒 admin only</span>');
export const slug = (s) => "st-" + String(s).toLowerCase().replace(/[^a-z]+/g, "");
export const stTag = (s) => `<span class="tag ${slug(s)}">${esc(s)}</span>`;
export const initial = (n) => esc((n || "?").trim()[0]?.toUpperCase() || "?");
// sortable table. opts.edit = rows are clickable for editing
export function table(cols, list, name, opts = {}) {
  let l = list.filter(match);
  if (state.sortK) l = [...l].sort((a, b) => (state.sortK == "date" ? ts(a.date) - ts(b.date) : String(a[state.sortK] || "").localeCompare(String(b[state.sortK] || ""), 0, { numeric: 1 })) * state.dir);
  else if (opts.newest) l = [...l].sort((a, b) => ts(b.date) - ts(a.date) || b._row - a._row);
  state.cur = { cols, l, name };
  const attr = (r) => (opts.edit ? ` class="click" data-tab="${name}" data-row="${r._row}"` : opts.ticket ? ` class="click" data-ticket="${esc(r.id)}"` : "");
  return `<div class="wrap"><table><thead><tr>${cols.map((c) => `<th data-k="${c[0]}">${c[1]}${state.sortK == c[0] ? (state.dir > 0 ? " ▲" : " ▼") : ""}</th>`).join("")}</tr></thead><tbody>${l.map((r) => `<tr${attr(r)}>${cols.map((c) => `<td>${c[2] ? c[2](r) : esc(r[c[0]]) || "—"}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="12">No results.</td></tr>`}</tbody></table></div>`;
}

// colours a free-text status automatically (Backups: Success / Failed ...)
export const autoTag = (v) => `<span class="tag ${/fail|error|down|miss|stop|critical|expired/i.test(v) ? "st-rejected" : /ok|success|active|done|up\b|running|good|complete|online/i.test(v) ? "st-resolved" : /warn|pending|partial|delay|wait/i.test(v) ? "st-pendingapproval" : "st-new"}">${esc(v)}</span>`;
