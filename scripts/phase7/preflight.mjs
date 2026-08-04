import { createAdminSupabase, getSupabaseConfig, maskSecret, printHeading } from "./_shared.mjs";

const checks = [];
function record(name, ok, detail, severity = "error") {
  checks.push({ name, ok, detail, severity });
  console.log(`${ok ? "✅" : severity === "warning" ? "⚠️" : "❌"} ${name}: ${detail}`);
}

printHeading("Environment variables");
let config;
try {
  config = getSupabaseConfig();
  record("NEXT_PUBLIC_SUPABASE_URL", /^https:\/\/.+\.supabase\.co$/.test(config.url), config.url);
  record("Publishable key", Boolean(config.publishableKey), maskSecret(config.publishableKey));
  record("Secret key", Boolean(config.secretKey), maskSecret(config.secretKey));
  record("Secret key exposure", !process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY, "SUPABASE secret is not NEXT_PUBLIC");
} catch (error) {
  record("Environment", false, error instanceof Error ? error.message : String(error));
}

if (config) {
  printHeading("Supabase database and RLS");
  try {
    const supabase = createAdminSupabase();
    const { data, error } = await supabase.rpc("phase7_preflight");
    if (error) throw error;
    record("Required tables", data.missing_tables.length === 0, data.missing_tables.length ? `Missing: ${data.missing_tables.join(", ")}` : "All required tables exist");
    record("RLS", data.rls_disabled.length === 0, data.rls_disabled.length ? `Disabled: ${data.rls_disabled.join(", ")}` : "RLS enabled on required tables");
    record("Storage buckets", data.missing_buckets.length === 0, data.missing_buckets.length ? `Missing: ${data.missing_buckets.join(", ")}` : "All required buckets exist");
    record("Accounts", Number(data.teacher_count) > 0 && Number(data.student_count) > 0, `teachers=${data.teacher_count}, students=${data.student_count}`, "warning");
    record("Classes", Number(data.class_count) > 0, `classes=${data.class_count}`, "warning");
  } catch (error) {
    record("Phase 7 RPC", false, error instanceof Error ? error.message : String(error));
  }

  printHeading("Auth admin access");
  try {
    const supabase = createAdminSupabase();
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) throw error;
    record("Admin API", true, `Connected; sample users=${data.users.length}`);
  } catch (error) {
    record("Admin API", false, error instanceof Error ? error.message : String(error));
  }
}

const failures = checks.filter((check) => !check.ok && check.severity === "error");
const warnings = checks.filter((check) => !check.ok && check.severity === "warning");
printHeading("Summary");
console.log(`Passed: ${checks.length - failures.length - warnings.length}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Failures: ${failures.length}`);
if (failures.length) process.exitCode = 1;
