/***** AdMaxim IT Portal — backend (Google Apps Script) *****
 * Paste into Extensions > Apps Script. Then run setup() once, then Deploy as Web app.
 */
const GID = { laptops: 0, monitors: 1941019032, network: 713210387, tickets: 1208495049 };
const STATUSES = ['New', 'Pending Approval', 'In Progress', 'Resolved', 'Rejected'];
const LABEL = 'Helpdesk';
const ASSET_TABS = ['laptops', 'monitors'];
const LEVEL = { viewer: 1, editor: 2, admin: 3 };

// ---------- helpers ----------
const ss = () => SpreadsheetApp.getActive();
const sheetByGid = (g) => ss().getSheets().find((s) => s.getSheetId() == g);
const now = (f) => Utilities.formatDate(new Date(), Session.getScriptTimeZone(), f || 'yyyy-MM-dd HH:mm');
function ensure(name, head) { let s = ss().getSheetByName(name); if (!s) { s = ss().insertSheet(name); s.appendRow(head); } return s; }
function log(me, action, detail) { ensure('Log', ['Time', 'User', 'Action', 'Detail']).appendRow([now('yyyy-MM-dd HH:mm:ss'), me.name, action, detail || '']); }
function need(me, role) { if (LEVEL[me.role] < LEVEL[role]) throw new Error('You do not have permission for this action'); }
function locked(fn) { const l = LockService.getScriptLock(); l.waitLock(20000); try { return fn(); } finally { l.releaseLock(); } }

// ---------- auth (Users tab: Name | PIN | Role[viewer/editor/admin]) ----------
function auth(u, p) {
  const cache = CacheService.getScriptCache(), key = 'fail_' + String(u).toLowerCase();
  if (+cache.get(key) >= 5) throw new Error('Too many attempts. Try again in 10 minutes.');
  const rows = ensure('Users', ['Name', 'PIN', 'Role']).getDataRange().getValues().slice(1);
  const r = rows.find((x) => String(x[0]).trim().toLowerCase() == String(u).trim().toLowerCase() && String(x[1]) === String(p) && String(p) !== '');
  if (!r) { cache.put(key, String((+cache.get(key) || 0) + 1), 600); throw new Error('Wrong name or PIN'); }
  cache.remove(key);
  const role = String(r[2] || 'viewer').trim().toLowerCase();
  return { name: String(r[0]).trim(), role: LEVEL[role] ? role : 'viewer' };
}

// ---------- entry points ----------
function doGet() { return out({ ok: true, msg: 'AdMaxim portal API is running. Use POST.' }); }
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function doPost(e) {
  try {
    const b = JSON.parse(e.postData.contents), me = auth(b.u, b.p);
    return out(route(b, me));
  } catch (err) { return out({ ok: false, error: String(err.message || err) }); }
}
function route(b, me) {
  switch (b.a) {
    case 'login': return { ok: true, user: me.name, role: me.role };
    case 'read': return read(me);
    case 'updateTicket': need(me, 'editor'); return locked(() => updateTicket(b, me));
    case 'addNote': need(me, 'editor'); return locked(() => addNote(b, me));
    case 'addTicket': need(me, 'editor'); return locked(() => addTicket(b, me));
    case 'addRow': need(me, 'admin'); return locked(() => addRow(b, me));
    case 'updateRow': need(me, 'admin'); return locked(() => updateRow(b, me));
    default: throw new Error('Unknown action');
  }
}

// ---------- read ----------
function read(me) {
  const tabs = {};
  Object.keys(GID).forEach((k) => {
    const sh = sheetByGid(GID[k]); let v = sh ? sh.getDataRange().getDisplayValues() : [];
    if (k == 'network' && me.role != 'admin') v = v.map((r, i) => r.map((c, j) => (i >= 2 && (j == 4 || j == 6)) || j >= 11 ? '' : c)); // hide passwords
    tabs[k] = v;
  });
  const users = ensure('Users', ['Name', 'PIN', 'Role']).getDataRange().getValues().slice(1).filter((r) => r[0]).map((r) => String(r[0]));
  let logs = [];
  if (me.role == 'admin') { const l = ensure('Log', ['Time', 'User', 'Action', 'Detail']).getDataRange().getDisplayValues().slice(1); logs = l.slice(-100).reverse(); }
  return { ok: true, user: me.name, role: me.role, users, tabs, logs };
}

