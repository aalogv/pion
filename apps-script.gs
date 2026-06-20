/**
 * Visitor log backend for the "pion" GitHub Pages site.
 *
 * SETUP
 * 1. Create a Google Sheet (any name).
 * 2. Extensions -> Apps Script. Delete the sample code, paste THIS file.
 * 3. Change SECRET below to your own password.
 * 4. Deploy -> New deployment -> type "Web app":
 *      - Execute as:  Me
 *      - Who has access:  Anyone
 *    Copy the Web app URL (ends with /exec).
 * 5. Paste that URL into SCRIPT_URL in index.html AND admin.html, then push.
 *
 * The site writes one row per visit. admin.html reads the list using the
 * password (checked here, server-side). Logging is GET so a simple image
 * beacon works; the read uses JSONP (?callback=...) to dodge CORS.
 */

const SECRET = 'CHANGE_ME'; // <-- set your viewer password

function doGet(e) {
  const p = (e && e.parameter) || {};
  const action = p.action || '';

  if (action === 'log') {
    appendVisit(p);
    return ContentService
      .createTextOutput('ok')
      .setMimeType(ContentService.MimeType.TEXT);
  }

  if (action === 'list') {
    const callback = sanitizeCallback(p.callback);
    let payload;
    if (p.pass !== SECRET) {
      payload = { error: 'auth' };
    } else {
      payload = { rows: readVisits() };
    }
    const body = callback
      ? callback + '(' + JSON.stringify(payload) + ')'   // JSONP
      : JSON.stringify(payload);                          // plain JSON fallback
    return ContentService
      .createTextOutput(body)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput('pion log').setMimeType(ContentService.MimeType.TEXT);
}

function sheet_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sh.getLastRow() === 0) {
    sh.appendRow(['server_time', 'client_time', 'ip', 'user_agent', 'referrer']);
  }
  return sh;
}

function appendVisit(p) {
  const sh = sheet_();
  sh.appendRow([
    new Date(),          // server-side timestamp (authoritative)
    p.t || '',           // client-reported ISO time
    p.ip || '',          // visitor IP (from ipify, client-side)
    p.ua || '',          // user agent
    p.ref || ''          // referrer
  ]);
}

function readVisits() {
  const sh = sheet_();
  const last = sh.getLastRow();
  if (last < 2) return [];
  // columns: server_time | client_time | ip | user_agent | referrer
  const data = sh.getRange(2, 1, last - 1, 5).getValues();
  return data.map(function (r) {
    return {
      t: r[0] ? new Date(r[0]).toISOString() : (r[1] || ''),
      ip: r[2],
      ua: r[3],
      ref: r[4]
    };
  }).reverse(); // newest first
}

function sanitizeCallback(cb) {
  if (!cb) return '';
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(cb) ? cb : '';
}
