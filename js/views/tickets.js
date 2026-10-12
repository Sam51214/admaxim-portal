import { CONFIG as C } from "../config.js"; import { state, table, stTag, slug, initial, match } from "../ui.js"; import { esc } from "../utils.js"; import { call, can } from "../api.js"; import { toast, refresh } from "../toast.js"; import { openForm } from "../modal.js";

const age = (d) => { const t = Date.parse(String(d).replace(" ", "T")); if (isNaN(t)) return esc(d); const h = (Date.now() - t) / 36e5; return h < 1 ? "just now" : h < 24 ? Math.floor(h) + "h ago" : Math.floor(h / 24) + "d ago"; };
const who = (f) => String(f).replace(/<.*>/, "").replace(/"/g, "").trim() || f;
const card = (t) => `<div class="kc" data-ticket="${esc(t.id)}" ${can("editor") ? 'draggable="true"' : ""}><b>${esc(t.subject)}</b><span class="sub">${esc(who(t.from))}</span><div class="kf"><span class="sub">${age(t.date)}</span>${t.assignee ? `<span class="av sm" title="${esc(t.assignee)}">${initial(t.assignee)}</span>` : '<span class="sub">unassigned</span>'}</div></div>`;

export async function setStatus(id, status) {
  const t = state.data.tickets.find((x) => x.id == id); if (!t || t.status == status) return;
  const old = t.status; t.status = status; document.dispatchEvent(new Event("amx:render"));
  try { await call("updateTicket", { id, status }); toast(`Moved to ${status}`); } catch (e) { t.status = old; toast(e.message, true); }
  refresh();
}
export async function newTicket() {
  const v = await openForm({ title: "New ticket", submit: "Create", fields: [{ k: "subject", label: "Issue / request" }, { k: "from", label: "Requested by" }, { k: "assignee", label: "Assign to", options: ["", ...state.users] }] });
  if (!v || !v.subject.trim()) return;
  try { await call("addTicket", v); toast("Ticket created"); refresh(); } catch (e) { toast(e.message, true); }
}
export function openTicket(id) {
  const t = state.data.tickets.find((x) => x.id == id); if (!t) return;
  document.querySelector(".drawer")?.remove();
  const ed = can("editor"), lines = String(t.notes || "").split("\n").filter(Boolean).map((l) => { const m = l.match(/^\[(.+?)\]\s*(.*)$/); return m ? { m: m[1], t: m[2] } : { m: "", t: l }; }).reverse();
  const d = document.createElement("div"); d.className = "drawer-wrap";
  d.innerHTML = `<aside class="drawer"><button class="x" aria-label="Close">✕</button><span class="sub">${esc(t.id)} · ${esc(t.date)}</span><h3>${esc(t.subject)}</h3><p class="sub">From ${esc(t.from)}</p>${t.link ? `<a href="${esc(t.link)}" target="_blank" rel="noopener">Open original mail ↗</a>` : ""}
  <h4>Status</h4><div class="seg">${C.STATUSES.map((s) => `<button class="chip ${s == t.status ? "on " + slug(s) : ""}" data-set="${s}" ${ed ? "" : "disabled"}>${s}</button>`).join("")}</div>
  <h4>Assigned to</h4><select id="asg" ${ed ? "" : "disabled"}>${["", ...state.users].map((u) => `<option ${u == t.assignee ? "selected" : ""}>${esc(u)}</option>`).join("")}</select>
  <h4>Notes <small class="sub">(everyone can see these)</small></h4>${ed ? '<textarea id="nt" rows="3" placeholder="Write an update for the team…"></textarea><button class="btn pri" id="addnote">Add note</button>' : ""}
  <div class="tl">${lines.map((l) => `<div class="tli"><span class="sub">${esc(l.m)}</span><p>${esc(l.t)}</p></div>`).join("") || '<p class="sub">No notes yet.</p>'}</div></aside>`;
  document.body.appendChild(d); requestAnimationFrame(() => d.classList.add("open"));
  const close = () => { d.classList.remove("open"); setTimeout(() => d.remove(), 250); };
  d.onclick = async (e) => {
    if (e.target == d || e.target.closest(".x")) return close();
    const s = e.target.closest("[data-set]"); if (s) { close(); await setStatus(t.id, s.dataset.set); openTicket(t.id); }
    if (e.target.id == "addnote") { const text = d.querySelector("#nt").value.trim(); if (!text) return; try { await call("addNote", { id: t.id, text }); toast("Note added"); close(); refresh(); setTimeout(() => openTicket(t.id), 900); } catch (er) { toast(er.message, true); } }
  };
  d.querySelector("#asg").onchange = async (e) => { try { await call("updateTicket", { id: t.id, assignee: e.target.value }); toast("Assigned"); refresh(); } catch (er) { toast(er.message, true); } };
}
export default { id: "tickets", title: "Helpdesk", icon: "M4 6h16v12H4zM4 7l8 6 8-6", newBtn: true,
  render() {
    const T = state.data.tickets.filter(match), v = state.ticketView, f = state.filters.status || "All";
    const tabs = `<div class="bar2"><div class="seg"><button class="chip ${v == "board" ? "on" : ""}" data-tv="board">Board</button><button class="chip ${v == "list" ? "on" : ""}" data-tv="list">List</button></div>${can("editor") ? '<button class="btn pri" id="newt">+ New ticket</button>' : ""}</div>`;
    if (v == "board") return tabs + `<div class="board">${C.STATUSES.map((s) => { const L = T.filter((t) => t.status == s); return `<div class="col" data-s="${s}"><div class="ch ${slug(s)}"><b>${s}</b><span>${L.length}</span></div>${L.map(card).join("") || '<p class="sub empty">Drop here</p>'}</div>`; }).join("")}</div>`;
    const chips = ["All", ...C.STATUSES].map((s) => `<button class="chip ${s == f ? "on" : ""}" data-s="${s}">${s} (${s == "All" ? T.length : T.filter((t) => t.status == s).length})</button>`).join("");
    return tabs + `<div class="chips">${chips}</div>` + table([["id", "Mail", (r) => (r.link ? `<a href="${esc(r.link)}" target="_blank" rel="noopener">Open ↗</a>` : "—")], ["date", "Date"], ["from", "From", (r) => esc(who(r.from))], ["subject", "Issue"], ["status", "Status", (r) => stTag(r.status)], ["assignee", "Assigned"]], f == "All" ? T : T.filter((t) => t.status == f), "tickets", { ticket: true });
  },
  after() { // drag & drop between columns
    document.querySelectorAll(".kc[draggable]").forEach((c) => c.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", c.dataset.ticket); c.classList.add("drag"); }));
    document.querySelectorAll(".col").forEach((col) => {
      col.addEventListener("dragover", (e) => { e.preventDefault(); col.classList.add("over"); });
      col.addEventListener("dragleave", () => col.classList.remove("over"));
      col.addEventListener("drop", (e) => { e.preventDefault(); col.classList.remove("over"); setStatus(e.dataTransfer.getData("text/plain"), col.dataset.s); });
    });
  } };
