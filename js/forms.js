// k = key on the object, h = header text (part of it) in the Google Sheet
export const FORMS = {
  laptops: { title: "Laptop", fields: [
    { k: "name", h: "name", label: "Assigned to" }, { k: "dept", h: "dept", label: "Department" },
    { k: "type", h: "dev type", label: "Device type" }, { k: "make", h: "make", label: "Make" }, { k: "model", h: "model", label: "Model" },
    { k: "cpu", h: "cpu", label: "CPU & Gen" }, { k: "ram", h: "ram", label: "RAM" }, { k: "disk", h: "hdd", label: "Storage" },
    { k: "serial", h: "serial", label: "Serial number" }, { k: "mac", h: "mac", label: "MAC address" }, { k: "cond", h: "condition", label: "Condition" } ] },
  monitors: { title: "Monitor", fields: [
    { k: "name", h: "name", label: "Assigned to" }, { k: "dept", h: "dept", label: "Department" }, { k: "make", h: "make", label: "Make" },
    { k: "model", h: "model", label: "Model" }, { k: "size", h: "size", label: "Size" }, { k: "status", h: "status", label: "Status" } ] },
};
export const toSheet = (tab, v) => Object.fromEntries(FORMS[tab].fields.map((f) => [f.h, v[f.k] ?? ""]));
