# Dynamic Print Builder — design

Status: v1 build. Owner repos: `hospediav12-fe` (designer, engine source) and
`hospediav12-api/HospediaAPI/PrintBuilder` (storage, data, PDF).

Goal: print layouts live in the database and are edited visually. A layout
change is a publish, not a C# change and a deploy.

---

## 1. What exists today (findings)

| Area | Finding |
|---|---|
| Entry | `CommonReciept_PDFController.CommonReceiptPdf(CommonRecieptPDFDTO)` — POST, AllowAnonymous. `obj.Type` picks the SP (`sp_opd_BillPrintout(vTransactionID)`, `sp_opd_AdvanceReceiptPrintout`, `sp_ipd_AdvanceReceiptPrintout`, `Store_Pharmacy_BillPrintOut`) and hard-coded header/footer heights (`recipt_height` only for PHY). |
| HTML | Built in C# `StringBuilder` (`MakePatientHeader` + body), Times New Roman 12px, inline styles. Header/footer text from `receipt_header (HeaderText, FooterText)` by `HeaderType` + `CentreID`. Letterhead image (`center_master.ReportHeaderURL`, file in `Images/`) is stamped on each page afterwards with PdfSharp. |
| PDF | `PuppeteerBrowserProvider` (singleton, one shared Chrome, prefers installed Chrome/Edge, falls back to `BrowserFetcher`) → `page.PdfStreamAsync` → PdfSharp merge → `IMemoryCache` (15 min) → `RenderPdf(cacheKey)` serves `application/pdf`. |
| Contract | `Response { Success, Message, Data = new { PdfUrl = urlHelper.Action("RenderPdf", new { cacheKey })?.Replace("/api/v1/", "") } }`. FE opens it with `RedirectURL(res.data.pdfUrl)` → `window.open(APIBaseURL + "/" + url)`. |
| Data | `sp_opd_BillPrintout` returns ONE result set: one row per item with patient/bill header fields repeated on every row, and duplicate column names (`DoctorName` ×3, `CentreID` ×2, `IsPackage` ×2). Payments come from a second SP `sp_PaymentDetailsAgainstTransactionID(vTransactionID, vReceiptNo)`. SP parameter names are `v`-prefixed. Dev DB TransactionID 1181 has 140 item rows (page-break test), 1180 has 7. |
| Prod risk | `hospedia-prod` cannot download Chrome for PuppeteerSharp — CommonReceiptPdf answers HTTP 200 with an HTML error page. See §9. |
| Old attempt | Reverted 2026-10-12. Its tables `pb_template` (4 rows), `pb_template_version` (2), `pb_datasource`, `pb_asset` still exist on **hospedia_production** only — none on `hospedia_development`. Left untouched; the new bootstrap detects that legacy shape (no `TemplateCode` column) and refuses to run rather than mixing schemas. Drop script: §7. |
| Reuse | `NewHRFieldBuilderRepo.SplitSqlStatements` (literal/comment-aware splitter), `ScreenStore` install pattern, `IdentityExtensions` (`GetEmployeeId`, `GetCentreID`, …), `makeApiRequest`, `RedirectURL`, DSB `Tap` idea (span role=button — theme.css paints every bare `<button>`). |

---

## 2. Market research

| Product | Designer layout | Band model | Data binding | Preview / output | Versioning |
|---|---|---|---|---|---|
| **Stimulsoft** | Ribbon top, toolbox left, dictionary (data tree) right, properties grid | Page/Report header+footer, Header, Data, Group H/F, Child, Empty bands | Dictionary of sources → drag column onto page; `{Data.Field}` expressions with C#-like syntax; totals `{Sum(Data.Amount)}` | Built-in viewer, PDF export, server render via same engine | Report file (.mrt) — versioning external |
| **FastReport** | Toolbox left, data tree right, properties grid, mm rulers + grid snap | Same classic band set; Data band bound to a datasource; group header has condition expression | `[Table.Field]` brackets, `[Sum(...)]` totals, highlight conditions, “CanGrow/CanShrink” | Preview window = same engine as export | file-based |
| **DevExpress Reporting** | Field list + report explorer + properties panel, smart tags | Detail / DetailReport (nested) / Group H/F / Report & Page H/F | Expression bindings `[Field]`, calculated fields, summary running = Group/Report/Page | Web document viewer renders server side; PDF identical to preview | REST storage hooks |
| **Crystal Reports** | Field explorer, sections (bands) stacked, suppress formulas | Report H/F, Page H/F, Group H/F, Details; “Keep together”, “Suppress (no drill)” | Formula language, running totals, group summaries | Preview tab = print engine | none |
| **JasperReports** (Studio) | Outline + palette + properties, pixel layout | title, pageHeader, columnHeader, detail, columnFooter, pageFooter, summary, group bands | `$F{field}`, `$P{param}`, `$V{var}` (sum/count with reset scope) — compiled expressions | Same fill engine for preview/export; `isPrintRepeatedValues`, `isStretchWithOverflow` | file-based |
| **Telerik Reporting** | Web designer: data explorer, component tree, properties | Report/Page sections + Detail + Group sections, Table (crosstab) item | `= Fields.X`, aggregate functions `Sum(Fields.X)`, conditional formatting rules, bindings | HTML5 viewer, server renders all formats | none |
| **Zoho Invoice / Canva-style** | Template gallery → light editor; sections toggled on/off; theme colour + font picker | Fixed sections (header, items, totals, footer) — no bands | Placeholders picked from list (`%InvoiceNumber%`) | Live preview, PDF identical | “default template” + copies |

Common themes adopted: **left toolbox + data tree, centre page in mm with rulers/snap, right property panel, band model with repeating page header/footer, drag field → bound control, footer aggregates scoped to the row set, CanGrow push-down, keep-together, same engine for preview and export.**
Taken from the invoice builders: **starter gallery, one accent colour + font theme, sections that hide when empty.**

### Gap table (market feature → requirement → v1 / later)

