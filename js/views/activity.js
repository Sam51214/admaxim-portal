import { state } from "../ui.js"; import { esc } from "../utils.js";
export default { id: "activity", title: "Activity log", min: "admin", icon: "M12 8v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  render() { return `<div class="wrap"><table><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Detail</th></tr></thead><tbody>${state.logs.map((l) => `<tr><td>${esc(l[0])}</td><td>${esc(l[1])}</td><td><span class="tag st-new">${esc(l[2])}</span></td><td>${esc(l[3])}</td></tr>`).join("") || '<tr><td colspan="4">No activity yet.</td></tr>'}</tbody></table></div>`; } };
