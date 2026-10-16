import { CONFIG as C } from "../config.js"; import { state, table, stTag, slug, initial, match } from "../ui.js"; import { esc, ts } from "../utils.js";
import { call, can, session } from "../api.js"; import { toast, refresh } from "../toast.js"; import { openForm } from "../modal.js";

const newest = (a, b) => ts(b.date) - ts(a.date) || b._row - a._row;
const fmt = (d) => { const t = ts(d); return t ? new Date(t).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : esc(d); };
const age = (d) => { const t = ts(d); if (!t) return esc(d); const h = (Date.now() - t) / 36e5; return h < 1 ? "just now" : h < 24 ? Math.floor(h) + "h ago" : h < 24 * 30 ? Math.floor(h / 24) + "d ago" : new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }); };
const who = (f) => String(f).replace(/<.*>/, "").replace(/"/g, "").trim() || f;
const urgent = (t) => t.pri == "High";
const catTag = (t) => (t.cat ? `<span class="tag cat">${esc(t.cat)}</span>` : "");
const inRange = (t, r) => !r || r == "All" || ts(t.date) >= Date.now() - Number(r) * 864e5;
const card = (t) => `<div class="kc ${urgent(t) ? "urgent" : ""}" data-ticket="${esc(t.id)}" ${can("editor") ? 'draggable="true"' : ""}>
  <div class="kt">${catTag(t)}${urgent(t) ? '<span class="tag st-rejected">Urgent</span>' : ""}</div><b>${esc(t.subject)}</b>${t.preview ? `<p class="pvw">${esc(t.preview)}</p>` : ""}
  <div class="kf"><span class="sub">${esc(who(t.from))} · ${age(t.date)}</span>${t.assignee ? `<span class="av sm" title="${esc(t.assignee)}">${initial(t.assignee)}</span>` : ""}</div></div>`;

export async function setStatus(id, status) {
  const t = state.data.tickets.find((x) => x.id == id); if (!t || t.status == status) return;
  const old = t.status; t.status = status; document.dispatchEvent(new Event("amx:render"));
  try { await call("updateTicket", { id, status }); toast(`Moved to ${status}`); } catch (e) { t.status = old; toast(e.message, true); document.dispatchEvent(new Event("amx:render")); }
  refresh();
}
export async function newTicket() {
  const v = await openForm({ title: "New ticket", submit: "Create", fields: [{ k: "subject", label: "Issue / request" }, { k: "from", label: "Requested by" }, { k: "assignee", label: "Assign to", options: ["", ...state.users] }] });
  if (!v || !v.subject.trim()) return;
  try { await call("addTicket", v); toast("Ticket created"); refresh(); } catch (e) { toast(e.message, true); }
}
export function openTicket(id) {
  const t = state.data.tickets.find((x) => x.id == id); if (!t) return;
  document.querySelector(".drawer-wrap")?.remove();
  const ed = can("editor"), people = [...new Set(["", t.assignee, ...state.users])];
  const lines = String(t.notes || "").split("\n").filter(Boolean).map((l) => { const m = l.match(/^\[(.+?)\]\s*(.*)$/); return m ? { m: m[1], t: m[2] } : { m: "", t: l }; }).reverse();
  const why = !C.API_URL ? "Read-only demo mode: the portal is not connected to the API (js/config.js → API_URL)." : `You are signed in as “${esc(session.user)}” with role “${session.role}”. Ask IT to give you the “editor” role in the Users tab to change tickets.`;
  const d = document.createElement("div"); d.className = "drawer-wrap";
  d.innerHTML = `<aside class="drawer"><button class="x" aria-label="Close">✕</button><div class="dtags">${stTag(t.status)}${catTag(t)}${urgent(t) ? '<span class="tag st-rejected">Urgent</span>' : ""}</div>
  <h3>${esc(t.subject)}</h3><p class="sub">From <b>${esc(t.from)}</b><br>${fmt(t.date)} · ${age(t.date)}</p>${t.link ? `<a href="${esc(t.link)}" target="_blank" rel="noopener">Open original mail ↗</a>` : ""}
  ${ed ? "" : `<div class="ro">👁 ${why}</div>`}
  <h4>What the mail says</h4><div class="pv">${t.preview ? esc(t.preview) : '<span class="sub">No preview saved for this ticket yet (older tickets: run backfillPreviews in Apps Script).</span>'}</div>
  <h4>Status</h4><div class="seg">${C.STATUSES.map((s) => `<button class="chip ${s == t.status ? "on " + slug(s) : ""}" data-set="${s}" ${ed ? "" : "disabled"}>${s}</button>`).join("")}</div>
  <h4>Assigned to</h4><select id="asg" ${ed ? "" : "disabled"}>${people.map((u) => `<option value="${esc(u)}" ${u == t.assignee ? "selected" : ""}>${esc(u) || "— nobody —"}</option>`).join("")}</select>
  <h4>Team notes <small class="sub">(everyone can see these)</small></h4>${ed ? '<textarea id="nt" rows="3" placeholder="Write an update for the team…"></textarea><button class="btn pri" id="addnote">Add note</button>' : ""}
  <div class="tl">${lines.map((l) => `<div class="tli"><span class="sub">${esc(l.m)}</span><p>${esc(l.t)}</p></div>`).join("") || '<p class="sub">No notes yet.</p>'}</div></aside>`;
  document.body.appendChild(d); requestAnimationFrame(() => d.classList.add("open"));
  const close = () => { d.classList.remove("open"); setTimeout(() => d.remove(), 250); };
  d.onclick = async (e) => {
    if (e.target == d || e.target.closest(".x")) return close();
    const s = e.target.closest("[data-set]"); if (s && ed) { close(); await setStatus(t.id, s.dataset.set); openTicket(t.id); return; }
    if (e.target.id == "addnote") { const text = d.querySelector("#nt").value.trim(); if (!text) return; try { await call("addNote", { id: t.id, text }); toast("Note added"); close(); await refresh(); setTimeout(() => openTicket(t.id), 1200); } catch (er) { toast(er.message, true); } }
  };
  d.querySelector("#asg").onchange = async (e) => { try { await call("updateTicket", { id: t.id, assignee: e.target.value }); t.assignee = e.target.value; toast("Assigned"); refresh(); } catch (er) { toast(er.message, true); } };
}
const sel = (f, label, opts, cur) => `<label class="fsel">${label}<select data-f="${f}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(v) == String(cur) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></label>`;
export default { id: "tickets", title: "Helpdesk", icon: "M4 6h16v12H4zM4 7l8 6 8-6",
  render() {
    const F = state.filters, v = state.ticketView, f = F.status || "All", cats = ["All", ...new Set(state.data.tickets.map((t) => t.cat).filter(Boolean))];
    const T = state.data.tickets.filter((t) => match(t) && inRange(t, F.range) && (!F.cat || F.cat == "All" || t.cat == F.cat)).sort(newest);
    const bar = `<div class="bar2"><div class="seg"><button class="chip ${v == "board" ? "on" : ""}" data-tv="board">Board</button><button class="chip ${v == "list" ? "on" : ""}" data-tv="list">List</button></div>
      <div class="filters">${sel("range", "Period", [["All", "All time"], ["7", "Last 7 days"], ["30", "Last 30 days"], ["90", "Last 90 days"]], F.range || "All")}${sel("cat", "Category", cats.map((c) => [c, c]), F.cat || "All")}${can("editor") ? '<button class="btn pri" id="newt">+ New ticket</button>' : ""}</div></div>`;
    if (v == "board") return bar + `<div class="board">${C.STATUSES.map((s) => { const L = T.filter((t) => t.status == s); return `<div class="col" data-s="${s}"><div class="ch ${slug(s)}"><b>${s}</b><span>${L.length}</span></div>${L.slice(0, 25).map(card).join("") || '<p class="sub empty">Drop here</p>'}${L.length > 25 ? `<p class="sub empty">+${L.length - 25} older — use List view or Period filter</p>` : ""}</div>`; }).join("")}</div>`;
    const chips = ["All", ...C.STATUSES].map((s) => `<button class="chip ${s == f ? "on" : ""}" data-s="${s}">${s} (${s == "All" ? T.length : T.filter((t) => t.status == s).length})</button>`).join("");
    return bar + `<div class="chips">${chips}</div>` + table([["date", "Date", (r) => `<span title="${fmt(r.date)}">${age(r.date)}</span>`], ["from", "From", (r) => esc(who(r.from))], ["subject", "Issue", (r) => `<b class="subj">${esc(r.subject)}</b>${r.preview ? `<span class="sub clip">${esc(r.preview)}</span>` : ""}`], ["cat", "Category", (r) => catTag(r) || "—"], ["pri", "Priority", (r) => (urgent(r) ? '<span class="tag st-rejected">Urgent</span>' : '<span class="sub">Normal</span>')], ["status", "Status", (r) => stTag(r.status)], ["assignee", "Assigned"], ["id", "Mail", (r) => (r.link ? `<a href="${esc(r.link)}" target="_blank" rel="noopener">Open ↗</a>` : "—")]], f == "All" ? T : T.filter((t) => t.status == f), "tickets", { ticket: true, newest: true });
  },
  after() {
    document.querySelectorAll(".kc[draggable]").forEach((c) => c.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", c.dataset.ticket); c.classList.add("drag"); }));
    document.querySelectorAll(".col").forEach((col) => {
      col.addEventListener("dragover", (e) => { e.preventDefault(); col.classList.add("over"); });
      col.addEventListener("dragleave", () => col.classList.remove("over"));
      col.addEventListener("drop", (e) => { e.preventDefault(); col.classList.remove("over"); setStatus(e.dataTransfer.getData("text/plain"), col.dataset.s); });
    });
  } };
