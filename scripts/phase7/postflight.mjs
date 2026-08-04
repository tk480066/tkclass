import { createPublicSupabase, parseCliArgs, printHeading } from "./_shared.mjs";

const args = parseCliArgs();
const baseUrl = String(args.url || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
if (!baseUrl) throw new Error("Provide --url=https://... or NEXT_PUBLIC_SITE_URL");
const failures = [];

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

printHeading("Production smoke test");
await check("Home page", async () => {
  const response = await fetch(baseUrl, { redirect: "manual" });
  if (response.status >= 500) throw new Error(`HTTP ${response.status}`);
  return `HTTP ${response.status}`;
});
await check("Login page", async () => {
  const response = await fetch(`${baseUrl}/login`, { redirect: "manual" });
  if (response.status >= 500) throw new Error(`HTTP ${response.status}`);
  return `HTTP ${response.status}`;
});
await check("Health endpoint", async () => {
  const response = await fetch(`${baseUrl}/api/health`, { cache: "no-store" });
  const body = await response.json();
  if (!response.ok || !body.ok) throw new Error(JSON.stringify(body));
  return `schema=${body.database?.schema_version ?? "unknown"}, maintenance=${body.database?.maintenance_mode ?? "unknown"}`;
});

const teacherEmail = process.env.E2E_TEACHER_EMAIL;
const teacherPassword = process.env.E2E_TEACHER_PASSWORD;
if (teacherEmail && teacherPassword) {
  await check("Teacher login", async () => {
    const supabase = createPublicSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: teacherEmail, password: teacherPassword });
    if (error || !data.user) throw new Error(error?.message ?? "No user returned");
    const { data: profile, error: profileError } = await supabase.from("profiles").select("role,status").eq("id", data.user.id).single();
    if (profileError || profile?.role !== "teacher" || profile.status !== "active") throw new Error(profileError?.message ?? "Teacher profile invalid");
    await supabase.auth.signOut();
    return teacherEmail;
  });
} else {
  console.log("⚠️ Teacher login: skipped; set E2E_TEACHER_EMAIL and E2E_TEACHER_PASSWORD");
}

if (failures.length) {
  console.error(`\nPostflight failed (${failures.length})`);
  process.exitCode = 1;
} else {
  console.log("\nProduction smoke test passed.");
}