// ---------- tickets (fixed columns: A id, B date, C from, D subject, E link, F status, G assignee, H notes) ----------
function ticketRow(sh, id) { const v = sh.getDataRange().getValues(), i = v.findIndex((r, n) => n > 0 && String(r[0]) == String(id)); if (i < 0) throw new Error('Ticket not found'); return i + 1; }
function appendNote(sh, row, me, text) { const c = sh.getRange(row, 8), old = c.getValue(); c.setValue((old ? old + '\n' : '') + '[' + now('d MMM HH:mm') + ' ' + me.name + '] ' + text); }
function updateTicket(b, me) {
  const sh = sheetByGid(GID.tickets), row = ticketRow(sh, b.id);
  if (b.status !== undefined) {
    if (STATUSES.indexOf(b.status) < 0) throw new Error('Invalid status');
    const old = sh.getRange(row, 6).getValue();
    if (old != b.status) { sh.getRange(row, 6).setValue(b.status); appendNote(sh, row, me, 'Status: ' + old + ' → ' + b.status); log(me, 'status', b.id + ': ' + old + ' → ' + b.status); }
  }
  if (b.assignee !== undefined) { sh.getRange(row, 7).setValue(b.assignee); appendNote(sh, row, me, 'Assigned to ' + (b.assignee || 'nobody')); log(me, 'assign', b.id + ' → ' + b.assignee); }
  return { ok: true };
}
function addNote(b, me) {
  const text = String(b.text || '').trim(); if (!text) throw new Error('Note is empty');
  const sh = sheetByGid(GID.tickets); appendNote(sh, ticketRow(sh, b.id), me, text.slice(0, 1000)); log(me, 'note', b.id); return { ok: true };
}
function addTicket(b, me) {
  const subject = String(b.subject || '').trim(); if (!subject) throw new Error('Subject is required');
  const id = 'M-' + Date.now();
  sheetByGid(GID.tickets).appendRow([id, now(), b.from || me.name, subject.slice(0, 300), '', 'New', b.assignee || '', '']);
  log(me, 'new ticket', id + ': ' + subject); return { ok: true, id };
}

// ---------- assets: laptops / monitors (columns found by header name) ----------
function headerInfo(sh) {
  const v = sh.getDataRange().getDisplayValues(), hr = v.findIndex((r) => r.filter((c) => String(c).trim()).length >= 4);
  if (hr < 0) throw new Error('Header row not found');
  return { v, hr, H: v[hr].map((x) => String(x).toLowerCase().trim()) };
}
const colOf = (H, key) => H.findIndex((h) => h && h.indexOf(key) >= 0);
function setFields(sh, row, H, fields) {
  const skipped = [];
  Object.keys(fields).forEach((k) => { const c = colOf(H, k); if (c < 0) skipped.push(k); else sh.getRange(row, c + 1).setValue(fields[k]); });
  return skipped;
}
function addRow(b, me) {
  if (ASSET_TABS.indexOf(b.tab) < 0) throw new Error('Tab not editable');
  const sh = sheetByGid(GID[b.tab]), { v, hr, H } = headerInfo(sh);
  let last = hr + 1, max = 0; // last numbered row = end of table
  v.forEach((r, i) => { if (i > hr && /^\d+$/.test(String(r[0]).trim())) { last = i + 1; max = Math.max(max, +r[0]); } });
  sh.insertRowAfter(last); const row = last + 1;
  const sr = colOf(H, 'sr'); if (sr >= 0) sh.getRange(row, sr + 1).setValue(max + 1);
  const skipped = setFields(sh, row, H, b.fields || {});
  log(me, 'add ' + b.tab, JSON.stringify(b.fields).slice(0, 200)); return { ok: true, skipped };
}
function updateRow(b, me) {
  if (ASSET_TABS.indexOf(b.tab) < 0) throw new Error('Tab not editable');
  const sh = sheetByGid(GID[b.tab]), { hr, H } = headerInfo(sh), row = +b.row;
  if (!(row > hr + 1 && row <= sh.getLastRow())) throw new Error('Bad row');
  const skipped = setFields(sh, row, H, b.fields || {});
  log(me, 'edit ' + b.tab, 'row ' + row + ' ' + JSON.stringify(b.fields).slice(0, 200)); return { ok: true, skipped };
}

// ---------- Gmail -> Tickets (runs every 5 min via trigger) ----------
function syncHelpdesk() {
  locked(() => {
    const sh = sheetByGid(GID.tickets), label = GmailApp.getUserLabelByName(LABEL); if (!sh || !label) return;
    const ids = new Set(sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), 1).getValues().flat().map(String));
    label.getThreads(0, 50).reverse().forEach((t) => {
      const id = t.getId(); if (ids.has(id)) return; const m = t.getMessages()[0];
      sh.appendRow([id, Utilities.formatDate(m.getDate(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm'), m.getFrom(), m.getSubject(), 'https://mail.google.com/mail/u/0/#inbox/' + id, 'New', '', '']);
    });
  });
}
// Run ONCE: creates tabs, a first admin user, and the 5-minute trigger.
function setup() {
  const t = sheetByGid(GID.tickets) || ss().insertSheet('Tickets');
  if (t.getLastRow() == 0) t.appendRow(['Ticket ID', 'Date', 'From', 'Subject', 'Mail Link', 'Status', 'Assigned To', 'Notes']);
  const u = ensure('Users', ['Name', 'PIN', 'Role']); if (u.getLastRow() < 2) u.appendRow(['Admin', 'change-me-123456', 'admin']);
  ensure('Log', ['Time', 'User', 'Action', 'Detail']);
  ScriptApp.getProjectTriggers().filter((x) => x.getHandlerFunction() == 'syncHelpdesk').forEach(ScriptApp.deleteTrigger);
  ScriptApp.newTrigger('syncHelpdesk').timeBased().everyMinutes(5).create();
  Logger.log('Setup done. Tickets gid = ' + t.getSheetId() + ' (put it in GID above and in js/config.js)');
}
