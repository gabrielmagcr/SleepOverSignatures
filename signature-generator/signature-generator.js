const fs = require("fs");
const path = require("path");

const outputDir = __dirname;
const csvPath = path.join(__dirname, "employees.csv");

// Public base where the contents of ../assets are hosted (same pattern as
// African). Image URLs are written absolute so the preview shows exactly what
// gets copied, and the file keeps working from any folder.
const CDN_BASE = "https://magneticcreative.com/hubfs/SleepOver%20Signature/";

/* ---------------------------- data source ---------------------------------
   employees.csv columns (header row is required, order does not matter):

     name           Full name, also used for the file name.
     position       Job-title pill. LEAVE EMPTY to drop the pill entirely.
     phone          Personal phone, as it should read on screen.
     email          Personal email.
     nameImage      Optional. File in ../assets with the name in the brand
                    typeface. Empty = the name is rendered as live text.
     officeAddress  Optional. Overrides the company address. Lines separated
                    by "|". Wrap the whole field in quotes if it has commas.
--------------------------------------------------------------------------- */

/** Minimal RFC4180 parser: quoted fields, "" escapes, CR/LF inside quotes. */
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", quoted = false;

  text = text.replace(/^﻿/, "");

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((v) => v.trim() !== "")) rows.push(row);

  const head = rows.shift().map((h) => h.trim());
  return rows.map((r) => {
    const o = {};
    head.forEach((h, i) => (o[h] = (r[i] || "").trim()));
    return o;
  });
}

const employees = parseCSV(fs.readFileSync(csvPath, "utf8"));

// Company details, shared by every signature
const company = {
  logo: "Logo%20white%20cameo.png",  // SleepOver white cameo lockup
  logoWidth: 138,
  logoHeight: 32,
  phone: "+27 (0)10 110 9910",
  website: "sleepover.travel",
  websiteUrl: "https://sleepover.travel",
  mapsUrl: "https://maps.app.goo.gl/4YZ1YCxyxTXiUDC57",
  address: [
    "Satellite Office:",
    "Little Fourways Office Park,",
    "Block A, 1 Leslie Avenue,",
    "Fourways, Johannesburg,",
    "South Africa"
  ]
};

/* ---------- dark mode ------------------------------------------------------
   Same solution as the African signatures: the signature has NO background of
   its own and every colour is a mid-tone that reads on white and on dark alike.

   Media queries, prefers-color-scheme and [data-ogsc] hooks are useless here,
   because the signature is pasted into the client's signature form, which keeps
   the inline styles and throws the <style> block away. And Outlook/Gmail dark
   mode either recolours the light background or inverts the whole card, so any
   colour that only works on white is going to break sooner or later.

   The two rules that keep it safe:
     1. Never paint a background on the card. What is transparent adapts.
     2. Every colour, in CSS and inside the artwork, has to clear ~4:1 against
        white AND against near-black. The palette below is measured for that.
        Filled shapes (the yellow pill, the round icons) are fine as they are:
        they carry their own contrast with them whichever way the client flips.
--------------------------------------------------------------------------- */

