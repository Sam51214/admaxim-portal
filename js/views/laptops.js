import { state, table, mono } from "../ui.js"; import { esc } from "../utils.js"; import { can } from "../api.js";
export default { id: "laptops", title: "Laptops", icon: "M4 5h16v11H4zM2 19h20", add: "laptops",
  render() {
    return table([["sr", "#"], ["name", "Assigned to", (r) => esc(r.name) || '<span class="tag st-pendingapproval">In stock</span>'], ["dept", "Dept"], ["type", "Type"], ["make", "Make"], ["model", "Model"], ["cpu", "CPU"], ["ram", "RAM"], ["disk", "Storage"], ["serial", "Serial", mono("serial")], ["mac", "MAC", mono("mac")],
      ["cond", "Condition", (r) => (r.cond ? `<span class="tag ${/issue|battery|problem/i.test(r.cond) ? "st-rejected" : "st-new"}">${esc(r.cond)}</span>` : "—")]], state.data.laptops, "laptops", { edit: can("admin") });
  } };
