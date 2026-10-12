import { CONFIG as C } from "../config.js"; import { state, slug, stTag } from "../ui.js"; import { esc } from "../utils.js";
export default { id: "overview", title: "Overview", icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  render() {
    const { laptops: L, monitors: M, network: N, tickets: T } = state.data, as = L.filter((x) => x.name).length, pc = L.length ? as / L.length : 0, R = 2 * Math.PI * 40;
    const open = T.filter((t) => !/resolved|rejected/i.test(t.status)).length, pend = T.filter((t) => t.status == "Pending Approval").length;
    const stats = [[L.length, "Laptops", ""], [as, "Assigned", ""], [M.length, "Monitors", ""], [N.length, "Network devices", ""], [open, "Open tickets", open ? "hot" : ""], [pend, "Awaiting approval", pend ? "warn" : ""]];
    return `<div class="stats">${stats.map(([n, l, c]) => `<div class="stat ${c}"><b>${n}</b><span>${l}</span></div>`).join("")}</div>
    <div class="two"><div class="card"><b>Helpdesk pipeline</b><div class="pipe">${C.STATUSES.map((s) => { const n = T.filter((t) => t.status == s).length; return `<div class="pbar"><span>${s}</span><i class="${slug(s)}" style="width:${T.length ? Math.max(n / T.length * 100, n ? 6 : 0) : 0}%"></i><b>${n}</b></div>`; }).join("")}</div></div>
    <div class="card donut"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="var(--line)" stroke-width="13"/><circle cx="50" cy="50" r="40" fill="none" stroke="var(--acc)" stroke-width="13" stroke-dasharray="${R * pc} ${R}" transform="rotate(-90 50 50)" stroke-linecap="round"/><text x="50" y="56" text-anchor="middle" font-size="20" font-weight="800" fill="var(--ink)">${Math.round(pc * 100)}%</text></svg><div><b>Laptops in use</b><p class="sub">${as} of ${L.length} are assigned to people.</p></div></div></div>
    <div class="two"><div class="card"><b>Latest tickets</b>${T.slice(-5).reverse().map((t) => `<div class="mini click" data-ticket="${esc(t.id)}"><span>${esc(t.subject)}</span>${stTag(t.status)}</div>`).join("") || "<p class='sub'>No tickets yet.</p>"}</div>
    <div class="card"><b>Needs attention</b>${state.alerts.slice(0, 4).map((a) => `<div class="alert ${a.lvl}">${esc(a.t)}</div>`).join("") || "<p class='sub'>Nothing flagged.</p>"}</div></div>`;
  } };
