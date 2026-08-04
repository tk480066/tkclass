"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { getClassRoster, getTeacherClass } from "@/lib/data/phase2";
import { getAttendanceSessionDetail } from "@/lib/data/phase5";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceSessionStatus, AttendanceStatus, GradeCalculationMethod, GradeItemStatus } from "@/lib/types";

export type Phase5ActionState = {
  success?: boolean;
  error?: string;
  message?: string;
  id?: string;
};

function value(formData: FormData, name: string) {
  const item = formData.get(name);
  return typeof item === "string" ? item.trim() : "";
}

function checked(formData: FormData, name: string) {
  return formData.get(name) === "on" || formData.get(name) === "true" || formData.get(name) === "1";
}

function toIso(valueText: string) {
  if (!valueText) return null;
  const date = new Date(valueText);
  if (Number.isNaN(date.getTime())) throw new Error("รูปแบบวันเวลาไม่ถูกต้อง");
  return date.toISOString();
}

function actionError(error: unknown): Phase5ActionState {
  console.error(error);
  if (error instanceof z.ZodError) return { error: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  return { error: error instanceof Error ? error.message : "ดำเนินการไม่สำเร็จ" };
}

async function teacherClass(classId: string) {
  const user = await requireRole("teacher");
  const classRow = await getTeacherClass(user.id, z.string().uuid().parse(classId));
  const supabase = await createClient();
  return { user, classRow, supabase };
}

const attendanceSessionSchema = z.object({
  id: z.string().uuid().or(z.literal("")).optional(),
  classId: z.string().uuid(),
  title: z.string().min(2, "กรุณากรอกชื่อคาบเช็กชื่อ").max(160),
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "กรุณาเลือกวันที่"),
  periodLabel: z.string().max(80).optional(),
  opensAt: z.string().optional(),
  closesAt: z.string().optional(),
  lateAfterMinutes: z.coerce.number().int().min(0).max(240),
  note: z.string().max(1000).optional(),
});

export async function saveAttendanceSessionAction(
  _previous: Phase5ActionState,
  formData: FormData,
): Promise<Phase5ActionState> {
  try {
    const parsed = attendanceSessionSchema.parse({
      id: value(formData, "id"),
      classId: value(formData, "classId"),
      title: value(formData, "title"),
      sessionDate: value(formData, "sessionDate"),
      periodLabel: value(formData, "periodLabel"),
      opensAt: value(formData, "opensAt"),
      closesAt: value(formData, "closesAt"),
      lateAfterMinutes: value(formData, "lateAfterMinutes") || "15",
      note: value(formData, "note"),
    });
    const { user, supabase } = await teacherClass(parsed.classId);
    const status = (value(formData, "status") || "draft") as AttendanceSessionStatus;
    if (!["draft", "open", "closed", "cancelled"].includes(status)) throw new Error("สถานะคาบเช็กชื่อไม่ถูกต้อง");
    let checkInCode = value(formData, "checkInCode") || null;
    if (status === "open" && !checkInCode) {
      const { data, error } = await supabase.rpc("generate_attendance_code");
      if (error || !data) throw new Error(error?.message ?? "สร้างรหัสเช็กชื่อไม่สำเร็จ");
      checkInCode = data;
    }
    const payload = {
      class_id: parsed.classId,
      title: parsed.title,
      session_date: parsed.sessionDate,
      period_label: parsed.periodLabel || null,
      opens_at: toIso(parsed.opensAt ?? ""),
      closes_at: toIso(parsed.closesAt ?? ""),
      late_after_minutes: parsed.lateAfterMinutes,
      allow_self_checkin: checked(formData, "allowSelfCheckin"),
      check_in_code: checkInCode,
      status,
      note: parsed.note || null,
      created_by: user.id,
    };
    let sessionId = parsed.id || "";
    if (sessionId) {
      const { error } = await supabase.from("attendance_sessions").update(payload).eq("id", sessionId).eq("class_id", parsed.classId);
      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await supabase.from("attendance_sessions").insert(payload).select("id").single();
      if (error || !data) throw new Error(error?.message ?? "สร้างคาบเช็กชื่อไม่สำเร็จ");
      sessionId = data.id;
    }
    const { error: ensureError } = await supabase.rpc("ensure_attendance_records", { target_session_id: sessionId });
    if (ensureError) throw new Error(ensureError.message);
    revalidatePath("/teacher");
    revalidatePath("/teacher/attendance");
    revalidatePath(`/teacher/classes/${parsed.classId}`);
    revalidatePath(`/teacher/classes/${parsed.classId}/attendance`);
    revalidatePath(`/teacher/attendance/${sessionId}`);
    revalidatePath("/student/attendance");
    return { success: true, id: sessionId, message: parsed.id ? "บันทึกคาบเช็กชื่อแล้ว" : "สร้างคาบเช็กชื่อแล้ว" };
  } catch (error) {
    return actionError(error);
  }
}

