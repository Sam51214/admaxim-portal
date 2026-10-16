import { CONFIG as C } from "./config.js";
import { $, esc } from "./utils.js";
import { loadAll } from "./data.js";
import { buildAlerts } from "./alerts.js";
import { state } from "./ui.js";
import { session, can, call, login, saved, forget } from "./api.js";
import { toast } from "./toast.js";
import { openForm } from "./modal.js";
import { FORMS, toSheet } from "./forms.js";
import { makeExtra } from "./views/extra.js"; import { openPalette } from "./palette.js";
import overview from "./views/overview.js"; import tickets, { openTicket, newTicket } from "./views/tickets.js"; import people from "./views/people.js";
import laptops from "./views/laptops.js"; import monitors from "./views/monitors.js"; import network from "./views/network.js"; import activity from "./views/activity.js"; import alerts from "./views/alerts.js";

// To add a page: create js/views/<name>.js and add it to this list (see README).
const BASE = [overview, tickets, people, laptops, monitors, network], TAIL = [alerts, activity];
let VIEWS = [...BASE, ...TAIL], extraSig = "";
const syncViews = () => (VIEWS = [...BASE, ...Object.keys(state.extra).map(makeExtra), ...TAIL]);
const go = (id, q = "") => { current = id; location.hash = id; state.q = q; $("#q").value = q; state.sortK = null; render(); };
let current = location.hash.slice(1) || "overview", timer = null;
const view = () => VIEWS.find((x) => x.id == current && can(x.min || "viewer")) || overview;

