import { state, match, secret } from "../ui.js"; import { esc } from "../utils.js";
export default { id: "network", title: "Network", icon: "M2 9a15 15 0 0 1 20 0M5 13a10 10 0 0 1 14 0M8.5 16.5a5 5 0 0 1 7 0M12 20h.01",
  render() {
    const N = state.data.network.filter(match);
    return `<div class="grid">${N.map((d) => `<div class="card dev"><div class="ph"><div><h3>${esc(d.name)}</h3><span class="sub">${esc(d.area) || "—"}</span></div><span class="tag ${/active/i.test(d.status) ? "st-resolved" : "st-pendingapproval"}" style="margin-left:auto">${esc(d.status) || "—"}</span></div>
    ${d.wan.length ? `<div class="row"><span>WAN</span><span class="mono">${d.wan.map(esc).join(", ")}</span></div>` : ""}${d.lan.length ? `<div class="row"><span>LAN</span><span class="mono">${d.lan.map(esc).join(", ")}</span></div>` : ""}${d.mode ? `<div class="row"><span>Mode</span><span>${esc(d.mode)}</span></div>` : ""}
    ${d.user || d.pass ? `<div class="row"><span>Login</span><span class="mono">${esc(d.user) || "—"}</span></div><div class="row"><span>Password</span><span>${secret(d.pass)}</span></div>` : ""}
    ${d.desc ? `<p class="sub">${esc(d.desc)}</p>` : ""}${d.ssids.map((s) => `<div class="ssid"><b>${esc(s.ssid)}</b>${secret(s.pass)}</div>`).join("")}</div>`).join("") || "No network data."}</div>`;
  } };