/* ---------- design tokens (measured on the mockup, scale 0.615) ---------- */
const T = {
  width: 594,
  leftCol: 380,
  rightCol: 213,
  rulerHeight: 148,
  pad: 16,
  // contrast vs #FFFFFF / vs #121212
  ink: "#8C6E80",        // 4.5 / 4.2  body copy
  nameInk: "#8C6E80",    // 4.5 / 4.2  first word of the name
  purple: "#A05FB8",     // 4.4 / 4.3  surname, links
  pillBg: "#FFF8BD",
  pillInk: "#2E0036",
  rule: "#927373",       // 4.3 / 4.4
  font: "'Nunito Sans','Segoe UI',Arial,Helvetica,sans-serif",
  // The brand face is a heavy rounded display type and no email client can load
  // a webfont reliably, so the name falls back to the heaviest thing that is
  // installed everywhere: Arial Black (Windows + macOS), then bold Arial.
  nameFont: "'Arial Black','Arial Bold','Helvetica Neue',Arial,Helvetica,sans-serif",
  fontCondensed: "'Arial Narrow',Arial,Helvetica,sans-serif",
  size: 11,
  leading: 14,
  // The pill is deliberately off-axis in the artwork. Measured from the mockup:
  // cap-top -2.51 deg, baseline -2.31 deg, bottom edge -2.28 deg.
  pillTilt: -2.4,
  // The name image is 34px tall but its baseline sits at ~27px; the remaining
  // 7px are the descender of "Bunting". In the artwork the pill tucks under the
  // baseline, so it has to be pulled up over that descender. Outlook desktop
  // drops negative margins and simply leaves the pill 8px lower, with no overlap
  // to resolve.
  pillOverlap: 8
};

// +27 (0)84 287 2596 -> tel:+27842872596  (the national 0 is dropped)
const tel = (n) => "tel:" + n.replace(/\(0\)/g, "").replace(/[^\d+]/g, "");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Icon + text row. `lines` is either a string or an array (multi-line block). */
function contactRow(icon, lines, href, topPad) {
  const multi = Array.isArray(lines);
  const valign = multi ? "top" : "middle";
  const link = (inner) => `<a href="${href}"${href.startsWith("http") ? ' target="_blank"' : ""} style="color:${T.ink};text-decoration:none;">${inner}</a>`;
  const body = multi
    ? (href ? link(lines.join('<br />')) : lines.join('<br />'))
    : (href ? link(lines) : lines);

  return `
              <tr>
                <td style="padding:${topPad}px 0 0 0;">
                  <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">
                    <tr>
                      <td width="14" valign="${valign}" style="width:14px;font-size:0;line-height:0;">
                        <img src="${CDN_BASE}${icon}" width="14" height="14" alt="" style="display:block;border:0;outline:none;width:14px;height:14px;" />
                      </td>
                      <td width="8" style="width:8px;font-size:0;line-height:0;">&nbsp;</td>
                      <td valign="${valign}" style="font-family:${T.font};font-size:${T.size}px;line-height:${T.leading - (multi ? 1 : 0)}px;mso-line-height-rule:exactly;font-weight:600;color:${T.ink};">${body}</td>
                    </tr>
                  </table>
                </td>
              </tr>`;
}

/** Name block: brand artwork when nameImage is set, live text otherwise. */
function nameBlock(emp) {
  if (!emp.nameImage) {
    const [first, ...rest] = emp.name.split(/\s+/);
    return `<div style="font-family:${T.nameFont};font-size:26px;line-height:34px;font-weight:900;letter-spacing:-0.4px;color:${T.nameInk};white-space:nowrap;">${esc(first)}${rest.length ? ` <span style="color:${T.purple};">${esc(rest.join(" "))}</span>` : ""}</div>`;
  }

  // position:relative lifts the name above the pill so the letters of the first
  // word overlap the yellow, as in the artwork, instead of being covered by it.
  return `<img src="${CDN_BASE}${encodeURI(emp.nameImage)}" width="193" height="34" alt="${esc(emp.name)}" style="display:block;border:0;outline:none;position:relative;z-index:2;width:193px;height:34px;font-family:${T.font};font-size:26px;line-height:34px;font-weight:800;color:${T.nameInk};" />`;
}

