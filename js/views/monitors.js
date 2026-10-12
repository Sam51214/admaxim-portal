import { state, table } from "../ui.js"; import { can } from "../api.js";
export default { id: "monitors", title: "Monitors", icon: "M3 4h18v12H3zM8 20h8M12 16v4", add: "monitors",
  render() { return table([["name", "Assigned to"], ["dept", "Dept"], ["make", "Make"], ["model", "Model"], ["size", "Size"], ["status", "Status"]], state.data.monitors, "monitors", { edit: can("admin") }); } };
