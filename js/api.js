import { CONFIG as C } from "./config.js";
export const session = { u: "", p: "", user: "", role: "viewer" };
const RANK = { viewer: 1, editor: 2, admin: 3 };
export const can = (min) => RANK[session.role] >= RANK[min];
export const saved = () => { try { return JSON.parse(sessionStorage.getItem("amx")); } catch { return null; } };
export const remember = () => sessionStorage.setItem("amx", JSON.stringify({ u: session.u, p: session.p }));
export const forget = () => sessionStorage.removeItem("amx");
// text/plain avoids a CORS preflight, which Apps Script cannot answer
export async function call(a, payload = {}) {
  if (!C.API_URL) throw new Error("Editing is OFF: API_URL is empty in js/config.js");
  const r = await fetch(C.API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ u: session.u, p: session.p, a, ...payload }) });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || "Request failed");
  return j;
}
export async function login(u, p) {
  Object.assign(session, { u, p });
  const j = await call("login");
  Object.assign(session, { user: j.user, role: j.role });
  remember(); return j;
}
