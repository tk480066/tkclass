import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cssPath = path.join(root, "app", "globals.css");
const pagePath = path.join(root, "app", "page.tsx");
const failures = [];
const css = fs.readFileSync(cssPath, "utf8");
const page = fs.readFileSync(pagePath, "utf8");

const rules = [
  [/@media\s*\(max-width:\s*(760|768)px\)/, "Mobile breakpoint 760/768px"],
  [/@media\s*\(max-width:\s*(900|1040|1050)px\)/, "Tablet breakpoint"],
  [/overflow-x:\s*(auto|clip|hidden)/, "Horizontal overflow protection"],
  [/grid-template-columns/, "Responsive grid definitions"],
  [/clamp\(/, "Fluid sizing with clamp()"],
];
for (const [pattern, label] of rules) {
  if (!pattern.test(css)) failures.push(label);
  else console.log(`✅ ${label}`);
}
if (!/site-page|homepage/i.test(page)) failures.push("Homepage structure");
else console.log("✅ Homepage structure found");

const files = ["app/admin/page.tsx", "app/admin/content/homepage/page.tsx", "app/admin/content/sections/page.tsx"];
for (const rel of files) {
  if (!fs.existsSync(path.join(root, rel))) failures.push(`Missing ${rel}`);
  else console.log(`✅ ${rel}`);
}
if (failures.length) {
  console.error("\n❌ Responsive static audit failed:");
  failures.forEach((x) => console.error(`- ${x}`));
  process.exit(1);
}
console.log("\nResponsive static audit passed. ตรวจด้วย Browser DevTools ที่ 360, 390, 768, 1024 และ 1440px เพิ่มเติม");
