# Thumbnail Studio

Turn a table of titles (CSV, Excel or Markdown) into consistent, high-resolution
thumbnails in two formats:

- **Vertical** 540 × 960 base (Instagram 9:16), exports up to 1620 × 2880
- **Horizontal** 1280 × 720 base (YouTube 16:9), exports up to 2560 × 1440

Everything renders in the browser with the Canvas API, so what you see in the
preview is exactly what is exported. Node.js is only needed for the dev server
and build.

Stack: React 18 · TypeScript · CSS Modules · Vite.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts: `npm run typecheck`, `npm run build`, `npm run preview`.

## How it works

1. **Format**: choose vertical or horizontal.
2. **Upload**: drop a `.csv`, `.xlsx`/`.xls`, `.md` (Markdown table) or `.tsv`, or paste a table.
   Samples are in `public/sample-thumbnails.csv` and `public/sample-thumbnails.md`.
3. **Map columns**: columns are matched automatically; change any of them, or type a fixed value for every row.
   Set the username, channel name, background colour and the sequence-code pattern here.
4. **Preview and export**: download one image, or everything as a `.zip`
   (images plus a `manifest.csv`). Pick the resolution and PNG or JPG.

## Columns

| Field | Required | Used for |
| --- | --- | --- |
| Domain | yes | Header text and the big faded background text |
| Content type | no | Header, after the domain (`System Design \| Theory`) |
| Title | yes | Main headline, auto-sized and centred between header and footer |
| Level / part | no | Optional header suffix (`- L1`) and the `{L}` code token |
| Code (override) | no | If a row has a value it is used as-is instead of a generated code |

Rows without a title are skipped.

## Sequence codes

Pattern tokens: `{P}` platform code · `{D}` domain initials · `{T}` type letters · `{L}` level ·
`{N}` / `{N:3}` counter (zero-padded) · `{TOTAL}` rows in the counter group · `{ROW}` row number in the file.

- Vertical default: `{P}-{D}-{T}-{N:3}` gives `IG-SD-TH-001`
- Horizontal default: `{P}-{D}-{T}-{L}-{N:2}/{TOTAL}` gives `YT-SD-TH-L1-01/10`
- Start number, step, and whether the counter restarts per domain (or domain + level) are adjustable.

## Changing the design

- `src/theme.ts`: colours, font families and weights.
- `src/formats.ts`: canvas sizes and the position/size limits of every element.
- Fonts come from `@fontsource/*` packages imported in `src/main.tsx`. To switch a font, install its
  package, import the weight you use there, and change the name in `theme.ts`.

## Project layout

```
src/
  App.tsx                 wizard state and navigation
  components/             Format, Upload, Mapping, Preview steps + Stepper
  lib/
    parseTable.ts         CSV / Excel / Markdown entry points
    markdown.ts matrix.ts table parsing helpers
    mapping.ts            auto column matching, rows -> thumbnail items
    code.ts               sequence-code generation
    renderThumbnail.ts    canvas drawing (one function, preview and export)
    text.ts backdrop.ts   text fitting, balanced wrapping, background text
    exporter.ts           single download and zip
  hooks/usePreviews.ts    sequential preview rendering
```