/** Job-title pill. Rendered only when the CSV row carries a position. */
function pill(emp) {
  if (!emp.position) return "";
  return `
              <tr>
                <td style="padding:0;">
                  <!-- Job-title pill. The tilt is ignored by Outlook desktop (Word
                       engine), which simply renders it straight. The yellow fill
                       carries its own contrast, so it survives dark mode. -->
                  <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;margin-top:-${T.pillOverlap}px;-webkit-transform:rotate(${T.pillTilt}deg);transform:rotate(${T.pillTilt}deg);">
                    <tr>
                      <td bgcolor="${T.pillBg}" style="background-color:${T.pillBg};border-radius:15px;padding:8px;font-family:${T.fontCondensed};font-size:12px;line-height:14px;mso-line-height-rule:exactly;font-weight:bold;letter-spacing:0;color:${T.pillInk};white-space:nowrap;">${esc(emp.position)}</td>
                    </tr>
                  </table>
                </td>
              </tr>`;
}

function signature(emp, id) {
  const address = emp.officeAddress ? emp.officeAddress.split("|").map((l) => l.trim()) : company.address;
  // With no pill there is no negative margin to compensate for.
  const phonePad = emp.position ? 8 + T.pillOverlap : 12;

  return `<div id="${id}">
<style type="text/css">
/* Only the stacked mobile layout lives here. Signature forms strip <style>, so
   nothing that matters for legibility may depend on it. */
@media only screen and (max-width:620px){
  .so-wrap,.so-grid{width:100% !important;max-width:100% !important;}
  .so-col{display:block !important;width:100% !important;max-width:100% !important;padding-left:16px !important;padding-right:16px !important;box-sizing:border-box !important;}
  .so-rule{display:none !important;}
  .so-right{padding-top:16px !important;border-top:1px solid ${T.rule};}
  .so-name img{width:100% !important;max-width:193px !important;height:auto !important;}
}
</style>
<table class="so-wrap" cellpadding="0" cellspacing="0" border="0" role="presentation" width="${T.width}" style="width:${T.width}px;max-width:${T.width}px;border-collapse:collapse;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <tr>
    <td style="padding:${T.pad}px 0;">
      <table class="so-grid" cellpadding="0" cellspacing="0" border="0" role="presentation" width="${T.width}" style="width:100%;border-collapse:collapse;">
        <tr>

          <!-- ============ left column ============ -->
          <td class="so-col" width="${T.leftCol}" valign="bottom" style="width:${T.leftCol - 15}px;padding:0 0 0 15px;">
            <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">
              <tr>
                <td class="so-name" style="padding:0;font-size:0;line-height:0;">
                  ${nameBlock(emp)}
                </td>
              </tr>${pill(emp)}
${contactRow("phone-2.png", emp.phone, tel(emp.phone), phonePad)}
${contactRow("mail.png", emp.email, "mailto:" + emp.email, 10)}
            </table>
          </td>

          <!-- ============ vertical rule ============ -->
          <td class="so-rule" width="1" valign="top" style="width:1px;font-size:0;line-height:0;">
            <table cellpadding="0" cellspacing="0" border="0" role="presentation" width="1" style="width:1px;border-collapse:collapse;">
              <tr>
                <td width="1" height="${T.rulerHeight}" bgcolor="${T.rule}" style="width:1px;height:${T.rulerHeight}px;background-color:${T.rule};font-size:1px;line-height:1px;">&nbsp;</td>
              </tr>
            </table>
          </td>

          <!-- ============ right column ============ -->
          <td class="so-col so-right" width="${T.rightCol}" valign="top" style="width:${T.rightCol - 25}px;padding:0 0 0 25px;">
            <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">
              <tr>
                <td style="padding:0;font-size:0;line-height:0;">
                  <a href="${company.websiteUrl}" target="_blank" style="text-decoration:none;">
                    <img src="${CDN_BASE}${company.logo}" width="${company.logoWidth}" height="${company.logoHeight}" alt="SleepOver International" style="display:block;border:0;outline:none;width:${company.logoWidth}px;height:${company.logoHeight}px;" />
                  </a>
                </td>
              </tr>
${contactRow("phone-1.png", company.phone, tel(company.phone), 7)}
${contactRow("website.png", company.website, company.websiteUrl, 10)}
${contactRow("location.png", address, company.mapsUrl, 10)}
            </table>
          </td>

        </tr>
      </table>
    </td>
  </tr>
</table>
</div>`;
}

