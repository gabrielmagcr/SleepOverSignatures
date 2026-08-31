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
  logo: "logo%20(2).png",  // SleepOver INTERNATIONAL lockup (468x97)
  logoWidth: 154,
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
   The signature paints NO background of its own, so it sits on whatever the
   client gives it. Media queries, prefers-color-scheme and [data-ogsc] hooks
   are useless here: the signature is pasted into the client's signature form,
   which keeps the inline styles and throws the <style> block away.

   All type is pure black, and that is deliberate. Gmail and Outlook dark mode
   do not read a colour and leave it alone: they run a lightness inversion over
   any message that looks light to them, and pure black is the value that comes
   out the other side as near-white. A mid-tone only gets nudged, which is why
   #3A0000 or #8C6E80 end up muddy instead of legible. Black in, white out.

   What this does NOT cover is a client that darkens the card but skips the
   inversion. There the text stays black on dark. Gmail and Outlook both invert,
   so this is the right trade for them; the dark preview on the generated page
   is that worst case, not what Gmail actually shows.

   Artwork is never inverted by any client, so the yellow lockup, the
   yellow-and-purple name and the round icons carry their own fill and read
   either way.
--------------------------------------------------------------------------- */

/* ---------- design tokens (measured on the mockup, scale 0.615) ---------- */
const T = {
  width: 594,
  leftCol: 380,
  rightCol: 213,
  // Breathing room on either side of the vertical rule. The left column keeps
  // its own padding-right because clients that compress the signature (Gmail on
  // a phone) collapse the 380px cell down to the width of the email address,
  // which would otherwise sit flush against the rule.
  gutterLeft: 22,
  gutterRight: 25,
  rulerHeight: 148,
  pad: 16,
  // Pure black, so the dark-mode inversion in Gmail and Outlook turns it into
  // near-white. See the note above.
  ink: "#000000",
  rule: "#000000",
  font: "'Nunito Sans','Segoe UI',Arial,Helvetica,sans-serif",
  // The brand face is a heavy rounded display type and no email client can load
  // a webfont reliably, so the name falls back to the heaviest thing that is
  // installed everywhere: Arial Black (Windows + macOS), then bold Arial.
  nameFont: "'Arial Black','Arial Bold','Helvetica Neue',Arial,Helvetica,sans-serif",
  fontCondensed: "'Arial Narrow',Arial,Helvetica,sans-serif",
  size: 11,
  leading: 14,
  // Name artwork, half of the 389x115 export so it stays sharp on retina.
  nameW: 196,
  nameH: 58
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Icon + text row. `lines` is either a string or an array (multi-line block).
    `href` may be null: the two phone numbers are deliberately not links. */
function contactRow(icon, lines, href, topPad) {
  const multi = Array.isArray(lines);
  const valign = multi ? "top" : "middle";
  const link = (inner) => `<a href="${href}"${href.startsWith("http") ? ' target="_blank"' : ""} style="color:${T.ink};text-decoration:none;">${inner}</a>`;
  // Bare text is still wrapped in a styled span. Phones and Gmail auto-detect
  // phone numbers and paint their own blue underlined link around them; a span
  // that already carries the colour and text-decoration is what most clients
  // keep, so the number goes on reading as text.
  const plain = (inner) => `<span style="color:${T.ink};text-decoration:none;">${inner}</span>`;
  const wrap = href ? link : plain;
  const body = wrap(multi ? lines.join('<br />') : lines);

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
    return `<div style="font-family:${T.nameFont};font-size:32px;line-height:34px;font-weight:900;letter-spacing:-0.4px;color:${T.ink};white-space:nowrap;">${esc(emp.name)}</div>`;
  }

  return `<img src="${CDN_BASE}${encodeURI(emp.nameImage)}" width="${T.nameW}" height="${T.nameH}" alt="${esc(emp.name)}" style="display:block;border:0;outline:none;width:${T.nameW}px;height:${T.nameH}px;font-family:${T.nameFont};font-size:26px;line-height:34px;font-weight:800;color:${T.ink};" />`;
}