export async function setAttendanceSessionStatusAction(formData: FormData) {
  const sessionId = z.string().uuid().parse(value(formData, "sessionId"));
  const status = z.enum(["draft", "open", "closed", "cancelled"]).parse(value(formData, "status"));
  const user = await requireRole("teacher");
  const { session } = await getAttendanceSessionDetail(user.id, sessionId);
  const supabase = await createClient();
  let code = session.check_in_code;
  if (status === "open" && !code) {
    const { data, error } = await supabase.rpc("generate_attendance_code");
    if (error || !data) throw new Error(error?.message ?? "สร้างรหัสเช็กชื่อไม่สำเร็จ");
    code = data;
  }
  const { error } = await supabase.from("attendance_sessions").update({ status, check_in_code: code }).eq("id", sessionId);
  if (error) throw new Error(error.message);
  if (status === "closed") {
    const { error: closeError } = await supabase
      .from("attendance_records")
      .update({ status: "absent", marked_by: user.id })
      .eq("session_id", sessionId)
      .eq("status", "unmarked");
    if (closeError) throw new Error(closeError.message);
  }
  revalidatePath(`/teacher/attendance/${sessionId}`);
  revalidatePath(`/teacher/classes/${session.class_id}/attendance`);
  revalidatePath("/teacher/attendance");
  revalidatePath("/student/attendance");
}

export async function saveAttendanceRosterAction(
  _previous: Phase5ActionState,
  formData: FormData,
): Promise<Phase5ActionState> {
  try {
    const sessionId = z.string().uuid().parse(value(formData, "sessionId"));
    const user = await requireRole("teacher");
    const { session, roster } = await getAttendanceSessionDetail(user.id, sessionId);
    const supabase = await createClient();
    const intent = value(formData, "intent") || "save";
    const allowedStatuses: AttendanceStatus[] = ["unmarked", "present", "late", "absent", "leave", "sick", "activity"];
    const rows = roster.map((student) => {
      const selected = intent === "all_present" ? "present" : value(formData, `status_${student.user_id}`) || "unmarked";
      if (!allowedStatuses.includes(selected as AttendanceStatus)) throw new Error(`สถานะของ ${student.display_name} ไม่ถูกต้อง`);
      const status = selected as AttendanceStatus;
      const oldRecord = student.record;
      return {
        session_id: sessionId,
        student_id: student.user_id,
        status,
        checked_in_at: ["present", "late", "activity"].includes(status) ? oldRecord?.checked_in_at ?? new Date().toISOString() : null,
        check_in_method: "manual" as const,
        note: value(formData, `note_${student.user_id}`) || null,
        marked_by: user.id,
      };
    });
    const { error } = await supabase.from("attendance_records").upsert(rows, { onConflict: "session_id,student_id" });
    if (error) throw new Error(error.message);
    revalidatePath(`/teacher/attendance/${sessionId}`);
    revalidatePath(`/teacher/classes/${session.class_id}/attendance`);
    revalidatePath("/teacher/attendance");
    revalidatePath("/student/attendance");
    return { success: true, message: intent === "all_present" ? "ทำเครื่องหมายมาเรียนทั้งหมดแล้ว" : "บันทึกผลการเช็กชื่อแล้ว" };
  } catch (error) {
    return actionError(error);
  }
}

