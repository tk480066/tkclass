"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

const checkStatusSchema = z.enum(["pending", "passed", "warning", "failed", "skipped"]);

const launchSettingsSchema = z.object({
  academicYear: z.coerce.number().int().min(2500).max(3000),
  semester: z.coerce.number().int().min(1).max(3),
  launchAt: z.string(),
  supportEmail: z.union([z.literal(""), z.string().email("รูปแบบอีเมลไม่ถูกต้อง")]),
  announcementBanner: z.string().max(1000, "ข้อความแจ้งเตือนต้องไม่เกิน 1,000 ตัวอักษร"),
});

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function feedbackRedirect(kind: "saved" | "error", message: string): never {
  const params = new URLSearchParams({ [kind]: message });
  redirect(`/admin/launch?${params.toString()}`);
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

async function requireAdmin() {
  const user = await requireRole("admin");
  const supabase = await createClient();
  return { user, supabase };
}

async function recordAudit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventType: string,
  entityType: string,
  metadata: Record<string, unknown>,
) {
  const { error } = await supabase.rpc("record_audit_event", {
    target_event_type: eventType,
    target_entity_type: entityType,
    target_entity_id: null,
    target_class_id: null,
    target_metadata: metadata,
  });
  if (error) throw new Error(`บันทึก Audit log ไม่สำเร็จ: ${error.message}`);
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
  await recordAudit(supabase, "system_setting_updated", "system_setting", {
    setting_key: settingKey,
    setting_value: settingValue,
  });
}

export async function toggleMaintenanceModeAction(formData: FormData) {
  const enabled = value(formData, "enabled") === "true";
  let failure: string | null = null;

  try {
    await writeSetting("maintenance_mode", enabled, "เปิดหน้าบำรุงรักษาชั่วคราว", true);
    revalidatePath("/admin/launch");
  } catch (error) {
    failure = errorMessage(error, "เปลี่ยน Maintenance mode ไม่สำเร็จ");
  }

  if (failure) feedbackRedirect("error", failure);
  feedbackRedirect("saved", enabled ? "เปิด Maintenance mode แล้ว" : "ปิด Maintenance mode แล้ว");
}

export async function saveLaunchSettingsAction(formData: FormData) {
  const parsed = launchSettingsSchema.safeParse({
    academicYear: value(formData, "academicYear"),
    semester: value(formData, "semester"),
    launchAt: value(formData, "launchAt"),
    supportEmail: value(formData, "supportEmail"),
    announcementBanner: value(formData, "announcementBanner"),
  });

  if (!parsed.success) {
    feedbackRedirect("error", parsed.error.issues[0]?.message ?? "ข้อมูลค่าการเปิดใช้งานไม่ถูกต้อง");
  }

  let launchAt: string | null = null;
  if (parsed.data.launchAt) {
    const date = new Date(parsed.data.launchAt);
    if (Number.isNaN(date.getTime())) {
      feedbackRedirect("error", "วันเวลาเปิดระบบไม่ถูกต้อง");
    }
    launchAt = date.toISOString();
  }

  let failure: string | null = null;
  try {
    const { user, supabase } = await requireAdmin();
    const settings = [
      {
        setting_key: "academic_year",
        setting_value: parsed.data.academicYear,
        description: "ปีการศึกษาปัจจุบัน",
        is_public: true,
        updated_by: user.id,
      },
      {
        setting_key: "semester",
        setting_value: parsed.data.semester,
        description: "ภาคเรียนปัจจุบัน",
        is_public: true,
        updated_by: user.id,
      },
      {
        setting_key: "launch_at",
        setting_value: launchAt,
        description: "เวลาเปิดใช้งานจริง",
        is_public: true,
        updated_by: user.id,
      },
      {
        setting_key: "support_email",
        setting_value: parsed.data.supportEmail,
        description: "อีเมลติดต่อผู้ดูแลระบบ",
        is_public: true,
        updated_by: user.id,
      },
      {
        setting_key: "announcement_banner",
        setting_value: parsed.data.announcementBanner,
        description: "ข้อความแจ้งเตือนส่วนกลาง",
        is_public: true,
        updated_by: user.id,
      },
    ];

    const { error } = await supabase
      .from("system_settings")
      .upsert(settings, { onConflict: "setting_key" });

    if (error) throw new Error(`บันทึกค่าระบบไม่สำเร็จ: ${error.message}`);

    await recordAudit(supabase, "launch_settings_updated", "system_settings", {
      academic_year: parsed.data.academicYear,
      semester: parsed.data.semester,
      launch_at: launchAt,
      support_email: parsed.data.supportEmail,
      announcement_banner: parsed.data.announcementBanner,
    });

    revalidatePath("/admin/launch");
  } catch (error) {
    failure = errorMessage(error, "บันทึกค่าการเปิดใช้งานไม่สำเร็จ");
  }

  if (failure) feedbackRedirect("error", failure);
  feedbackRedirect("saved", "บันทึกค่าการเปิดใช้งานเรียบร้อยแล้ว");
}

export async function updateDeploymentCheckAction(formData: FormData) {
  let failure: string | null = null;

  try {
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
    await recordAudit(supabase, "deployment_check_updated", "deployment_check", {
      check_key: checkKey,
      status,
      note,
    });
    revalidatePath("/admin/launch");
  } catch (error) {
    failure = errorMessage(error, "บันทึก Checklist ไม่สำเร็จ");
  }

  if (failure) feedbackRedirect("error", failure);
  feedbackRedirect("saved", "บันทึกสถานะ Checklist แล้ว");
}

export async function markMigrationCompletedAction() {
  let failure: string | null = null;

  try {
    await writeSetting("data_migration_completed", true, "ย้ายข้อมูลจริงเสร็จสมบูรณ์", false);
    revalidatePath("/admin/launch");
  } catch (error) {
    failure = errorMessage(error, "ยืนยันการย้ายข้อมูลไม่สำเร็จ");
  }

  if (failure) feedbackRedirect("error", failure);
  feedbackRedirect("saved", "ยืนยันการย้ายข้อมูลเรียบร้อยแล้ว");
}

export async function markProductionReadyAction() {
  let failure: string | null = null;

  try {
    const { supabase } = await requireAdmin();
    const { data: checks, error } = await supabase
      .from("deployment_checks")
      .select("status")
      .eq("environment", "production");
    if (error) throw new Error(error.message);
    const blocking = (checks ?? []).filter((check) => !["passed", "skipped"].includes(check.status));
    if (blocking.length) throw new Error(`ยังมีรายการที่ไม่ผ่าน ${blocking.length} รายการ`);
    await writeSetting("production_ready", true, "ผ่านการตรวจสอบก่อนเปิดระบบ", false);
    revalidatePath("/admin/launch");
  } catch (error) {
    failure = errorMessage(error, "เปลี่ยนสถานะเปิดใช้งานไม่สำเร็จ");
  }

  if (failure) feedbackRedirect("error", failure);
  feedbackRedirect("saved", "ระบบถูกทำเครื่องหมายว่าพร้อมเปิดใช้งานแล้ว");
}