| Market feature | Requirement | v1 |
|---|---|---|
| Toolbox + data tree left, properties right, page centre | §1 designer layout | ✅ |
| mm rulers, edge snap + guides, zoom | §1 canvas | ✅ |
| Undo/redo, multi-select, copy/paste, nudge, align/distribute | §1 editing | ✅ |
| Classic band set incl. Group H/F | §1 bands | ✅ (one detail band; nested detail = later) |
| Page header/footer on every page | §1 bands | ✅ |
| Label/Text/Field/Table/Image/Line/Box/Barcode/QR/Page n of N/Date/Rich text | §1 controls | ✅ |
| Amount in words, signature block, conditional section | §1 controls | ✅ |
| Font/colour/border/padding/bg/position props | §1 properties | ✅ |
| Format strings (date/number/currency/words) + null text | §1 properties | ✅ |
| Visibility (suppress) formulas | §1 properties | ✅ |
| Paper sizes incl. thermal, orientation, margins, watermark | §1 page setup | ✅ |
| Datasource = SP / API with typed params | §2 | ✅ SP; API endpoint ✅ (POST/GET, JSON `data`) |
| Param sources static / request / user / centre | §2 | ✅ |
| Field list from a sample run, multiple named result sets | §2 | ✅ |
| Drag field onto control / `{{path}}` tokens | §2 | ✅ |
| Calculated expressions, aggregates (sum/count/avg/min/max), conditions | §2 | ✅ |
| Same engine preview = export | §2 | ✅ (one JS engine runs in builder iframe and in server Chrome) |
| Design-time validation of bindings | §2 publish validation | ✅ client + server |
| Draft / publish / immutable versions / rollback | §3 | ✅ |
| Template library: search, duplicate, delete, export/import | §3 | ✅ |
| Starter gallery | §3 | ✅ Receipt, Bill with items, Grouped report |
| PDF via API, same response as legacy | §4 | ✅ |
| Header row repeat, no split row, no orphan total | §5 | ✅ |
| Crosstab / pivot | — | later |
| Sub-reports, nested detail bands | — | later |
| Charts | — | later |
| Conditional formatting rules (colour by value) | — | partial: expression in `style.color` later; visibility rules now |
| Running totals per page (“carried forward”) | — | later |
| Localised labels (Hindi) | §5 font | ✅ Noto Sans Devanagari embedded; translation tables = later |
| Scheduled / emailed reports | — | later |
| Per-user permissions on templates | — | partial: `PrintBuilder:EditorRoleIds` limits who edits templates/datasources (empty = any logged-in user); per-template ACL later |

---

## 3. Architecture in one picture

```
          Builder (React)                                   API (.NET)
 ┌──────────────────────────────┐                ┌───────────────────────────────┐
 │ TemplateList / Designer      │  CRUD, publish │ PrintBuilderController        │
 │  canvas renders elements via │ ─────────────► │  PrintStore (pb_* tables)     │
 │  engine.renderElement()      │                │  PrintDataService (SP/API run │
 │ Preview iframe:              │  FetchSample   │   + receipt_header + centre)  │
 │  shell + printEngine.js      │ ◄───────────── │  → data JSON                  │
 │  + template + data JSON      │                │                               │
 └──────────────────────────────┘  GeneratePdf   │  PrintRenderer:               │
                                   ───────────►  │   shell + printEngine.js      │
                                                 │   + published JSON + data     │
                                                 │   → Puppeteer page → PDF      │
                                                 │   → IMemoryCache → RenderPdf  │
                                                 └───────────────────────────────┘
```

**One template engine.** `engine/printEngine.js` is a dependency-free ES module.
It is the only code that turns *template JSON + data JSON* into pages. The
builder preview loads it into an iframe; the server loads the byte-identical
copy (`HospediaAPI/PrintBuilder/Engine/printEngine.js`) into a Puppeteer page and
prints that page. Both build the same shell (`buildShell` is in the engine), use
the same embedded fonts, and paginate by measuring the DOM in Chrome — so the
preview *is* the PDF. `engine/sync-to-api.mjs` copies engine + fonts to the API;
the API exposes the engine's SHA-256 (`PrintBuilder/EngineInfo`) and the builder
shows a warning if its own copy differs.

Why not C# HTML generation: pagination rules (repeat table header, no split row,
no orphan total, push-down of growing fields, page X of Y) need real text
measurement. Chrome is already the PDF engine, so measuring there costs nothing
and is exact; a C# engine would have to guess heights.

---

## 4. Template JSON schema (`schemaVersion: 1`)

Units: positions and sizes in **mm**, font sizes in **pt**.

```jsonc
{
  "schemaVersion": 1,
  "page": {
    "size": "A4",                 // A4 | A5 | Letter | Legal | Thermal80 | Thermal58 | Custom
    "width": 210, "height": 297,  // used for Custom; thermal height = content (roll)
    "orientation": "portrait",    // portrait | landscape
    "margins": { "top": 10, "right": 10, "bottom": 10, "left": 10 },
    "watermark": { "text": "DUPLICATE", "when": "sys.duplicate", "opacity": 0.08, "color": "#000000", "angle": -30, "size": 72 }
  },
  "theme": { "fontFamily": "Inter", "fontSize": 9, "color": "#1f2937", "accent": "#0f766e",
             "lineHeight": 1.35, "currency": "₹", "locale": "en-IN", "nullText": "" },
  "header": { "receiptHeaderType": "OPD" },   // receipt_header.HeaderType for header.* data
  "datasource": "OPD_BILL",                  // pb_datasource code (snapshotted at publish)
  "bands": [
    {
      "id": "b1", "type": "pageHeader",        // pageHeader | reportHeader | groupHeader | detail | groupFooter | reportFooter | pageFooter
      "height": 28,                            // design height, mm (grows with canGrow content)
      "dataset": "items",                      // detail only: expression → row array
      "groupBy": "CategoryName",               // groupHeader / groupFooter only (expression on the detail row)
      "printOn": "all",                        // pageHeader/pageFooter: all | first | notFirst | last
      "anchorBottom": false,                   // reportFooter: sit at the bottom of the last page
      "keepTogether": true,                    // never split this band across pages (tables still split)
      "visibleIf": "",                         // expression; false → band skipped
      "background": "",
      "elements": [ /* Element */ ]
    }
  ]
}
```

Element (common): `{ id, type, x, y, w, h, style, visibleIf, canGrow, collapse, format, nullText, locked }`

