import { state, table, secret, autoTag } from "../ui.js"; import { esc } from "../utils.js";
const SECRET = /pass|pwd|secret|token|key/i, STATUS = /status|state|result/i, cache = {};
// Builds a page for any extra sheet tab (Wifi, Backups, ...) automatically.
export function makeExtra(name) {
  return cache[name] ??= { id: "x-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), title: name, extra: true, icon: "M4 6h16M4 12h16M4 18h16",
    render() {
      const t = state.extra[name]; if (!t || !t.rows.length) return '<div class="card"><p class="sub">This tab has no rows yet. Add data in the Google Sheet.</p></div>';
      const cols = t.cols.map((h, i) => ["c" + i, h || "—", SECRET.test(h) ? (r) => secret(r["c" + i]) : STATUS.test(h) ? (r) => (r["c" + i] ? autoTag(r["c" + i]) : "—") : null]);
      return `<p class="sub">${t.rows.length} rows · edit them in the Google Sheet, this page updates automatically.</p>` + table(cols, t.rows, "x_" + name) + t.notes.map((n) => `<div class="alert">${esc(n)}</div>`).join("");
    } };
}