export async function studentAttendanceCheckInAction(
  _previous: Phase5ActionState,
  formData: FormData,
): Promise<Phase5ActionState> {
  try {
    await requireRole("student");
    const code = z.string().regex(/^\d{6}$/, "รหัสเช็กชื่อต้องเป็นตัวเลข 6 หลัก").parse(value(formData, "code"));
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("student_check_in", { attendance_code: code });
    if (error) throw new Error(error.message);
    revalidatePath("/student/attendance");
    revalidatePath("/student");
    return { success: true, message: data?.status === "late" ? "เช็กชื่อสำเร็จ: มาสาย" : "เช็กชื่อสำเร็จ: มาเรียน" };
  } catch (error) {
    return actionError(error);
  }
}

const categorySchema = z.object({
  id: z.string().uuid().or(z.literal("")).optional(),
  classId: z.string().uuid(),
  name: z.string().min(2, "กรุณากรอกชื่อหมวดคะแนน").max(120),
  weightPercent: z.coerce.number().min(0).max(100),
  orderNo: z.coerce.number().int().min(1).max(999),
});

export async function saveGradeCategoryAction(
  _previous: Phase5ActionState,
  formData: FormData,
): Promise<Phase5ActionState> {
  try {
    const parsed = categorySchema.parse({
      id: value(formData, "id"),
      classId: value(formData, "classId"),
      name: value(formData, "name"),
      weightPercent: value(formData, "weightPercent"),
      orderNo: value(formData, "orderNo") || "1",
    });
    const { supabase } = await teacherClass(parsed.classId);
    const payload = { class_id: parsed.classId, name: parsed.name, weight_percent: parsed.weightPercent, order_no: parsed.orderNo, is_active: checked(formData, "isActive") };
    if (parsed.id) {
      const { error } = await supabase.from("grade_categories").update(payload).eq("id", parsed.id).eq("class_id", parsed.classId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("grade_categories").insert(payload);
      if (error) throw new Error(error.message);
    }
    revalidatePath(`/teacher/classes/${parsed.classId}/gradebook`);
    revalidatePath("/student/grades");
    return { success: true, message: parsed.id ? "แก้ไขหมวดคะแนนแล้ว" : "เพิ่มหมวดคะแนนแล้ว" };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveGradeSettingsAction(
  _previous: Phase5ActionState,
  formData: FormData,
): Promise<Phase5ActionState> {
  try {
    const classId = z.string().uuid().parse(value(formData, "classId"));
    const calculationMethod = z.enum(["weighted_categories", "total_points"]).parse(value(formData, "calculationMethod")) as GradeCalculationMethod;
    const minimumAttendancePercent = z.coerce.number().min(0).max(100).parse(value(formData, "minimumAttendancePercent"));
    const { supabase } = await teacherClass(classId);
    const { error } = await supabase.from("grade_settings").upsert({
      class_id: classId,
      calculation_method: calculationMethod,
      publish_final_grade: checked(formData, "publishFinalGrade"),
      minimum_attendance_percent: minimumAttendancePercent,
    }, { onConflict: "class_id" });
    if (error) throw new Error(error.message);
    revalidatePath(`/teacher/classes/${classId}/gradebook`);
    revalidatePath("/teacher/gradebook");
    revalidatePath("/student/grades");
    return { success: true, message: "บันทึกการตั้งค่าสมุดคะแนนแล้ว" };
  } catch (error) {
    return actionError(error);
  }
}

const gradeItemSchema = z.object({
  id: z.string().uuid().or(z.literal("")).optional(),
  classId: z.string().uuid(),
  categoryId: z.string().uuid(),
  title: z.string().min(2, "กรุณากรอกชื่อรายการคะแนน").max(160),
  description: z.string().max(1000).optional(),
  maxScore: z.coerce.number().positive("คะแนนเต็มต้องมากกว่า 0").max(10000),
  itemWeight: z.coerce.number().positive("น้ำหนักรายการต้องมากกว่า 0").max(1000),
  orderNo: z.coerce.number().int().min(1).max(999),
});

export async function saveCustomGradeItemAction(
  _previous: Phase5ActionState,
  formData: FormData,
): Promise<Phase5ActionState> {
  try {
    const parsed = gradeItemSchema.parse({
      id: value(formData, "id"),
      classId: value(formData, "classId"),
      categoryId: value(formData, "categoryId"),
      title: value(formData, "title"),
      description: value(formData, "description"),
      maxScore: value(formData, "maxScore"),
      itemWeight: value(formData, "itemWeight") || "1",
      orderNo: value(formData, "orderNo") || "1",
    });
    const status = z.enum(["draft", "published", "archived"]).parse(value(formData, "status") || "draft") as GradeItemStatus;
    const { supabase } = await teacherClass(parsed.classId);
    const payload = {
      class_id: parsed.classId,
      category_id: parsed.categoryId,
      source_type: "custom" as const,
      source_id: null,
      title: parsed.title,
      description: parsed.description || null,
      max_score: parsed.maxScore,
      item_weight: parsed.itemWeight,
      status,
      order_no: parsed.orderNo,
    };
    let itemId = parsed.id || "";
    if (itemId) {
      const { error } = await supabase.from("grade_items").update(payload).eq("id", itemId).eq("class_id", parsed.classId).eq("source_type", "custom");
      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await supabase.from("grade_items").insert(payload).select("id").single();
      if (error || !data) throw new Error(error?.message ?? "เพิ่มรายการคะแนนไม่สำเร็จ");
      itemId = data.id;
    }
    revalidatePath(`/teacher/classes/${parsed.classId}/gradebook`);
    revalidatePath("/student/grades");
    return { success: true, id: itemId, message: parsed.id ? "แก้ไขรายการคะแนนแล้ว" : "เพิ่มรายการคะแนนแล้ว" };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveCustomGradeScoresAction(
  _previous: Phase5ActionState,
  formData: FormData,
): Promise<Phase5ActionState> {
  try {
    const classId = z.string().uuid().parse(value(formData, "classId"));
    const { user, supabase } = await teacherClass(classId);
    const roster = (await getClassRoster(user.id, classId)).filter((student) => student.enrollment_status === "active");
    const { data: items, error: itemError } = await supabase
      .from("grade_items")
      .select("id, max_score")
      .eq("class_id", classId)
      .eq("source_type", "custom")
      .neq("status", "archived");
    if (itemError) throw new Error(itemError.message);
    const rows: Array<Record<string, unknown>> = [];
    for (const item of items ?? []) {
      const maxScore = Number(item.max_score);
      for (const student of roster) {
        const field = value(formData, `score_${item.id}_${student.user_id}`);
        const isExcused = checked(formData, `excused_${item.id}_${student.user_id}`);
        if (!field && !isExcused) continue;
        const score = field ? Number(field) : null;
        if (score !== null && (!Number.isFinite(score) || score < 0 || score > maxScore)) {
          throw new Error(`คะแนนของ ${student.display_name} ต้องอยู่ระหว่าง 0–${maxScore}`);
        }
        rows.push({
          grade_item_id: item.id,
          student_id: student.user_id,
          score,
          is_excused: isExcused,
          feedback: value(formData, `feedback_${item.id}_${student.user_id}`) || null,
          graded_by: user.id,
          graded_at: new Date().toISOString(),
        });
      }
    }
    if (rows.length) {
      const { error } = await supabase.from("grade_entries").upsert(rows, { onConflict: "grade_item_id,student_id" });
      if (error) throw new Error(error.message);
    }
    revalidatePath(`/teacher/classes/${classId}/gradebook`);
    revalidatePath("/student/grades");
    return { success: true, message: "บันทึกคะแนนเพิ่มเติมแล้ว" };
  } catch (error) {
    return actionError(error);
  }
}

export async function setGradeItemStatusAction(formData: FormData) {
  const classId = z.string().uuid().parse(value(formData, "classId"));
  const itemId = z.string().uuid().parse(value(formData, "itemId"));
  const status = z.enum(["draft", "published", "archived"]).parse(value(formData, "status"));
  const { supabase } = await teacherClass(classId);
  const { error } = await supabase.from("grade_items").update({ status }).eq("id", itemId).eq("class_id", classId);
  if (error) throw new Error(error.message);
  revalidatePath(`/teacher/classes/${classId}/gradebook`);
  revalidatePath("/student/grades");
}

export async function syncGradebookAction(formData: FormData) {
  const classId = z.string().uuid().parse(value(formData, "classId"));
  const { supabase } = await teacherClass(classId);
  const { error } = await supabase.rpc("sync_gradebook_sources", { target_class_id: classId });
  if (error) throw new Error(error.message);
  revalidatePath(`/teacher/classes/${classId}/gradebook`);
  redirect(`/teacher/classes/${classId}/gradebook?synced=1`);
}