function page(emp) {
  const slug = emp.name.replace(/\s+/g, "-");

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(emp.name)} - Signature</title>
</head>
<body>
    <!-- The same signature twice, on white and on near-black, so both readings
         can be checked at a glance. Only the first one is what gets copied. -->
    <div class="signature-container">
      <div class="preview preview-light">
${signature(emp, "content")}
      </div>
      <div class="preview preview-dark">
${signature(emp, "content-2")}
      </div>
    </div>

    <div class="actions">
        <span>Step 1</span>
        <button id="btn">Click here to copy</button>
        <button id="btn-file">Download .htm (Outlook desktop)</button>
    </div>

<div class="steps">
    <h2>Outlook &mdash; Windows (recommended: .htm file)</h2>
    <ol>
        <li>Click <b>Download .htm (Outlook desktop)</b>.</li>
        <li>Open File Explorer and paste this into the address bar:
            <code>%APPDATA%\\Microsoft\\Signatures</code></li>
        <li>Copy the downloaded <code>${slug}.htm</code> into that folder.</li>
        <li>Open Outlook &rarr; <b>File &rarr; Options &rarr; Mail &rarr; Signatures</b>.</li>
        <li>Pick the signature under <b>New messages</b> and <b>Replies/forwards</b> &rarr; <b>OK</b>.</li>
    </ol>

    <h2>Outlook &mdash; Windows / Mac / Web (paste)</h2>
    <ol>
        <li>Click <b>Click here to copy</b>.</li>
        <li><b>Outlook Web / new Outlook:</b> Settings (gear) &rarr; <b>Mail &rarr; Compose and reply &rarr; Email signature</b>.<br>
            <b>Outlook Mac:</b> <b>Outlook &rarr; Settings &rarr; Signatures</b> &rarr; <b>+</b>.<br>
            <b>Outlook Windows:</b> <b>File &rarr; Options &rarr; Mail &rarr; Signatures &rarr; New</b>.</li>
        <li>Paste with <b>Ctrl + V</b> (Windows) or <b>Cmd + V</b> (Mac). Do not use "paste as plain text".</li>
        <li>Assign the signature to <b>New messages</b> and <b>Replies/forwards</b>, then save.</li>
    </ol>

    <h2>Adding people</h2>
    <p>All the data lives in <code>employees.csv</code>, one row per person. Fill it
       in and run <code>node signature-generator.js</code> to rebuild every page.</p>
    <ul>
        <li><code>position</code> &mdash; the yellow pill. Leave it empty and the pill is
            not rendered at all.</li>
        <li><code>nameImage</code> &mdash; optional artwork for the name (193x34).
            Leave it empty and the name is written as live text, which always
            follows the palette below.</li>
        <li><code>officeAddress</code> &mdash; optional per-person address, lines
            separated by <code>|</code>, field wrapped in quotes.</li>
    </ul>

    <h2>Dark mode</h2>
    <p>Handled the way the African signatures handle it: the signature paints no
       background of its own, so it sits on whatever the client gives it, and
       every colour is a mid-tone that clears roughly 4:1 against white
       <i>and</i> against near-black. Media queries are not an option here &mdash;
       signature forms keep the inline styles and drop the <code>&lt;style&gt;</code>
       block.</p>
    <ul>
        <li>Text <code>${T.ink}</code> &middot; surname and links <code>${T.purple}</code>
            &middot; rule <code>${T.rule}</code>.</li>
        <li>The yellow pill and the round icons are filled shapes: they carry
            their own contrast, so they hold up either way.</li>
        <li>Artwork has to follow the same rule, because no client recolours an
            image. Anything near-black on transparency &mdash; the maroon in the name
            artwork, the "INTERNATIONAL" wordmark in the lockup &mdash; disappears on a
            dark background, so those two files need a re-export in
            <code>${T.ink}</code> / <code>${T.purple}</code>. Until then, clearing
            <code>nameImage</code> in the CSV renders the name as text and is
            correct in both modes.</li>
    </ul>

    <h2>Images</h2>
    <p>Every <code>&lt;img&gt;</code> points straight at <code>${CDN_BASE}</code>,
       so this preview renders the exact markup that gets copied. The local
       <code>../assets/</code> folder is only the source for those uploads.</p>
    <ul>
        <li>${emp.nameImage ? esc(emp.nameImage) + " <i>(name in the brand typeface, 193x34 &mdash; one per person)</i>" : "<i>no name artwork &mdash; the name is live text</i>"}</li>
        <li>${decodeURIComponent(company.logo)} <i>(SleepOver International lockup)</i></li>
        <li>phone-1.png, phone-2.png, mail.png, website.png, location.png</li>
    </ul>

    <h2>Known client limitations</h2>
    <ul>
        <li>Outlook desktop for Windows uses the Word engine: it ignores
            <code>transform</code>, so the job-title pill sits straight instead of
            tilted.</li>
        <li>The stacked mobile layout relies on a media query. Outlook for iOS/Android,
            Apple Mail and the Gmail app honour it when it survives the paste;
            Outlook desktop keeps the ${T.width}px two-column layout, which is the
            intended behaviour.</li>
    </ul>
