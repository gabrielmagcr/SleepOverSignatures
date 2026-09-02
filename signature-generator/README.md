# SleepOver email signatures

29 signatures across 5 regions, generated from the workbook.

## Published at

<https://gabrielmagcr.github.io/SleepOverSignatures/signature-generator/>

Each person's page is that base plus their name with hyphens, e.g.
`.../signature-generator/Piers-Bunting.html`. The master check page is
`.../signature-generator/index.html`. The repo layout has not changed, so the
old links still resolve.

Every one of those links is also written into **column K** of the workbook, so
you can send someone their link straight from the spreadsheet.

The base lives in one place — `PAGES_BASE` at the top of `build-data.py`. Change
it there if the repo or the Pages host ever moves, then rebuild.

## Rebuild

```bash
python3 build-data.py && node signature-generator.js && python3 write-page-urls.py
```

`build-data.py` and `write-page-urls.py` need `openpyxl` (`pip3 install openpyxl`).
Node needs nothing.

## What produces what

| File | Role |
|---|---|
| `../SleepOver - Email Signatures.xlsx` | **The source of truth.** Edit this, never anything below. Mirrors HubSpot. |
| `build-data.py` | Reads the workbook, measures the local PNGs in `../assets`, writes `employees.json`. |
| `employees.json` | Generated. Overwritten every build — do not hand-edit. |
| `signature-generator.js` | Turns the JSON into the pages. All the email-HTML and MAG brand decisions live here. |
| `write-page-urls.py` | Writes each person's published page URL back into column K of the workbook. Safe to re-run. |
| `index.html` | **Master check page.** All 29 signatures, per-region, each with its own copy button, link button and a light/dark preview toggle. Search by name at the top. Start here. |
| `<Name>.html` | One page per person: light + dark preview, copy button, `.htm` download, Outlook instructions. |
| `_superseded/` | The old CSV pipeline and its two dummy people, kept for reference. |

## Workbook columns

| Col | Field | Notes |
|---|---|---|
| A | Name | Must match the PNG filename in `../assets/SO Signatures Names/<Region>/` exactly. |
| B | Name URL | Absolute HubSpot URL of that PNG. |
| C | Position | Only used for the page headings — the artwork already contains the title sticker, so it is never typeset into the signature. |
| D | Phone | Personal. Rendered as plain text, never a `tel:` link. |
| E | Email | The only text link besides the website. |
| F | Office address | Line breaks in the cell are honoured. A single long line gets wrapped on its commas. |
| G | Office phone | **Leave empty and the row is dropped from the signature.** |
| H | Office website | |
| I | Region | Heading label. |
| J | Region URL | Absolute HubSpot URL of the region lockup. |
| K | Signature Page URL | **Generated.** Written by `write-page-urls.py` — do not type into it. |

Adding a person: add the row, upload their name PNG to HubSpot under
`SleepOver Signature/<Region>/`, drop the same PNG into
`../assets/SO Signatures Names/<Region>/` so the build can measure it, then rebuild.

## Master page

`index.html` is the QA view. It carries every signature rendered from the same
markup its own page copies, so what you check there is what gets pasted.

- **Search** filters the cards as you type. It matches name, job title, email and
  region, and every word in the query has to match somewhere — so `van horst`
  finds Ryneveld van der Horst. Press <kbd>/</kbd> to jump to the field,
  <kbd>Esc</kbd> to clear. Region counts follow the filter.
- **Dark preview** flips all 29 previews at once to check the inversion.
- **Copy** puts that signature on the clipboard; **Link** copies the person's
  published page URL.

## Sizing

Name artwork is placed at half its export size, so it stays sharp on retina, and
capped at 343px wide — the usable width of the left column. A name whose artwork
is wider than 686px is scaled down further and the master page flags it. Region
lockups are placed at 150px wide with the height taken from their real aspect
ratio.

The vertical divider is measured per person, off whichever column is taller. It
used to be a hard-coded 148px, which was right only for a five-line Fourways
address with an office phone.

## Maps links

The Fourways office uses its verified pin. Every other office falls back to a
Google Maps search on the address text — it resolves, but it is not a saved pin.
Supply real pins if that matters.

## Dark mode

All type and the divider are pure black `#000000`. Gmail and Outlook dark mode
run a lightness inversion over any message that looks light to them, and pure
black is the value that comes back as near-white; a mid-tone only gets nudged and
ends up muddy. Black in, white out.

The dark preview on every page is the *worst* case — a client that darkens the
card but skips the inversion. Gmail and Outlook both invert, so what they show is
the light preview with the type flipped. Worth checking on a real phone before
rollout.

## Copy button

`navigator.clipboard.write` with a `text/html` blob, falling back to a selection
plus `execCommand("copy")` — the fallback is what runs when these pages are opened
straight off disk in a browser that does not treat `file://` as a secure context.
