import fs from "node:fs";
import path from "node:path";

const packagePath = path.resolve(process.cwd(), "package.json");
if (!fs.existsSync(packagePath)) throw new Error(`package.json not found at ${packagePath}`);
const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
pkg.scripts ??= {};
Object.assign(pkg.scripts, {
  "phase7:create-admin": "node --env-file=.env.local scripts/phase7/create-admin.mjs",
  "phase7:preflight": "node --env-file=.env.local scripts/phase7/preflight.mjs",
  "phase7:backup": "node --env-file=.env.local scripts/phase7/backup.mjs",
  "phase7:import": "node --env-file=.env.local scripts/phase7/import-csv.mjs",
  "phase7:maintenance": "node --env-file=.env.local scripts/phase7/set-maintenance.mjs",
  "phase7:postflight": "node --env-file=.env.local scripts/phase7/postflight.mjs"
});
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log("Phase 7 scripts added to package.json");