* `style`: `fontFamily, fontSize, fontWeight, italic, underline, color, background, align (left|center|right|justify), vAlign (top|middle|bottom), padding (mm), border {width, style, color, sides:"tblr"}, radius, lineHeight, letterSpacing, transform (none|upper|lower|capitalize), wrap (true|false)`
* `format`: `{ type: none|number|currency|percent|date|datetime|time|words|upper|lower, decimals, pattern, currency, prefix, suffix }`
* `canGrow`: height grows to content, everything below in the band is pushed down.
* `collapse`: when `visibleIf` is false, the space is removed (elements below move up — also when something above them grew).
* `stretch` (box, line): keep the design gap to the band's bottom edge, so a panel's border grows or shrinks with the fields inside it (Crystal's "extend to bottom of section"). A stretching element never pushes others.

| type | own props |
|---|---|
| `label` | `text` — static text, may contain `{{expr}}` tokens |
| `heading` | `text`, `level` (1–3) |
| `field` | `expr` — expression, rendered with `format` |
| `table` | `dataset`, `columns[{id, header, expr, width, align, format, footer, footerFormat}]`, `showHeader`, `showFooter`, `repeatHeader`, `zebra`, `grid` (`lines`\|`grid`\|`none`), `headerStyle`, `footerStyle`, `rowMinHeight`, `emptyText`, `filter`, `sortBy`; group rows: `groupBy` (a full-width heading row whenever it changes between consecutive rows), `groupText` (`{{group}}`), `groupStyle`; sub-lines: `subRowIf` (rows printed as one indented text line, e.g. a package's contents), `subRowText`, `subRowStyle {italic, color, fontSize, indent}` |
| `image` | `source` (`asset`\|`centreLogo`\|`expr`\|`url`), `assetKey`, `expr`, `fit` (contain\|cover\|fill) |
| `line` | `orientation` (h\|v), `thickness`, `color`, `dash` |
| `box` | border/background/radius via `style` |
| `barcode` | `expr`, `symbology` (code128), `showText` |
| `qr` | `expr`, `ecc` (L\|M\|Q\|H) |
| `pageNumber` | `text` default `Page {page} of {pages}` |
| `printDate` | `pattern` default `DD-MMM-YYYY hh:mm A`, `prefix` |
| `amountWords` | `expr`, `currencyName` (Rupees), `subunitName` (Paise), `suffix` (Only) |
| `signature` | `label`, `nameExpr`, `align` |
| `richtext` | `html` (sanitised; `{{tokens}}` allowed) or `htmlExpr` (e.g. `header.HeaderText`) |
| `section` | conditional section: `children[]` (coords relative to the section), `visibleIf`, `collapse` |

### Expressions

`{{ expr }}` inside text; bare in `expr` props. Safe parser — no `eval`.

* Literals: `12`, `'text'`, `"text"`, `true`, `false`, `null`
* Paths: `bill.PatientName`, `items[0].Rate`, `centre['CentreName']`. A key on a row **array** reads the first row (`bill.PatientName` on a 140-row set → row 0).
* Operators: `+ - * / %`, `== != < <= > >=`, `&& || !` (also `and or not`), `?:`, `??`
* Scope: inside a detail band / table row, bare names resolve against the current row first (`Qty * Rate`), then `row.*`, then the root data.
* Aggregates (evaluate their argument per row of the current row set, or of an explicit set): `sum(Amount)`, `sum(Qty * Rate, items)`, `count()`, `count(expr)`, `avg`, `min`, `max`, `first`, `last`, `distinct(expr)`.
* Functions: `if(c,a,b)`, `coalesce(a,b,…)`, `concat`, `upper`, `lower`, `trim`, `len`, `left`, `right`, `substr`, `replace`, `contains`, `round(x,d)`, `abs`, `ceil`, `floor`, `num`, `text`, `format(x,'currency'|'number:2'|'date:DD-MM-YYYY')`, `date(x,'pattern')`, `words(x)`, `now()`, `today()`, `isEmpty`, `isNull`; for prints migrated from the HIS: `inrwords(x)` (whole-rupee words exactly as `StockReport.ChangeNumericToWords` prints them), `proper(s)` (= `Util.ToTitleCase`), `fixed(x,d)` (decimals without grouping, as a raw SQL DECIMAL prints), `striptags(s)` (HTML from SQL → text, `<br>` → line break), `htmlblocks(html, preLine)` (long HTML as rows `{ Html, Index }` — one per paragraph / list item / `<br>` line, wrapper styles kept — for a detail band whose richtext prints `row.Html`, so the text runs over pages; `preLine` = plain newlines are line breaks). Number grouping follows `theme.locale` (`en-US` = .NET `"N"` on an en-US server).
* Variables: `page`, `pages`, `rowNumber` (in a table with sub-lines: main rows only), `subNumber` (sub-lines), `rowIndex`, `rows` (current row set), `group` (group key).
* Null → element `nullText` → theme `nullText`. Errors render as `#ERR` in preview and are reported by validation; nothing throws out of a render.

### Data object (what expressions see)

```jsonc
{
  "<resultSetName>": [ { … }, … ],        // every named result set of the datasource
  "params":  { "transactionId": 1181 },   // GeneratePdf params (after defaults)
  // login claims of the user who prints (PrintDataService.CurrentUser / ExtraClaims; never UserValidateID).
  // EmployeeName falls back to UserName: a token re-issued by a centre switch has no EmployeeName claim.
  "user":    { "EmployeeID", "EmployeeName", "UserName", "Email", "CentreID", "CentreName", "BookingCentreID", "RoleID", "RoleName",
               "DepartmentID", "DepartmentName", "OrganizationID", "OrganizationName", "OrganizationCurrency", "CentreCurrency",
               "Hospital_ID", "Ownership", "IsStore", "EmpLanguage", "EmpLanguageCode", "GlobalId" },
  // the printing centre (params.centreId, else the user's CentreID). Every centre image comes from center_master, read
  // from the API's Images folder — no hard-coded file: LogoUrl = HeaderImageUrl = LetterheadUrl = Images/<ReportHeaderURL>,
  // FooterLogoUrl = Images/<ReportFooterURL>. An image element with source centreLogo / letterhead / expr that comes out
  // empty shows its fallbackAssetKey instead.
  "centre":  { "CentreID", "CentreName", "Address", "MobileNo", "LandlineNo", "EmailID", "Website", "City", "State", "Country",
               "LogoUrl", "HeaderImageUrl", "LetterheadUrl", "FooterLogoUrl" },
  "header":  { "HeaderText", "FooterText" },   // receipt_header for template.header.receiptHeaderType + centre
  "assets":  { "<assetKey>": "data:image/png;base64,…" },
  "sys":     { "now", "duplicate", "templateCode", "version", "printedBy",
               "lang": { "column", "code", "dir" } },   // the print's language (§14)
  "i18n":    { "<phrase>": "<translation>" }           // label translations; absent for English (§14)
}
```
The API builds this object for both FetchSample (preview) and GeneratePdf, so the
preview's data path is the PDF's data path.

---

## 5. Pagination (engine)

1. Fonts loaded (`document.fonts.ready`), then each band instance is rendered off-screen at its real width and **measured**.
2. Flow order: reportHeader → for each detail row: groupHeaders on key change → detail → groupFooters on key change (inner first) → reportFooter.
3. Page body = page height − margins − pageHeader − pageFooter (per `printOn`).
4. Within a band, `canGrow` elements take their measured height; elements entirely below a grown/collapsed element shift by the delta (Crystal-style push-down). An element moves by the largest move of anything above it that moved, less the space collapsed elements free in between ("decreasing size"), so a hidden row closes its gap even under a table that grew. `stretch` boxes/lines then take the band's final height.
5. A band that does not fit moves to the next page (`keepTogether`). A band containing a **table** splits at row boundaries: header row repeats on every chunk, a row is never split, a group heading row never ends a page (it moves on with its first row), and the footer/total row always travels with at least one data row (no orphan total). Content below the table follows the last chunk; if it does not fit, the last row moves with it.
6. Page header/footer drawn on every page; `pageNumber` filled after pagination (`Page X of Y`). Watermark drawn per page when its `when` expression is true.
7. Thermal sizes: one page whose height is the content height (roll paper).
8. Result: `window.__PB_RESULT = { ok, pages, widthMm, heightMm, profile, paper, overflow[], errors[] }`, `window.__PB_DONE = true`. `overflow` lists what the printed pages cut off (outside the printable area, wider / taller than its box, one-line text cut).

### One master, every paper (automatic layout)

A template is designed ONCE on its master paper (`page.master`, A4 portrait for new templates; a template without one is its own master). `page.size` / `orientation` are only the default OUTPUT paper. Nothing is stored per paper: `resolveLayout(template, options.paper)` picks a profile from the **printable width** (WIDE ≥ 170 mm, COMPACT 110–169, THERMAL80 65–109, THERMAL58 < 65 — used only by the adapter) and `adaptTemplate(master, layout, recordCtx)` derives the paper's layout:

* x / width are shares of the master's printable width; side margins (10 / 8 / 3 / 2 mm) and body size (9.5 / 8.5 / 8 / 7 pt, min 7) follow the profile when it is not the master's; `page.responsive: false` keeps the master's.
* Rows: controls whose heights overlap form a row; inside it, lines; a caption + its ":" + its text value form one unit (`keepWithNext` glues more; signatures / images / tables stand alone). A row reflows when a control would be narrower than readable (from its text and font; `minWidth` overrides), when its controls overlap, or (roll) when it holds a table: units go 2 per line on COMPACT, 1 on THERMAL, column by column then top to bottom; same-width units share one scale (colons line up); on a roll a caption on its own line reads "label … value". Controls below move by what the row gained; boxes around reflowed controls wrap them; sections reflow their children. Controls hidden by the record's data leave their row first (re-adapted per record).
* Text grows and wraps, never "…"; images keep their aspect; a thermal page header stacks and centres; on THERMAL an OPTIONAL image (`priority`; a ≥ 60 % wide image is optional unless `must`; anything > 40 % goes) is dropped and the centre's name + address print instead; page numbers go on a roll.
* Tables: `priority: "optional"` columns dropped off WIDE; on THERMAL rows stack by column `role` (serial / name / qty / rate / amount / text — inferred when unset): line 1 S.No. + name, line 2 other text · … left and "qty × rate = amount" right; no name column → "label … value" lines. Column `fit: "words"` wraps between words and shrinks a word that cannot fit — in the header cell too (no "Thyroi d" on A5). A richtext contains its children's margins (`display:flow-root`), so a `<ul>` / `<p>` is measured at its printed height. A sub-line (`subRowIf`) never starts a page alone: the first one after a main row keeps that row with it (later sub-lines may still break between each other).
* Single master is enforced: `perPaperFlags` (showOn / stackOn / profileMargins) and `findDuplicates` (same content twice in a band, in different rows) are validation errors (engine and PrintValidator.cs); `toSingleMaster` converts an old per-paper template (keeps the master's copy, deletes the others, drops the flags, closes their gaps). Old flags are still read so old templates render.
* Builder: the canvas edits the master only; "View on …" shows any other paper read-only with the same shell as the PDF ("Auto layout from A4 master — edit in A4"); hints in the property panel: Priority, Keep with next, Min width; column Role, Optional.
* Expressions see `sys.profile`, `sys.paper`, `sys.orientation`, `sys.paperWidth`, `sys.contentWidth`, `sys.thermal`, `sys.roll` (data only — never for per-paper visibility).
* The API takes `?paper=A4|A5|Letter|Legal|Thermal80|Thermal58|Custom&w=&h=&orientation=` on every print action (testing; the body is untouched) and answers with `X-PrintBuilder-Profile / -Pages / -Overflow` headers.

---

## 6. API (`api/v1/PrintBuilder/*`, `[Authorize(UserValidatePolicy)]` unless noted)

| Verb | Action | Payload / query | Returns `Response.Data` |
|---|---|---|---|
| GET | `Status` | – | `{ installed, legacyTables, database, autoCreateAllowed, engineHash }` |
| GET | `Templates` | `search, category, includeDeleted` | `[{ code, name, category, status, publishedVersion, paperSize, updatedOn, … }]` |
| GET | `Template` | `code` | `{ meta…, draftRev, template (JSON string) }` |
| POST | `CreateTemplate` | `{ code, name, category, description, starter?, datasourceCode? }` | template |
| POST | `SaveTemplate` | `{ code, name, category, description, datasourceCode, template, draftRev }` | `{ draftRev }` (409-style `Success=false` on stale rev) |
| POST | `DuplicateTemplate` | `{ code, newCode, newName }` | template |
| POST | `DeleteTemplate` | `{ code }` | soft delete |
| POST | `SetTemplateCategory` (editor) | `{ code, categories: string[] }` | `{ code, category }` — only `Category` changes (comma-separated, first leads, 80 chars); refused while another user holds the edit lock |
| GET | `ExportTemplate` | `code` | `{ format:"hospedia-print-template", version:1, template:{…}, datasource:{…}, assets:[{ key, name, dataUrl }] }` — the images the template prints travel with it |
| POST | `ImportTemplate` | `{ payload, newCode?, overwrite? }` | template; missing images are restored under their original keys (never as a centre logo) |
| POST | `ValidateTemplate` | `{ template, datasourceCode }` | `{ errors[], warnings[] }` |
| POST | `PublishTemplate` | `{ code, note }` | `{ versionNo }` — blocked when validation has errors |
| GET | `Versions` | `code` | `[{ versionNo, note, publishedBy, publishedOn, isActive }]` |
| GET | `Version` | `code, versionNo` | `{ template, datasource }` |
| POST | `ActivateVersion` | `{ code, versionNo }` | rollback: that version prints |
| POST | `RestoreVersion` | `{ code, versionNo }` | copy version into draft |
| GET | `Starters` | – | `[{ id, name, description, category, template }]` |
| GET | `Datasources` / `Datasource` | `code` | list / one |
| POST | `SaveDatasource` / `DeleteDatasource` | definition | |
| GET | `Procedures` | `search` | SP names in `DATABASE()` |
| GET | `ProcedureParams` | `name` | `[{ name, type, ordinal }]` |
| POST | `FetchSample` | `{ datasourceCode? , datasource?, params, receiptHeaderType }` | `{ data, fieldSchema, ms }` |
| POST | `UploadAsset` | `{ name, dataUrl, centreId?, tag? }` | `{ assetKey }` |
| GET | `Assets` | `tag` | list |
| GET | `Asset` (AllowAnonymous, unguessable key) | `key` | image bytes |
| POST | `DeleteAsset` | `{ assetKey }` | |
| GET | `EngineInfo` | – | `{ hash, bytes }` |
| POST | **`GeneratePdf`** | `{ templateCode, params:{…}, duplicate? }` — `duplicate` may also come as `params.Duplicate` (any case, `1`/`true`) | **`{ PdfUrl }`** — identical to CommonReceiptPdf |
| POST | `PreviewPdf` | `{ template, datasourceCode, params, duplicate? }` | `{ PdfUrl }` (draft, from builder) |
| GET | `RenderPrintable` (AllowAnonymous) | `cacheKey` | HTML fallback page (§9) |

Sample:

```http
POST api/v1/PrintBuilder/GeneratePdf
{ "templateCode": "OPD_BILL", "params": { "transactionId": 1181 }, "duplicate": true }

200 { "success": true, "message": "Record Found",
      "data": { "pdfUrl": "CommonReciept_PDF/RenderPdf?cacheKey=6f0c…" } }
```

Errors (`success:false`, clear `message`): unknown template, template never published,
missing required param `transactionId`, datasource failure (SP message), render failure,
and — when a datasource query sets `requireRows` — an empty first result set
(`emptyMessage`, `{param}` placeholders: "No OPD bill found for TransactionID 99999999.").
Errors answer HTTP 200; the FE helper `printTemplate()` also puts the message at
`data.message`, where screens written for CommonReceiptPdf (HTTP 400 on failure) read it.

Migrated prints: [migrations/OPD_BILL.md](migrations/OPD_BILL.md) (CommonReceiptPdf type OPD).

Template endpoints (`PrintBuilder/<CODE>`) share `PrintTemplateEndpointAsync(code, request, notThisTemplate, duplicate, addParams, recordsOf)`; `recordsOf` splits one request into several records that print one after another in one PDF (data.`__batch`, each record with its own page numbers) — e.g. `PrintBuilder/Lab_Report` prints one report per TestID ([migrations/LAB_REPORT.md](migrations/LAB_REPORT.md)).

---

## 7. Database (MySQL, tables `pb_*`)

```sql
pb_template          (Id, TemplateCode, ActiveCode UNIQUE, Name, Category, Description, DatasourceCode,
                      PaperSize, Orientation, DraftJson LONGTEXT, DraftRev, Status, PublishedVersionNo,
                      IsDeleted, CreatedBy/On, UpdatedBy/On, DeletedBy/On)
pb_template_version  (Id, TemplateId, VersionNo, TemplateJson, DatasourceJson, Note, PublishedBy, PublishedOn,
                      UNIQUE(TemplateId, VersionNo))            -- insert-only, never updated
pb_datasource        (Id, DsCode, ActiveCode UNIQUE, Name, Kind, DefinitionJson, FieldSchemaJson,
                      SampleParamsJson, IsDeleted, audit)
pb_asset             (Id, AssetKey UNIQUE, Name, Tag, CentreID, MimeType, ByteSize, Content MEDIUMBLOB,
                      IsDeleted, CreatedBy/On)
```

* `ActiveCode` = code while live, NULL when soft-deleted → a deleted code can be reused, and live codes stay unique (MySQL allows many NULLs in a UNIQUE key).
* Published versions also snapshot the datasource definition, so editing a datasource never changes an already published print.
* No reserved words as identifiers (`MaxValue`-style trap avoided; `Key`, `Value`, `Status`-as-alias not used bare).
* Script: `HospediaAPI/PrintBuilder/Sql/pb_schema.sql` (idempotent, also seeds two datasources).
* **Bootstrap guard.** The API creates the tables itself only when the connected database name is listed in `PrintBuilder:AutoCreateSchemaDatabases` (set to `["hospedia_development"]` in `appsettings.Development.json`; empty by default). Everywhere else the Status endpoint reports "not installed" and the DBA runs the script. There is no "set up" button. If `pb_template` exists without `TemplateCode` (the reverted attempt's shape) the API refuses and says so.
* Legacy cleanup on `hospedia_production` (not run by us):
  `DROP TABLE IF EXISTS pb_template_version, pb_template, pb_datasource, pb_asset;`

---

## 8. Frontend component tree (`src/components/DynamicPrintbuilder/`)

```
Index.jsx                 /print-builder → TemplateList
DesignerRoute.jsx         /print-builder/:code → Designer
engine/printEngine.js     THE engine (shared with API)  ·  engine/fonts/*.woff2  ·  engine/sync-to-api.mjs
model/defaults.js         page sizes, band + element factories, toolbox catalogue
model/useDesigner.js      reducer: template, selection, history (undo/redo), clipboard
list/TemplateList.jsx     search, new (blank/starter), duplicate, delete, export/import
list/NewTemplateDialog.jsx
designer/Designer.jsx     shell + keyboard
designer/TopBar.jsx       page setup, undo/redo, zoom, preview, save, publish, versions
designer/LeftPanel.jsx    Toolbox · Data tree (drag fields) · Outline
designer/Canvas.jsx       page in mm, rulers, bands, drag/resize, marquee, guides
designer/ElementBox.jsx   one element: engine-rendered content + handles
designer/PropertyPanel.jsx · TableColumnsEditor.jsx · ExprInput.jsx (autocomplete)
designer/PageSetupDialog.jsx · PreviewDialog.jsx · PublishDialog.jsx · VersionsDialog.jsx · DatasourceDialog.jsx
ui/Tap.jsx · ui/Field.jsx · ui/Icon.jsx
styles/printBuilder.css   scoped under .pbx
networkServices/printBuilderApi.js   (one service file)
```

---

## 9. PDF engine decision and the production Chrome problem

Decision: **headless Chrome via the existing `PuppeteerBrowserProvider`** (same as every other print), page loaded with the engine shell, `page.PdfAsync` with `PreferCSSPageSize`, zero Puppeteer margins (the engine owns margins), PDF cached under a GUID and served by the existing `CommonReciept_PDF/RenderPdf`.

Production cannot download Chrome (`BrowserFetcher` → no outbound access). Fix, in order of preference:
1. Install Chrome/Chromium on the host (`apt install chromium` / `google-chrome-stable`) — `PuppeteerBrowserProvider` already prefers an installed browser.
2. Or set `Puppeteer:ExecutablePath` to a pre-seeded Chrome-for-Testing folder copied onto the server.

Fallback (on by default, `PrintBuilder:HtmlFallback`): if the browser cannot start, GeneratePdf still returns `Success=true` with `Data.PdfUrl = "PrintBuilder/RenderPrintable?cacheKey=…"` and `Data.Format = "html"`, `Message` naming the cause. That URL serves the same shell (engine + data) that the PDF would have printed; it paginates in the user's browser and opens the print dialog. Existing FE code (`RedirectURL(pdfUrl)`) opens it unchanged. Nothing silently depends on Chrome: the log and the Message say which path was taken.

---

## 10. Revert

FE: delete `src/components/DynamicPrintbuilder/`, `src/networkServices/printBuilderApi.js`, the `PrintBuilder*` block in `apiEndpoints.js`, the two routes + two `getAllUrls` lines in `RenderRoute.jsx`.
API: delete `HospediaAPI/PrintBuilder/`, the `AddPrintBuilder()` line + using in `Program.cs`, the `PrintBuilder` items in `HospediaAPI.csproj`, the `PrintBuilder` section in `appsettings.Development.json`.
DB (dev): `DROP TABLE IF EXISTS pb_template_version, pb_template, pb_datasource, pb_asset;`

---

## 11. Engine 1.2 additions (2026-10-14)

Template JSON (all optional, older templates print unchanged):

| Where | Property | What it does |
|---|---|---|
| element | `styleRules: [{ when, color, background, bold, italic, underline, strike, stop }]` | Colour rules. Every rule whose `when` holds adds its look, in order; `stop` ends at the first match. `value` = the element's own value. |
| table | `rowRules: [...]` | Same rules, colour every cell of a matching row (row fields by name). |
| table column | `styleRules: [...]` | Per cell; `value` = the cell's value. |
| barcode | `symbology`: `code128` (default) · `code39` · `ean13` · `ean8` · `upca` · `itf` · `datamatrix` | EAN/UPC add the check digit; Data Matrix ECC 200 square 10×10…26×26 (44 chars). Checked by decoding every symbology back with zxing. |
| band (not page bands) | `pageBreakBefore`, `pageBreakAfter` | New page before / after the band. A group header's first group stays put. Ignored on thermal rolls. |
| band (not page / detail bands) | `keepWithNext` | "Keep with next": the band never ends a page alone; it moves to the next page with the band after it. Chains follow (A→B→C move as one); a chain taller than a page breaks where it must. Same rule on every paper. Used by REPRINT_IPD_ADMISSION to keep its three advance-received bands together. |
| page header/footer | `printOn`: `all` · `first` · `notFirst` · `last` | (already in 1.1) |
| template | `copies: [{ label, when }]` | The whole document once per copy in one PDF, own page numbers; `sys.copy`, `sys.copyIndex`, `sys.copies`. |
| template | `labels: { enabled, width, height, gapX, gapY, columns, rows, skip, countExpr, outline, stock }` | Label sheets: the detail band is one label, laid across then down; `countExpr` (e.g. `Qty`) labels per row; `skip` blank positions on a part-used sheet; `labelNumber` var. Page/report bands do not print. Stocks: `LABEL_STOCKS`. |
| theme | `translate` (on unless `false`) | Static text (label/heading text, column headers, signature captions) is rewritten from `data.i18n`, which the API fills from `Country_langauge_master` for the print's language (§14; the column name is checked against information_schema). On for every template since 2026-10-26; `translate: false` opts the template out, and an element opts out with `translate: false`. |
| theme | `presets: { name: style }` | The template's own style presets (built-ins in PropertyPanel `BUILTIN_PRESETS`). |
| datasource | `sampleLookup: { proc, args, limit }` | Builder only: `PrintBuilder/SampleLookup` runs it with `search`; result columns named like parameters fill the sample parameters ("Find a record"). |

Designer: format painter (Ctrl+Alt+C / Ctrl+Alt+V, also on the element panel), style presets, keyboard shortcut sheet (`?`), record picker + recent samples in the Data tab, template card thumbnails, label-size guide on the detail band.

---

## 12. API 1.3 additions (2026-10-14)

Template JSON (optional): `reprint: { requireReason, keyParam, maxReprints }` · `security: { passwordExpr, allowPrint, allowCopy, allowModify, sign, pdfa }` (engine puts the password at `__PB_RESULT.security.userPassword`; PDFsharp 6.1.1 encrypts AES-128 — it has no signing or PDF/A, those only add a note to `message`) · element `subreport: { templateCode, params: { p: "params.x" | "user.x" | "centre.x" | "sys.x" | literal }, useParentData }`.
Datasource: `calculated: [{ set, name, expr }]` → `data.__calc` (engine evaluates; names join `fieldSchema.sets[set]`, or `rootFields` when `set` is empty) · `aliases` · param `options: [{ value, label }]` / `optionsProc` + `optionsArgs`.
Data object adds `sys.printCount, reprintCount, reprintReason, variant, gst` and `__sub: { CODE: { template, data? } }` (published sub-reports, ≤ 10, depth 2, no cycles; their images merged into `assets`). Batch: `{ __batch: [record roots without assets], user, centre, header, assets, i18n, sys }`.

| Verb | Action | Payload / query | Returns `Response.Data` |
|---|---|---|---|
| POST | `GeneratePdf` (+ `CommonReceiptPdf`, `GetDirectGRNReport`) | as before; new envelope keys `reason`, `source` (never datasource params) | unchanged; variant resolved, print rights + reprint rules enforced, one `pb_print_log` row |
| GET | `Variants` | `code` | `[{ id, templateCode, variantCode, centreId, matchParam, matchValue, priority, note, isActive, … }]` |
| POST | `SaveVariant` / `DeleteVariant` | `{ id?, templateCode, variantCode, centreId?, matchParam?, matchValue? (csv), priority, note, isActive }` / `{ id }` | `{ id }` / – (no chains, centre or param required) |
| GET | `ResolveVariant` | `code, centreId, params` (JSON) | `{ templateCode, variantId, matched: centre\|param\|both\|null }` |
| GET | `TemplateAccess` | `code` | `{ editorRoleIds[], editorEmployeeIds[], printRoleIds[], owner, canEdit, canPrint }` |
| POST | `SaveTemplateAccess` | `{ code, editorRoleIds, editorEmployeeIds, printRoleIds }` | – (caller must canEdit) |
| GET | `Roles` / `Employees` (editor) | – / `search` | `[{ id, name }]` (f_rolemaster / employee_master, ≤ 30) |
| POST | `LockTemplate` / `UnlockTemplate` | `{ code, force }` / `{ code }` | `{ mine, lockedBy, lockedByName, since, heartbeatOn }` (stale after 3 min; no table → `mine:true`) |
| GET | `Blocks` | `search, category` | `[{ code, name, category, description, width, height, elements (JSON), updatedBy, updatedOn }]` |
| POST | `SaveBlock` / `DeleteBlock` (editor) | `{ code, name, category, description, width, height, elements }` / `{ code }` | `{ code }` / – (soft delete) |
| GET | `ParamOptions` | `datasourceCode, param` | `[{ value, label }]` (≤ 500) |
| POST | `GenerateBatchPdf` | `{ templateCode, paramsList[], batchSearch?, duplicate?, reason?, source? }` | `{ pdfUrl, format, count, failed:[{ index, message }] }` (≤ `PrintBuilder:BatchMax` 300) |
| POST | `GenerateExport` / `PreviewExport` | `{ templateCode, params, format: xlsx\|docx\|png, duplicate? }` / `{ template, datasourceCode, params, format, code? }` | `{ fileUrl: "PrintBuilder/RenderFile?cacheKey=pbfile-…", fileName, format }` |
| GET | `RenderFile` (AllowAnonymous) | `cacheKey` | file bytes, attachment `<CODE>_<yyyyMMdd_HHmm>.<ext>` |
| GET | `WhereUsed` | `code` | `{ receiptTypes[], variants[], variantOf[], subreportIn[], sources:[{ source, prints, lastOn }] }` |

`Template` and each `Templates` item gain `canEdit`. `Status` adds `featureTables`, `missingFeatureTables`. Rights: canEdit = editor role AND (no editor lists, or role / employee listed, or creator, or `PrintBuilder:AdminRoleIds`); canPrint = no print roles, or role listed, or admin. Config: `PrintBuilder:AdminRoleIds`, `BatchMax`, `PublicBaseUrl`, `Security:OwnerPassword`, `Signing:PfxPath` (not usable with PDFsharp 6.1.1).

| Table | Columns |
|---|---|
| `pb_print_log` | Id, TemplateCode, VersionNo, VariantOf, RecordKey, ParamsJson (≤ 4000), IsDuplicate, Reason, PrintKind, OutputFormat, Pages, DurationMs, Succeeded, ErrorText, PaperProfile, SourcePage, EmployeeID/Name, CentreID, PrintedOn |
| `pb_template_variant` | Id, TemplateCode, VariantCode, CentreID, MatchParam, MatchValue (csv), Priority, Note, IsActive, audit |
| `pb_template_acl` | TemplateCode PK, EditorRoleIds, EditorEmployeeIds, PrintRoleIds, UpdatedBy/On |
| `pb_template_lock` | TemplateCode PK, EmployeeID, EmployeeName, LockedOn, HeartbeatOn |
| `pb_block` | Id, BlockCode, ActiveCode UNIQUE, Name, Category, Description, WidthMm, HeightMm, ElementsJson, IsDeleted, audit |

Feature tables are optional: "installed" still means the four core tables. A missing feature table reads empty and refuses writes with "…table pb_xxx is missing — ask a DBA to run PrintBuilder/Sql/pb_schema.sql again"; printing never fails on `pb_print_log`. On an AutoCreate database the script re-runs once when one is missing. Upgrade script with only these five: `D:\Mayank Data\GitLab\pb_upgrade_v13.sql`.
FE (`printBuilderApi.js`): `printTemplate(code, params, duplicate, { reason, direct })`, `printTemplateBatch`, `exportTemplate`, `pbPreviewExport`, `pbFileUrl`, `pbWhereUsed`, `pbVariants` / `pbSaveVariant` / `pbDeleteVariant` / `pbResolveVariant`, `pbTemplateAccess` / `pbSaveTemplateAccess` / `pbRoles` / `pbEmployees`, `pbLockTemplate` / `pbUnlockTemplate`, `pbBlocks` / `pbSaveBlock` / `pbDeleteBlock`, `pbParamOptions`. The calling page travels as body `source` (makeApiRequest cannot add headers); the API also reads `X-Print-Source` / `Referer`.


---

## 13. Engine 1.3 and designer additions (2026-10-14)

Template JSON (all optional; 1.2 templates print unchanged):

| Where | Property | What it does |
|---|---|---|
| expressions | `pageSum(x)`, `broughtForward(x)`, `carriedForward(x)`; vars `pageRows`, `broughtRows`, `carriedRows` | Page and running totals over the detail rows (or, without a detail band, the table rows) printed on this page / before it / up to its end. |
| expressions | `between(x, lo, hi)`, `pad(x, w, c)`; var `parent` | Range check (lab flags); padding; a table inside a detail band sees that band's row as `parent` (nested detail: `filter: ParentID == parent.ID`). |
| page header/footer | `printOn`: + `notLast` · `odd` · `even` | Carried-forward footers; odd / even page bands. |
| page | `mirrorMargins` | Even pages swap left / right margins. |
| theme | `direction: "rtl"` | Mirrored layout, left/right alignment swapped, tables right to left. Unset = auto: right to left when `sys.lang.dir` is `rtl` (§14); `"ltr"` forces left to right. |
| element `chart` | `chartType` bar·hbar·line·area·pie·donut, `dataset`, `filter`, `labelExpr`, `valueExpr` or `series[{label,expr,color}]`, `agg`, `sortBy`, `limit`, `othersLabel`, `stacked`, `colors`, `valueFormat`, `title`, `showValues/Legend/Grid`, `hole`, `centerText` | SVG in the element's own mm. |
| element `crosstab` | `dataset`, `rowExpr`, `colExpr`, `valueExpr`, `agg`, `rowHeader`, `rowTotals`, `colTotals`, `totalLabel`, `colSort`, `rowSort`, `maxCols`, `firstColWidth`, `format`, table look props | Built as a table, so it paginates like one (header repeats, no orphan total). |
| element `subreport` | `templateCode`, `params {sub: "params.x" \| literal}`, `useParentData`, `inheritTheme`, `emptyText` | Another published template's report/group/detail bands inside the box; each sub band is a row the paginator can cut between. Data: `data.__sub[code] = {template, data}` (API). |
| template | `security {passwordExpr, allowPrint, allowCopy, allowModify, sign, pdfa}` | Engine evaluates the password into `__PB_RESULT.security`; the API encrypts (signing / PDF-A need a newer PDFsharp). |
| template | `reprint {requireReason, keyParam, maxReprints}` | API: duplicate needs a reason; `sys.printCount`, `sys.reprintCount`, `sys.reprintReason`. |
| template | `designOverlay {assetKey, opacity, dx, dy, scale, blend, visible}` | Designer only: the old print under the canvas. Never printed. |
| section | `blockCode` | A linked block: "Update" reloads it from the library. |
| datasource | `calculated [{set, name, expr}]`, `aliases {"set.Field": "Label"}`, params `options` / `optionsProc` | Calculated fields (engine `applyCalculated`, data `__calc`), friendly names, parameter dropdowns. |
| data | `__batch: [record…]` | Batch print: each record one after another, own page numbers, `sys.batchIndex/batchCount`. |
| shell option | `export: true` | `window.__PB_EXPORT = exportData()` — sheets for Excel (Summary, Detail, one per table / crosstab). |

Designer: Blocks tab (built-in letterhead, patient header, vitals, Rx, lab results with flags, GST/VAT summary, amount summary, payments, signatures, carried forward; save a selection as a block), chart / crosstab / sub-report / page-total tools, expression builder (ƒ in every expression box), canvas hover = value + source procedure, empty-band hints, old-print overlay (image / PDF page / the old API's PDF), one-click fixes in Publish, version compare (change list + side-by-side / difference overlay), autosave every 30 s with an edit lock, first-run tour, Manage section (access, variants, where used, compare with the old print, batch print), Preview exports (Excel and images in the browser, Word from the server). `printTemplate` asks for a reprint reason itself when a template requires one.

Starters added: lab report, prescription (A5), discharge summary, sample labels (3 × 8), MIS revenue (charts + crosstab + carried forward).

Engine checks (headless Chrome, scratchpad `e2e13_gen.mjs`): carried / brought forward and page sums add up to the grand total over 3 pages; odd-page footer and mirrored margins; RTL mirror; nested detail via `parent`; sub-report with its own data; crosstab and charts; batch of 3 with own page numbers; Excel export sheets; password from an expression. 1.2 cases (copies, labels, barcodes) unchanged.

## 14. Output in the application language (2026-10-26)

Every Print Builder output follows the language the user picked in the header (or the profile drawer), from the next preview or print — no re-login, reload or per-language copy of a template.

* **One resolver** — `PrintDataService.ResolveLanguageAsync`, used by every print path (GeneratePdf, CommonReceiptPdf, each `PrintBuilder/<TemplateCode>` endpoint through `PreparePublishedAsync`, GenerateBatchPdf, GenerateExport, PreviewPdf, PreviewExport, FetchSample): the request's `lang` (body `lang`, else `?lang=`, else header `X-Print-Lang`) when it is a `Country_langauge_master` column or the `master_application_language.key_code` of one → else `employee_master.EmpLanguage` → else English. Only a column name returned by information_schema reaches SQL. Once per request (a batch resolves it once).
* **FE** — `networkServices/printLanguage.js`: `printLanguage()` = `userData.empLanguage`; `makeApiRequest` adds `lang=` to every `PrintBuilder/` URL that names none, so every caller (printBuilderApi, BillingsApi, InventoryApi…) and every future template endpoint carries it.
* **English prints as designed** — no `i18n` is sent when the language is English. Other languages read only their own column: a phrase with no translation keeps its designed text (no fall back to the English column or FIELDNAME).
* **Default on** — `theme.translate` is on unless `false` (engine `translateText`, API `TemplateTranslates`); the designer toggle shows it on. 26 of the 27 published templates had no value and now translate.
* **Phrases** — what the engine translates: label / heading `text` (unless the element sets `translate: false`), signature `label` (none = "Authorised Signatory"), `columns[].header`; split around `{{bindings}}`, parts with a letter only; "Bill No :" is also looked up as "Bill No". Field values, amounts in words and month names are never translated.
* **Direction** — `sys.lang = { column, code, dir }`; `dir` is `rtl` for Arabic, Urdu, Persian, Hebrew… (by code or column). `withLanguageDirection` mirrors a template that sets no `theme.direction`; the designer's Direction is Auto / Left → right / Right → left, and an explicit one wins.
* **Fonts** — Noto Sans Arabic, Khmer and Lao (400 / 700, fontsource 5.3.0 subsets, OFL) join Devanagari and Gurmukhi in every font stack and in `FONT_FILES`; the shell force-loads every face before measuring. Covers the 11 active languages: Afrikaans, Bahasa, English, French, German, Spanish, Turkish (Latin), Arabic, Hindi, Khmer, Lao.
* **Coverage** — FetchSample and PreviewPdf (never a real print) answer `translation: { language, code, total, translated, missing[] }`. The designer's status bar, its preview and the list's eye preview show "Hindi: 18/22 translated, 4 missing"; the chip lists the missing labels and copies them as CSV (`FIELDNAME, English, <language>`). Nothing is written to `Country_langauge_master`.
* **Previews** — designer preview, paper view and the list's eye preview print in the app language and re-fetch on i18n `languageChanged`; a Language select previews any other. The design canvas keeps the designed text (it drops `data.i18n`). Without sample data the labels are still translated (FetchSample with an empty definition, images and sub-reports stripped).
