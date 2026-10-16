# AdMaxim IT Portal v2 (editable)
GitHub Pages (static frontend)  <->  Google Apps Script (API + login)  <->  Google Sheet (database)

backend/Code.gs   paste into the Sheet's Apps Script (the only place that writes to the sheet)
index.html, css/, js/, assets/   upload to GitHub
js/config.js      API_URL, brand, statuses
js/data.js        sheet columns -> objects (add a field to show a new column)
js/forms.js       fields of the Add/Edit forms
js/alerts.js      alert rules
js/views/*.js     one file per page (add a page: new file + one line in js/app.js VIEWS)

Setup
1. Sheet > Extensions > Apps Script > paste backend/Code.gs. Check GID numbers at the top.
2. Run setup() once (authorise). It creates Users, Log, Tickets tabs + 5 min Gmail trigger.
3. In the Users tab set real names, PINs (6+ digits) and roles: viewer / editor / admin.
4. Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone > copy the /exec URL.
5. Paste the URL in js/config.js (API_URL). Upload to GitHub.
6. STOP "Publish to web" on the sheet. It is no longer needed.
After editing Code.gs later: Deploy > Manage deployments > edit > New version.
Local test: python3 -m http.server 8000

v2.1 notes
- Wifi / Backups (any extra visible tab) appear automatically in the menu. Password-like columns are blanked for non-admins by the backend.
- Tickets: newest first. Mail preview, category and priority come from Gmail (syncHelpdesk). For tickets synced earlier run backfillPreviews() in Apps Script (repeat until "Remaining: 0").
- Ctrl/Cmd+K or "/" searches everything.
- Roles: viewer = read only, editor = tickets, admin = everything (Users tab).
- Web App must be deployed with "Who has access: Anyone". A domain-only deployment (URL contains /a/macros/<domain>/) cannot be called from GitHub Pages.
