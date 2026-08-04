import { createClient } from "@/lib/supabase/server";

export type LaunchSetting = {
  setting_key: string;
  setting_value: unknown;
  description: string | null;
  is_public: boolean;
  updated_at: string;
};

export type DeploymentCheck = {
  id: string;
  environment: "local" | "preview" | "staging" | "production";
  check_key: string;
  check_label: string;
  status: "pending" | "passed" | "warning" | "failed" | "skipped";
  details: Record<string, unknown>;
  checked_at: string | null;
};

export async function getPhase7LaunchDashboard() {
  const supabase = await createClient();
  const [settingsResult, checksResult, runsResult, preflightResult] = await Promise.all([
    supabase.from("system_settings").select("setting_key,setting_value,description,is_public,updated_at").order("setting_key"),
    supabase.from("deployment_checks").select("id,environment,check_key,check_label,status,details,checked_at").eq("environment", "production").order("created_at"),
    supabase.from("migration_runs").select("id,source_system,source_label,status,dry_run,total_rows,processed_rows,inserted_rows,updated_rows,skipped_rows,error_rows,started_at,completed_at,created_at").order("created_at", { ascending: false }).limit(10),
    supabase.rpc("phase7_preflight"),
  ]);

  if (settingsResult.error) throw new Error(settingsResult.error.message);
  if (checksResult.error) throw new Error(checksResult.error.message);
  if (runsResult.error) throw new Error(runsResult.error.message);
  if (preflightResult.error) throw new Error(preflightResult.error.message);

  const settings = (settingsResult.data ?? []) as LaunchSetting[];
  const settingMap = Object.fromEntries(settings.map((setting) => [setting.setting_key, setting.setting_value]));
  const checks = (checksResult.data ?? []) as DeploymentCheck[];

  return {
    settings,
    settingMap,
    checks,
    migrationRuns: runsResult.data ?? [],
    preflight: preflightResult.data as {
      ok: boolean;
      missing_tables: string[];
      rls_disabled: string[];
      missing_buckets: string[];
      profile_count: number;
      teacher_count: number;
      student_count: number;
      class_count: number;
      migration_count: number;
      timestamp: string;
    },
    metrics: {
      passed: checks.filter((check) => check.status === "passed").length,
      warnings: checks.filter((check) => check.status === "warning").length,
      failed: checks.filter((check) => check.status === "failed").length,
      pending: checks.filter((check) => check.status === "pending").length,
    },
  };
}
