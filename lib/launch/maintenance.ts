import { createClient } from "@supabase/supabase-js";

export async function getPublicLaunchStatus() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { maintenanceMode: false, launchAt: null as string | null, banner: "" };

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await supabase.from("system_settings")
    .select("setting_key,setting_value")
    .in("setting_key", ["maintenance_mode", "launch_at", "announcement_banner"]);
  const settings = Object.fromEntries((data ?? []).map((row) => [row.setting_key, row.setting_value]));
  return {
    maintenanceMode: Boolean(settings.maintenance_mode),
    launchAt: typeof settings.launch_at === "string" ? settings.launch_at : null,
    banner: typeof settings.announcement_banner === "string" ? settings.announcement_banner : "",
  };
}