/** True when the job title has to be typeset. Artwork already contains it. */
const hasTextTitle = (emp) => !!emp.position && !emp.nameImage;

/** Job title, plain capitals. Skipped when the name artwork already has it. */
function title(emp) {
  if (!hasTextTitle(emp)) return "";
  // Uppercased in JS as well as in CSS: Outlook desktop (Word engine) ignores
  // text-transform, so the capitals have to be in the string itself.
  return `
              <tr>
                <td style="padding:5px 0 0 0;font-family:${T.fontCondensed};font-size:12px;line-height:15px;mso-line-height-rule:exactly;font-weight:bold;letter-spacing:0.8px;text-transform:uppercase;color:${T.ink};white-space:nowrap;">${esc(emp.position.toUpperCase())}</td>
              </tr>`;
}

function signature(emp, id) {
  const address = emp.officeAddress ? emp.officeAddress.split("|").map((l) => l.trim()) : company.address;
  const phonePad = hasTextTitle(emp) ? 10 : 12;

  return `<div id="${id}">
<style type="text/css">
/* Only the stacked mobile layout lives here. Signature forms strip <style>, so
   nothing that matters for legibility may depend on it. */
@media only screen and (max-width:620px){
  .so-wrap,.so-grid{width:100% !important;max-width:100% !important;}
  .so-col{display:block !important;width:100% !important;max-width:100% !important;padding-left:16px !important;padding-right:16px !important;box-sizing:border-box !important;}
  .so-rule{display:none !important;}
  .so-right{padding-top:16px !important;border-top:1px solid ${T.rule};}
  .so-name img{width:100% !important;max-width:${T.nameW}px !important;height:auto !important;}
}
</style>
<table class="so-wrap" cellpadding="0" cellspacing="0" border="0" role="presentation" width="${T.width}" style="width:${T.width}px;max-width:${T.width}px;border-collapse:collapse;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <tr>
    <td style="padding:${T.pad}px 0;">
      <table class="so-grid" cellpadding="0" cellspacing="0" border="0" role="presentation" width="${T.width}" style="width:100%;border-collapse:collapse;">
        <tr>

          <!-- ============ left column ============ -->
          <td class="so-col" width="${T.leftCol}" valign="bottom" style="width:${T.leftCol - 15 - T.gutterLeft}px;padding:0 ${T.gutterLeft}px 0 15px;">
            <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">
              <tr>
                <td class="so-name" style="padding:0;font-size:0;line-height:0;">
                  ${nameBlock(emp)}
                </td>
              </tr>${title(emp)}
${contactRow("phone-2.png", emp.phone, null, phonePad)}
${contactRow("mail.png", emp.email, "mailto:" + emp.email, 10)}
            </table>
          </td>

          <!-- ============ vertical rule ============ -->
          <td class="so-rule" width="1" valign="top" style="width:1px;font-size:0;line-height:0;">
            <table cellpadding="0" cellspacing="0" border="0" role="presentation" width="1" style="width:1px;border-collapse:collapse;">
              <tr>
                <td class="so-rule-fill" width="1" height="${T.rulerHeight}" bgcolor="${T.rule}" style="width:1px;height:${T.rulerHeight}px;background-color:${T.rule};font-size:1px;line-height:1px;">&nbsp;</td>
              </tr>
            </table>
          </td>

          <!-- ============ right column ============ -->
          <td class="so-col so-right" width="${T.rightCol}" valign="top" style="width:${T.rightCol - T.gutterRight}px;padding:0 0 0 ${T.gutterRight}px;">
            <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">
              <tr>
                <td style="padding:0;font-size:0;line-height:0;">
                  <a href="${company.websiteUrl}" target="_blank" style="text-decoration:none;">
                    <img src="${CDN_BASE}${company.logo}" width="${company.logoWidth}" height="${company.logoHeight}" alt="SleepOver International" style="display:block;border:0;outline:none;width:${company.logoWidth}px;height:${company.logoHeight}px;" />
                  </a>
                </td>
              </tr>
${contactRow("phone-1.png", company.phone, null, 7)}
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
    <!-- The same signature twice. Only the first one is what gets copied; the
         second is repainted by the .preview-dark rules below to imitate the
         inversion Gmail and Outlook run on a light message. That repaint lives
         in this page's stylesheet only, never in the copied markup. -->
    <div class="signature-container">
      <div class="preview preview-light">
${signature(emp, "content")}
      </div>
      <p class="caption">Light mode &mdash; this is the markup that gets copied.</p>
      <div class="preview preview-dark">
${signature(emp, "content-2")}
      </div>
      <p class="caption">Dark mode &mdash; simulated. Gmail and Outlook invert the black
         type to white and leave the artwork alone.</p>
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
        <li><code>position</code> &mdash; the job title, printed in capitals under
            the name. Leave it empty and the line is not rendered at all.</li>
        <li><code>nameImage</code> &mdash; optional artwork for the name, exported at
            ${T.nameW * 2}x${T.nameH * 2} and placed at ${T.nameW}x${T.nameH}. The current export also
            contains the job-title sticker, so when it is set the
            <code>position</code> line is not typeset on top of it. Leave it
            empty and the name is live text plus a typeset title.</li>
        <li><code>officeAddress</code> &mdash; optional per-person address, lines
            separated by <code>|</code>, field wrapped in quotes.</li>
    </ul>

    <h2>Dark mode</h2>
    <p>The signature paints no background of its own, so it sits on whatever the
       client gives it. Media queries are not an option here &mdash; signature forms
       keep the inline styles and drop the <code>&lt;style&gt;</code> block &mdash; so
       everything rests on the colours themselves.</p>
    <ul>
        <li>All type and the divider are pure black <code>${T.ink}</code>. Gmail
            and Outlook dark mode run a lightness inversion over any message that
            looks light to them, and pure black is the value that comes back as
            near-white. A mid-tone only gets nudged, so it ends up muddy &mdash;
            black in, white out.</li>
        <li>The artwork is never inverted by any client, so the yellow lockup,
            the yellow-and-purple name and the round icons carry their own fill
            and read either way.</li>
        <li>The dark preview above is the worst case: a client that darkens the
            card but skips the inversion. Gmail and Outlook both invert, so what
            they show is the light preview with the type flipped to white. Worth
            checking on a phone before rollout.</li>
    </ul>

    <h2>Images</h2>
    <p>Every <code>&lt;img&gt;</code> points straight at <code>${CDN_BASE}</code>,
       so this preview renders the exact markup that gets copied. The local
       <code>../assets/</code> folder is only the source for those uploads.</p>
    <ul>
        <li>${emp.nameImage ? esc(emp.nameImage) + ` <i>(name and job title in the brand typeface, ${T.nameW}x${T.nameH} &mdash; one per person)</i>` : "<i>no name artwork &mdash; the name is live text</i>"}</li>
        <li>${decodeURIComponent(company.logo)} <i>(SleepOver INTERNATIONAL lockup)</i></li>
        <li>phone-1.png, phone-2.png, mail.png, website.png, location.png</li>
    </ul>

    <h2>Known client limitations</h2>
    <ul>
        <li>Only the email address and the website are links. Both phone numbers
            are plain text on purpose, so no client turns them into a
            <code>tel:</code> handler.</li>
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
    /* Imitates the client-side inversion: black type comes back near-white,
       black fills too, and images are left untouched. Preview only. */
    .preview-dark td,
    .preview-dark div,
    .preview-dark span,
    .preview-dark a{ color:#FFFFFF !important; }
    .preview-dark .so-rule-fill{ background-color:#FFFFFF !important; }
    .caption{
        max-width:760px; margin:6px auto 22px; color:#E7DCE4;
        font-size:13px; line-height:1.5; text-align:center;
    }
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
