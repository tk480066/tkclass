const arg = process.argv.find((v) => v.startsWith("--url="));
const raw = arg?.slice(6) || process.env.NEXT_PUBLIC_SITE_URL;
if (!raw || /YOUR-|example\./i.test(raw)) throw new Error("กรุณาระบุ URL Production จริงด้วย --url=https://...");
const base = new URL(raw); base.pathname = "/"; base.search = "";
const routes = ["/", "/login", "/api/health"];
let failed = false;
for (const route of routes) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(new URL(route, base), { redirect: "follow", signal: controller.signal });
    const ok = response.status >= 200 && response.status < 400;
    console.log(`${ok ? "✅" : "❌"} ${route} HTTP ${response.status}`);
    if (!ok) failed = true;
    if (route === "/api/health" && ok) {
      const text = await response.text();
      try { const json = JSON.parse(text); if (!json.ok) failed = true; }
      catch { console.error("❌ /api/health ไม่ได้ส่ง JSON"); failed = true; }
    }
  } catch (error) { console.error(`❌ ${route}: ${error.message}`); failed = true; }
  finally { clearTimeout(timer); }
}
if (base.protocol !== "https:") { console.error("❌ Production ต้องใช้ HTTPS"); failed = true; }
else console.log("✅ HTTPS");
if (failed) process.exit(1);
console.log("Production audit passed");
