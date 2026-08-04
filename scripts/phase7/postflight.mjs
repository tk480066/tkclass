function parseCliArgs(argv = process.argv.slice(2)) {
  const result = { _: [] };
  for (const arg of argv) {
    if (!arg.startsWith("--")) {
      result._.push(arg);
      continue;
    }
    const [rawKey, ...parts] = arg.slice(2).split("=");
    const key = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    result[key] = parts.length ? parts.join("=") : true;
  }
  return result;
}

function printHeading(title) {
  console.log(`\n=== ${title} ===`);
}

const args = parseCliArgs();
const rawUrl = String(args.url || process.env.NEXT_PUBLIC_SITE_URL || "").trim();
const bypassToken = String(
  args.bypassToken || process.env.VERCEL_AUTOMATION_BYPASS_SECRET || "",
).trim();

function normalizeBaseUrl(input) {
  if (!input) {
    throw new Error(
      "กรุณาระบุ URL จริงด้วย --url=https://... หรือกำหนด NEXT_PUBLIC_SITE_URL",
    );
  }

  if (/YOUR[-_](PREVIEW[-_]URL|PRODUCTION[-_]DOMAIN)/i.test(input)) {
    throw new Error(
      "พบข้อความตัวอย่าง YOUR-PREVIEW-URL หรือ YOUR-PRODUCTION-DOMAIN กรุณาแทนด้วย URL จริงจาก Vercel",
    );
  }

  let parsed;
  try {
    parsed = new URL(input);
  } catch {
    throw new Error(`URL ไม่ถูกต้อง: ${input}`);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("รองรับเฉพาะ URL ที่ขึ้นต้นด้วย http:// หรือ https://");
  }

  if (!parsed.hostname || parsed.hostname.includes("YOUR-")) {
    throw new Error(`Hostname ไม่ถูกต้อง: ${parsed.hostname || input}`);
  }

  parsed.pathname = parsed.pathname.replace(/\/$/, "");
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "");
}

let baseUrl;
try {
  baseUrl = normalizeBaseUrl(rawUrl);
} catch (error) {
  console.error(`❌ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
const failures = [];
const requestHeaders = {
  Accept: "application/json,text/html;q=0.9,*/*;q=0.8",
  "User-Agent": "TK-Mooc-Phase7-Postflight/7.0.3",
};

if (bypassToken) {
  requestHeaders["x-vercel-protection-bypass"] = bypassToken;
  requestHeaders["x-vercel-set-bypass-cookie"] = "true";
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    return await fetch(url, {
      redirect: "follow",
      cache: "no-store",
      ...options,
      headers: { ...requestHeaders, ...(options.headers || {}) },
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`หมดเวลารอการตอบกลับจาก ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function check(name, action) {
  try {
    const detail = await action();
    console.log(`✅ ${name}: ${detail}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${name}: ${message}`);
    console.log(`❌ ${name}: ${message}`);
  }
}

async function expectPage(pathname) {
  const url = `${baseUrl}${pathname}`;
  const response = await fetchWithTimeout(url, {
    headers: { Accept: "text/html,application/xhtml+xml" },
  });

  if (!response.ok) {
    const body = (await response.text()).slice(0, 240).replace(/\s+/g, " ");
    const protectionHint = [401, 403].includes(response.status)
      ? " — Preview อาจเปิด Deployment Protection; กำหนด VERCEL_AUTOMATION_BYPASS_SECRET หรือใช้ --bypass-token"
      : "";
    throw new Error(`HTTP ${response.status}${protectionHint}${body ? ` | ${body}` : ""}`);
  }

  return `HTTP ${response.status}`;
}

printHeading("TK Mooc Phase 7 postflight");
console.log(`Target: ${baseUrl}`);
console.log(`Protection bypass: ${bypassToken ? "enabled" : "not set"}\n`);

await check("Home page", () => expectPage(""));
await check("Login page", () => expectPage("/login"));
await check("Health endpoint", async () => {
  const url = `${baseUrl}/api/health`;
  const response = await fetchWithTimeout(url, {
    headers: { Accept: "application/json" },
  });
  const contentType = response.headers.get("content-type") || "";
  const rawBody = await response.text();

  if (!contentType.includes("application/json")) {
    const preview = rawBody.slice(0, 260).replace(/\s+/g, " ");
    const protectionHint = [401, 403].includes(response.status)
      ? " Preview อาจเปิด Deployment Protection; ใช้ bypass token"
      : "";
    throw new Error(
      `คาดว่าจะได้ JSON แต่ได้รับ ${contentType || "unknown content-type"} (HTTP ${response.status}).${protectionHint}${preview ? ` | ${preview}` : ""}`,
    );
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    throw new Error(`Health endpoint ส่ง JSON ไม่สมบูรณ์: ${rawBody.slice(0, 260)}`);
  }

  if (!response.ok || !body.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
  }

  return `schema=${body.database?.schema_version ?? "unknown"}, maintenance=${body.database?.maintenance_mode ?? "unknown"}`;
});

const teacherEmail = process.env.E2E_TEACHER_EMAIL;
const teacherPassword = process.env.E2E_TEACHER_PASSWORD;
if (teacherEmail && teacherPassword) {
  await check("Teacher login", async () => {
    const { createPublicSupabase } = await import("./_shared.mjs");
    const supabase = createPublicSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: teacherEmail,
      password: teacherPassword,
    });
    if (error || !data.user) throw new Error(error?.message ?? "No user returned");
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role,status")
      .eq("id", data.user.id)
      .single();
    if (profileError || profile?.role !== "teacher" || profile.status !== "active") {
      throw new Error(profileError?.message ?? "Teacher profile invalid");
    }
    await supabase.auth.signOut();
    return teacherEmail;
  });
} else {
  console.log(
    "⚠️ Teacher login: skipped; set E2E_TEACHER_EMAIL and E2E_TEACHER_PASSWORD",
  );
}

if (failures.length) {
  console.error(`\nPostflight failed (${failures.length})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("\nPostflight passed.");
}
