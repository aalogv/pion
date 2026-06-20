# pion

A small GitHub Pages site that opens with a peony photo and logs every visitor's
IP address and visit time. The log is viewable on a password-gated page.

**Live site:** https://aalogv.github.io/pion/
**Visitor log:** https://aalogv.github.io/pion/admin.html (password required)

## How it works

GitHub Pages is static hosting — it cannot run server code or capture IPs by
itself. So logging is wired through a small **Google Apps Script** web app that
writes rows to a Google Sheet:

- `index.html` — shows the peony. On load it fetches the visitor's public IP from
  [ipify](https://www.ipify.org/) and fires a one-pixel image beacon to the Apps
  Script (`?action=log&ip=…&t=…`). Fire-and-forget, never blocks the page.
- `apps-script.gs` — the backend. `action=log` appends a row; `action=list`
  returns all rows **only if the password matches** (checked server-side).
- `admin.html` — password prompt. Reads the list via JSONP (Apps Script sends no
  CORS headers, so a plain `fetch` would be blocked) and renders a table.

## Setup (one-time, ~5 minutes)

The Apps Script part must be done in **your own** Google account — it can't be
automated.

1. Create a Google Sheet (any name).
2. **Extensions → Apps Script**. Delete the sample, paste `apps-script.gs`.
3. Set `const SECRET = '…'` to your chosen viewer password. Save.
4. **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Copy the Web app URL (ends with `/exec`).
5. Paste that URL into `SCRIPT_URL` in **both** `index.html` and `admin.html`
   (replace `PASTE_YOUR_APPS_SCRIPT_EXEC_URL_HERE`).
6. Commit and push. Open the site once (creates a row), then open `admin.html`
   and enter the password to see the log.

## Notes & caveats

- **IP accuracy:** the IP comes from the browser via ipify, so it is the
  network's public IP (NAT/VPN/proxy can mask it) and can be spoofed. Fine for
  curiosity, not for security.
- **Password strength:** the admin password is checked server-side in Apps
  Script, but it travels in a request URL. Good enough for casual gating, not
  high security. Don't reuse an important password.
- **Privacy:** an IP address is personal data under GDPR and similar laws. If the
  site is public, add a visible notice that visits are logged, and don't share
  the log publicly.

## Photo credit

Peony photo by **amandabhslater** (Flickr), licensed CC BY-SA. Sourced via
loremflickr.