function render() {
  const v = view(); state.cur = null; $("#title").textContent = v.title; document.title = v.title + " · " + C.BRAND;
  $("#view").innerHTML = v.render(); v.after?.();
  $("#addbtn").hidden = !(v.add && can("admin")); $("#addbtn").textContent = v.add ? "+ Add " + FORMS[v.add].title.toLowerCase() : "";
  document.querySelectorAll("#nav button").forEach((b) => b.classList.toggle("on", b.dataset.v == v.id));
  document.querySelectorAll("#nav .n").forEach((n) => n.remove());
  const badge = (id, n) => n && $(`#nav [data-v=${id}]`)?.insertAdjacentHTML("beforeend", `<span class="n">${n}</span>`);
  badge("alerts", state.alerts.length); badge("tickets", state.data.tickets.filter((t) => !/resolved|rejected/i.test(t.status)).length);
}
async function refresh() {
  try {
    const r = await loadAll(); Object.assign(state, { data: r.data, users: r.users, logs: r.logs, notes: r.notes, extra: r.extra }); state.alerts = buildAlerts(r.data, r.notes, r.extra);
    const sig = Object.keys(r.extra).join("|"); if (sig != extraSig) { extraSig = sig; syncViews(); shell(); }
    const bad = Object.entries(r.errors);
    $("#msg").innerHTML = bad.length ? `<b style="color:var(--bad)">Could not read: ${bad.map((e) => e[0]).join(", ")}</b> — ${bad.map((e) => esc(e[1])).join("; ")}` : (C.API_URL ? `Live · updated ${new Date().toLocaleTimeString()}` : `<b style="color:var(--bad)">Read-only demo mode — set API_URL in js/config.js to enable editing.</b>`);
    if (!document.querySelector(".drawer-wrap,.overlay")) render(); else { document.querySelectorAll("#nav .n").forEach((n) => n.remove()); }
  } catch (e) { if (/Wrong name|Too many/.test(e.message)) return showLogin(e.message); $("#msg").innerHTML = `<b style="color:var(--bad)">${esc(e.message)}</b>`; }
}
function shell() {
  $("#brand").innerHTML = `<img src="${C.LOGO}" alt="${C.BRAND}"><small>IT Asset & Helpdesk</small>`;
  $("#nav").innerHTML = VIEWS.filter((v) => can(v.min || "viewer")).map((v) => `<button data-v="${v.id}"><svg viewBox="0 0 24 24"><path d="${v.icon}"/></svg>${v.title}</button>`).join("");
  $("#foot").innerHTML = C.API_URL ? `<div class="me"><span class="av sm">${esc(session.user[0] || "?")}</span><div><b>${esc(session.user)}</b><small>${session.role}</small></div><button class="btn sm" id="out">Sign out</button></div>` : "Read-only demo mode";
}
function start() { document.body.classList.remove("locked"); shell(); refresh(); clearInterval(timer); timer = setInterval(refresh, C.REFRESH_SEC * 1000); }
function showLogin(err = "") {
  clearInterval(timer); document.body.classList.add("locked"); document.querySelector(".login")?.remove();
  const d = document.createElement("div"); d.className = "login";
  d.innerHTML = `<form class="lbox"><img src="${C.LOGO}" alt=""><h2>${C.BRAND} Portal</h2><p class="sub">Sign in with the name and PIN given by IT.</p><input name="u" placeholder="Name" autocomplete="username" required><input name="p" type="password" placeholder="PIN" autocomplete="current-password" required><p class="err">${esc(err)}</p><button class="btn pri">Sign in</button></form>`;
  document.body.appendChild(d);
  d.querySelector("form").onsubmit = async (e) => { e.preventDefault(); const f = new FormData(e.target); const b = e.target.querySelector("button"); b.disabled = true;
    try { await login(f.get("u").trim(), f.get("p")); d.remove(); start(); } catch (er) { d.querySelector(".err").textContent = er.message; b.disabled = false; } };
}
// ---- events
$("#nav").onclick = (e) => { const b = e.target.closest("button"); if (b) { current = b.dataset.v; location.hash = current; state.sortK = null; render(); } };
$("#q").oninput = (e) => { state.q = e.target.value.toLowerCase(); render(); };
$("#foot").onclick = (e) => { if (e.target.id == "out") { forget(); location.reload(); } };
$("#addbtn").onclick = async () => {
  const tab = view().add, F = FORMS[tab], v = await openForm({ title: "Add " + F.title.toLowerCase(), fields: F.fields, submit: "Add" }); if (!v) return;
  try { const r = await call("addRow", { tab, fields: toSheet(tab, v) }); toast("Added" + (r.skipped?.length ? " (ignored: " + r.skipped.join(", ") + ")" : "")); refresh(); } catch (er) { toast(er.message, true); }
};
$("#view").onclick = async (e) => {
  const th = e.target.closest("th"), chip = e.target.closest(".chip"), tk = e.target.closest("[data-ticket]"), tr = e.target.closest("tr[data-row]");
  if (e.target.closest("a")) return;
  if (th) { state.dir = state.sortK == th.dataset.k ? -state.dir : 1; state.sortK = th.dataset.k; render(); }
  else if (chip?.dataset.tv) { state.ticketView = chip.dataset.tv; render(); }
  else if (chip?.dataset.s) { state.filters.status = chip.dataset.s; render(); }
  else if (e.target.id == "newt") newTicket();
  else if (e.target.classList.contains("rv")) { const s = e.target.previousElementSibling; const hid = s.textContent.startsWith("•"); s.textContent = hid ? s.dataset.p : "••••••••"; e.target.textContent = hid ? "Hide" : "Show"; }
  else if (e.target.closest("[data-go]")) go(e.target.closest("[data-go]").dataset.go);
  else if (tk) openTicket(tk.dataset.ticket);
  else if (tr) {
    const tab = tr.dataset.tab, F = FORMS[tab], item = state.data[tab].find((x) => x._row == tr.dataset.row); if (!item) return;
    const v = await openForm({ title: "Edit " + F.title.toLowerCase(), fields: F.fields, values: item }); if (!v) return;
    try { await call("updateRow", { tab, row: item._row, fields: toSheet(tab, v) }); toast("Saved"); refresh(); } catch (er) { toast(er.message, true); }
  }
};
$("#view").onchange = (e) => { const f = e.target.dataset.f; if (f) { state.filters[f] = e.target.value; render(); } };
document.addEventListener("keydown", (e) => { const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName); if (((e.ctrlKey || e.metaKey) && e.key == "k") || (e.key == "/" && !typing)) { e.preventDefault(); openPalette({ go, ticket: openTicket }); } });
$("#exp").onclick = () => {
  const c = state.cur; if (!c) return toast("Open a table page first (Laptops, Monitors, Helpdesk list).", true);
  const t = [c.cols.map((x) => x[1]), ...c.l.map((r) => c.cols.map((x) => r[x[0]] ?? ""))].map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([t], { type: "text/csv" })); a.download = c.name + ".csv"; a.click();
};
document.addEventListener("amx:refresh", refresh); document.addEventListener("amx:render", render);
// ---- boot
(async () => {
  if (!C.API_URL) return start();
  const s = saved(); if (!s) return showLogin();
  try { await login(s.u, s.p); start(); } catch (e) { showLogin(); }
})();
