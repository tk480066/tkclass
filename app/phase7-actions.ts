"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

const checkStatusSchema = z.enum(["pending", "passed", "warning", "failed", "skipped"]);

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

async function requireAdmin() {
  const user = await requireRole("admin");
  const supabase = await createClient();
  return { user, supabase };
}

async function writeSetting(settingKey: string, settingValue: unknown, description?: string, isPublic = false) {
  const { user, supabase } = await requireAdmin();
  const { error } = await supabase.from("system_settings").upsert({
    setting_key: settingKey,
    setting_value: settingValue,
    description: description || null,
    is_public: isPublic,
    updated_by: user.id,
  }, { onConflict: "setting_key" });
  if (error) throw new Error(error.message);
  await supabase.rpc("record_audit_event", {
    target_event_type: "system_setting_updated",
    target_entity_type: "system_setting",
    target_metadata: { setting_key: settingKey, setting_value: settingValue },
  });
}

export async function toggleMaintenanceModeAction(formData: FormData) {
  const enabled = value(formData, "enabled") === "true";
  await writeSetting("maintenance_mode", enabled, "เปิดหน้าบำรุงรักษาชั่วคราว", true);
  revalidatePath("/admin/launch");
}

export async function saveLaunchSettingsAction(formData: FormData) {
  const academicYear = z.coerce.number().int().min(2500).max(3000).parse(value(formData, "academicYear"));
  const semester = z.coerce.number().int().min(1).max(3).parse(value(formData, "semester"));
  const launchAtRaw = value(formData, "launchAt");
  const launchAt = launchAtRaw ? new Date(launchAtRaw).toISOString() : null;
  const supportEmail = value(formData, "supportEmail");
  const announcementBanner = value(formData, "announcementBanner");

  await Promise.all([
    writeSetting("academic_year", academicYear, "ปีการศึกษาปัจจุบัน", true),
    writeSetting("semester", semester, "ภาคเรียนปัจจุบัน", true),
    writeSetting("launch_at", launchAt, "เวลาเปิดใช้งานจริง", true),
    writeSetting("support_email", supportEmail, "อีเมลติดต่อผู้ดูแลระบบ", true),
    writeSetting("announcement_banner", announcementBanner, "ข้อความแจ้งเตือนส่วนกลาง", true),
  ]);
  revalidatePath("/admin/launch");
}

export async function updateDeploymentCheckAction(formData: FormData) {
  const checkKey = z.string().min(1).parse(value(formData, "checkKey"));
  const status = checkStatusSchema.parse(value(formData, "status"));
  const note = value(formData, "note");
  const { user, supabase } = await requireAdmin();
  const { error } = await supabase.from("deployment_checks").update({
    status,
    checked_at: new Date().toISOString(),
    checked_by: user.id,
    details: note ? { note } : {},
  }).eq("environment", "production").eq("check_key", checkKey);
  if (error) throw new Error(error.message);
  await supabase.rpc("record_audit_event", {
    target_event_type: "deployment_check_updated",
    target_entity_type: "deployment_check",
    target_metadata: { check_key: checkKey, status, note },
  });
  revalidatePath("/admin/launch");
}

export async function markMigrationCompletedAction() {
  await writeSetting("data_migration_completed", true, "ย้ายข้อมูลจริงเสร็จสมบูรณ์", false);
  revalidatePath("/admin/launch");
}

export async function markProductionReadyAction() {
  const { supabase } = await requireAdmin();
  const { data: checks, error } = await supabase.from("deployment_checks").select("status").eq("environment", "production");
  if (error) throw new Error(error.message);
  const blocking = (checks ?? []).filter((check) => !["passed", "skipped"].includes(check.status));
  if (blocking.length) throw new Error(`ยังมีรายการที่ไม่ผ่าน ${blocking.length} รายการ`);
  await writeSetting("production_ready", true, "ผ่านการตรวจสอบก่อนเปิดระบบ", false);
  revalidatePath("/admin/launch");
}
