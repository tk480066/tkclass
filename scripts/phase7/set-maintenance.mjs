import { createAdminSupabase, parseCliArgs, toBoolean } from "./_shared.mjs";

const args = parseCliArgs();
const raw = args.on === true ? true : args.off === true ? false : args.value;
if (raw === undefined) throw new Error("Use --on, --off, or --value=true|false");
const enabled = toBoolean(raw);
const supabase = createAdminSupabase();
const { error } = await supabase.from("system_settings").upsert({
  setting_key: "maintenance_mode",
  setting_value: enabled,
  description: "เปิดหน้าบำรุงรักษาชั่วคราว",
  is_public: true,
}, { onConflict: "setting_key" });
if (error) throw new Error(error.message);
console.log(`Maintenance mode: ${enabled ? "ON" : "OFF"}`);
