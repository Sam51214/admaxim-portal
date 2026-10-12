import { state } from "../ui.js"; import { esc } from "../utils.js";
export default { id: "alerts", title: "Alerts", icon: "M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7zM10 20a2 2 0 0 0 4 0",
  render() { return state.alerts.map((a) => `<div class="alert ${a.lvl}">${esc(a.t)}</div>`).join("") || "No alerts."; } };
