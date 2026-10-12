import { state, match } from "../ui.js"; import { esc, shared } from "../utils.js";
export default { id: "people", title: "People", icon: "M16 8a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM4 21c0-4 3.5-6 8-6s8 2 8 6",
  render() {
    const { laptops, monitors, tickets } = state.data, m = {}, add = (n, d) => (m[n.toLowerCase()] ??= { n, d, l: [], m: [], t: [] });
    laptops.forEach((l) => l.name && add(l.name, l.dept).l.push(l)); monitors.forEach((x) => x.name && add(x.name, x.dept).m.push(x));
    const P = Object.values(m).filter(match);
    return `<div class="grid">${P.map((p) => `<div class="person"><div class="ph"><div class="av">${esc(p.n[0].toUpperCase())}</div><div><h3>${esc(p.n)}</h3><span class="sub">${esc(p.d || (shared(p.n) ? "Shared" : "—"))}</span></div></div>
    ${p.l.map((l) => `<div class="item"><b>${esc(l.make)} ${esc(l.type || l.model)}</b><br><span class="sub">${esc(l.cpu)} · ${esc(l.ram)} · ${esc(l.disk)}${l.date ? " · since " + esc(l.date) : ""}</span></div>`).join("")}
    ${p.m.map((x) => `<div class="item"><b>Monitor ${esc(x.make)} ${esc(x.model)}</b><br><span class="sub">${esc(x.size)}</span></div>`).join("")}</div>`).join("") || "No results."}</div>`;
  } };