</div>

<style>
    body{
        margin:0;
        padding:40px 20px 80px;
        background:#5D575C;
        font-family:'Segoe UI',Arial,Helvetica,sans-serif;
        display:flex;
        flex-direction:column;
        align-items:center;
    }
    .signature-container{ width:100%; max-width:100%; min-width:0; }
    .preview{ overflow-x:auto; padding:8px 0; }
    .preview table.so-wrap{ margin:0 auto; }
    .preview-light{ background:#FFFFFF; }
    .preview-dark{ background:#121212; }
    .actions{
        display:flex; align-items:center; gap:14px; flex-wrap:wrap;
        margin:36px 0 44px; color:#fff; font-size:16px;
    }
    .actions button{
        background-color:greenyellow; color:#000; border:solid 1px; padding:10px;
        border-radius:12px; cursor:pointer; font-size:15px;
    }
    .steps{
        background:#fff; border-radius:12px; padding:28px 32px;
        max-width:760px; width:100%; color:#2A0000; line-height:1.6;
    }
    .steps h2{ font-size:20px; margin:26px 0 10px; color:#8234A4; }
    .steps h2:first-child{ margin-top:0; }
    .steps code{ background:#F3EEF5; padding:2px 6px; border-radius:4px; }
</style>

<script>
    // Image URLs are already absolute, so the markup ships as-is.
    function buildSignature() {
        return document.getElementById("content").innerHTML;
    }

    document.getElementById("btn").addEventListener("click", async function () {
        try {
            await navigator.clipboard.write([
                new ClipboardItem({
                    "text/html": new Blob([buildSignature()], { type: "text/html" })
                })
            ]);
            alert("Copied");
        } catch (err) {
            console.error("Error: ", err);
            alert("Error. Ask Gabo");
        }
    });

    document.getElementById("btn-file").addEventListener("click", function () {
        var doc = '<!DOCTYPE html><html><head><meta charset="utf-8">' +
                  '<meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head>' +
                  '<body style="margin:0;">' + buildSignature() + '</body></html>';
        var url = URL.createObjectURL(new Blob([doc], { type: "text/html" }));
        var a = document.createElement("a");
        a.href = url;
        a.download = "${slug}.htm";
        a.click();
        URL.revokeObjectURL(url);
    });
</script>
</body>
</html>`;
}

employees.forEach((employee) => {
    const fileName = `${employee.name.replace(/\s+/g, "-")}.html`;
    fs.writeFileSync(path.join(outputDir, fileName), page(employee), "utf8");
    console.log("Generated:", fileName);
});
