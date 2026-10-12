import { esc } from "./utils.js";
// openForm({title, fields:[{k,label,type?,options?}], values, submit}) -> Promise<values|null>
export function openForm({ title, fields, values = {}, submit = "Save" }) {
  return new Promise((res) => {
    const o = document.createElement("div"); o.className = "overlay";
    o.innerHTML = `<form class="modal"><h3>${esc(title)}</h3><div class="fgrid">${fields.map((f) => `<label>${esc(f.label)}${f.options ? `<select name="${f.k}">${f.options.map((x) => `<option ${x == values[f.k] ? "selected" : ""}>${esc(x)}</option>`).join("")}</select>` : f.type == "textarea" ? `<textarea name="${f.k}" rows="3">${esc(values[f.k])}</textarea>` : `<input name="${f.k}" type="${f.type || "text"}" value="${esc(values[f.k])}">`}</label>`).join("")}</div>
    <div class="actions"><button type="button" class="btn" data-x>Cancel</button><button class="btn pri">${esc(submit)}</button></div></form>`;
    document.body.appendChild(o); o.querySelector("input,select,textarea")?.focus();
    const done = (v) => { o.remove(); res(v); };
    o.querySelector("[data-x]").onclick = () => done(null);
    o.onclick = (e) => e.target == o && done(null);
    o.querySelector("form").onsubmit = (e) => { e.preventDefault(); done(Object.fromEntries(new FormData(e.target))); };
  });
}
