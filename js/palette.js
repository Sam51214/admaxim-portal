import { state } from "./ui.js"; import { esc } from "./utils.js";
// Ctrl/Cmd+K or "/" : search everything from any page
export function openPalette({ go, ticket }) {
  if (document.querySelector(".pal")) return;
  const o = document.createElement("div"); o.className = "overlay pal";
  o.innerHTML = `<div class="palbox"><input autofocus placeholder="Search people, serials, tickets, WiFi, backups…" aria-label="Search everything"><div class="res"></div><p class="sub">Esc to close</p></div>`;
  document.body.appendChild(o); const inp = o.querySelector("input"), res = o.querySelector(".res"); let items = [];
  const close = () => o.remove();
  const search = (q) => {
    items = []; if (!q) { res.innerHTML = '<p class="sub pad">Start typing…</p>'; return; }
    const hit = (x) => JSON.stringify(x).toLowerCase().includes(q), D = state.data;
    D.tickets.filter(hit).slice(0, 6).forEach((t) => items.push({ g: "Tickets", t: t.subject, s: t.status + " · " + t.from, f: () => ticket(t.id) }));
    D.laptops.filter(hit).slice(0, 6).forEach((l) => items.push({ g: "Laptops", t: (l.name || "In stock") + " — " + (l.make + " " + l.model), s: l.serial, f: () => go("laptops", q) }));
    D.monitors.filter(hit).slice(0, 4).forEach((m) => items.push({ g: "Monitors", t: (m.name || "—") + " — " + m.make + " " + m.model, s: m.size, f: () => go("monitors", q) }));
    D.network.filter(hit).slice(0, 4).forEach((n) => items.push({ g: "Network", t: n.name, s: n.area, f: () => go("network", q) }));
    Object.entries(state.extra).forEach(([n, t]) => t.rows.filter(hit).slice(0, 4).forEach((r) => items.push({ g: n, t: r.c0 || r.c1 || "row", s: r.c1 || "", f: () => go("x-" + n.toLowerCase().replace(/[^a-z0-9]+/g, "-"), q) })));
    res.innerHTML = items.map((x, i) => `<div class="pr" data-i="${i}"><span class="tag st-new">${esc(x.g)}</span><b>${esc(x.t)}</b><span class="sub">${esc(x.s)}</span></div>`).join("") || '<p class="sub pad">Nothing found.</p>';
  };
  inp.oninput = () => search(inp.value.trim().toLowerCase()); search("");
  res.onclick = (e) => { const r = e.target.closest(".pr"); if (r) { close(); items[r.dataset.i].f(); } };
  inp.onkeydown = (e) => { if (e.key == "Enter" && items[0]) { close(); items[0].f(); } };
  o.onclick = (e) => e.target == o && close(); o.onkeydown = (e) => e.key == "Escape" && close(); inp.focus();
}
