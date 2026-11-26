/**
 * Copies the print engine to the API so the server prints with the same code
 * the builder previews with.
 *
 *   node src/components/DynamicPrintbuilder/engine/sync-to-api.mjs [path/to/HospediaAPI]
 *
 * Default target: ../../hospediav12-api/HospediaAPI next to this repo's parent
 * (D:\Mayank Data\GitLab\hospediav12-api\HospediaAPI on the dev machines).
 * Writes PrintBuilder/Engine/{printEngine.js, vendor/qrcode.js, fonts/*} and
 * prints the engine hash — the builder compares it with PrintBuilder/EngineInfo.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../../..");
const api = path.resolve(process.argv[2] || path.join(repoRoot, "../../hospediav12-api/HospediaAPI"));
if (!fs.existsSync(path.join(api, "HospediaAPI.csproj"))) {
  console.error(`No HospediaAPI.csproj in ${api} — pass the API project folder as the first argument.`);
  process.exit(1);
}
const dest = path.join(api, "PrintBuilder", "Engine");
const copy = (rel) => {
  const from = path.join(here, rel);
  const to = path.join(dest, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
};

copy("printEngine.js");
copy("vendor/qrcode.js");
for (const f of fs.readdirSync(path.join(here, "fonts"))) copy(path.join("fonts", f));

const text = fs.readFileSync(path.join(here, "printEngine.js"), "utf8").replace(/\r\n/g, "\n");
const hash = createHash("sha256").update(text, "utf8").digest("hex");
console.log(`Engine copied to ${dest}\nsha256 ${hash}`);
