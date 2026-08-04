"use server";

import { revalidatePath } from "next/cache";
import { z, ZodError } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type Phase3ActionState = {
  success?: boolean;
  message?: string;
  error?: string;
  assignmentId?: string;
  submissionId?: string;
};

const assignmentSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  classId: z.string().uuid(),
  title: z.string().trim().min(2, "กรุณากรอกชื่องาน"),
  instructions: z.string().trim().optional(),
  workType: z.enum(["individual", "group"]),
  maxScore: z.coerce.number().positive("คะแนนเต็มต้องมากกว่า 0"),
  passingScore: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
  publishAt: z.string().optional(),
  dueAt: z.string().optional(),
  targetMode: z.enum(["class", "students", "group"]),
  targetGroupName: z.string().trim().optional(),
  status: z.enum(["draft", "published", "closed", "archived"]),
});

const submissionDraftSchema = z.object({
  assignmentId: z.string().uuid(),
  submissionId: z.string().uuid().optional().or(z.literal("")),
  answerText: z.string().trim().optional(),
  linkUrl: z.string().trim().url("ลิงก์ผลงานไม่ถูกต้อง").optional().or(z.literal("")),
});

const reviewSchema = z.object({
  assignmentId: z.string().uuid(),
  submissionId: z.string().uuid(),
  score: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
  teacherFeedback: z.string().trim().optional(),
  reviewOutcome: z.enum(["graded", "passed", "failed", "revision_required"]),
});

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true" || formData.get(key) === "1";
}

function optionalDate(raw: string) {
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) throw new Error("วันและเวลาไม่ถูกต้อง");
  return parsed.toISOString();
}

function actionError(error: unknown): Phase3ActionState {
  console.error(error);
  if (error instanceof ZodError) return { error: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  if (error instanceof Error) return { error: error.message };
  return { error: "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ" };
}

async function assertTeacherOwnsClass(classId: string) {
  const user = await requireRole("teacher");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .select("id")
    .eq("id", classId)
    .eq("teacher_id", user.id)
    .single();
  if (error || !data) throw new Error("ไม่พบชั้นเรียนหรือไม่มีสิทธิ์จัดการ");
  return user;
}

async function teacherAssignment(assignmentId: string) {
  const user = await requireRole("teacher");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assignments")
    .select("id, class_id, max_score")
    .eq("id", assignmentId)
    .single();
  if (error || !data) throw new Error("ไม่พบงานหรือไม่มีสิทธิ์จัดการ");
  await assertTeacherOwnsClass(data.class_id);
  return { user, assignment: data, supabase };
}

async function studentAssignment(assignmentId: string) {
  const user = await requireRole("student");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assignments")
    .select("id, class_id, work_type, target_group_name, due_at, allow_late, allow_resubmit, allowed_submission_types, status")
    .eq("id", assignmentId)
    .single();
  if (error || !data) throw new Error("ไม่พบงานหรือคุณไม่ได้รับมอบหมายงานนี้");
  return { user, assignment: data, supabase };
}

export async function saveAssignmentAction(
  _previousState: Phase3ActionState,
  formData: FormData,
): Promise<Phase3ActionState> {
  try {
    const parsed = assignmentSchema.parse({
      id: value(formData, "id"),
      classId: value(formData, "classId"),
      title: value(formData, "title"),
      instructions: value(formData, "instructions"),
      workType: value(formData, "workType") || "individual",
      maxScore: value(formData, "maxScore"),
      passingScore: value(formData, "passingScore"),
      publishAt: value(formData, "publishAt"),
      dueAt: value(formData, "dueAt"),
      targetMode: value(formData, "targetMode") || "class",
      targetGroupName: value(formData, "targetGroupName"),
      status: value(formData, "status") || "draft",
    });
    await assertTeacherOwnsClass(parsed.classId);
    if (parsed.targetMode === "group" && !parsed.targetGroupName) throw new Error("กรุณาเลือกกลุ่มที่ได้รับงาน");
    const targetStudentIds = formData.getAll("targetStudentIds").map(String).filter(Boolean);
    if (parsed.targetMode === "students" && !targetStudentIds.length) throw new Error("กรุณาเลือกนักเรียนอย่างน้อย 1 คน");
    const allowedSubmissionTypes = ["text", "file", "image", "video", "link"].filter((type) => checked(formData, `submission_${type}`));
    if (!allowedSubmissionTypes.length) throw new Error("กรุณาเลือกรูปแบบการส่งงานอย่างน้อย 1 รูปแบบ");
    const passingScore = parsed.passingScore === "" || parsed.passingScore === undefined ? null : Number(parsed.passingScore);
    if (passingScore !== null && passingScore > parsed.maxScore) throw new Error("คะแนนผ่านต้องไม่เกินคะแนนเต็ม");

    const supabase = await createClient();
    const payload = {
      class_id: parsed.classId,
      title: parsed.title,
      instructions: parsed.instructions || null,
      work_type: parsed.workType,
      max_score: parsed.maxScore,
      passing_score: passingScore,
      publish_at: optionalDate(parsed.publishAt ?? ""),
      due_at: optionalDate(parsed.dueAt ?? ""),
      allow_late: checked(formData, "allowLate"),
      allow_resubmit: checked(formData, "allowResubmit"),
      target_mode: parsed.targetMode,
      target_group_name: parsed.targetMode === "group" ? parsed.targetGroupName : null,
      allowed_submission_types: allowedSubmissionTypes,
      status: parsed.status,
    };

    let assignmentId = parsed.id || "";
    if (assignmentId) {
      const { error } = await supabase.from("assignments").update(payload).eq("id", assignmentId).eq("class_id", parsed.classId);
      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await supabase.from("assignments").insert(payload).select("id").single();
      if (error || !data) throw new Error(error?.message ?? "สร้างงานไม่สำเร็จ");
      assignmentId = data.id;
    }

    const { error: deleteTargetsError } = await supabase.from("assignment_targets").delete().eq("assignment_id", assignmentId);
    if (deleteTargetsError) throw new Error(deleteTargetsError.message);
    if (parsed.targetMode === "students") {
      const rows = targetStudentIds.map((studentId) => ({ assignment_id: assignmentId, student_id: studentId }));
      const { error } = await supabase.from("assignment_targets").insert(rows);
      if (error) throw new Error(error.message);
    }

    revalidatePath("/teacher");
    revalidatePath("/teacher/assignments");
    revalidatePath(`/teacher/classes/${parsed.classId}`);
    revalidatePath(`/teacher/classes/${parsed.classId}/assignments`);
    revalidatePath(`/teacher/assignments/${assignmentId}`);
    revalidatePath("/student");
    revalidatePath("/student/assignments");
    return { success: true, assignmentId, message: parsed.id ? "บันทึกงานเรียบร้อยแล้ว" : "สร้างงานเรียบร้อยแล้ว สามารถเปิดรายละเอียดเพื่อแนบเอกสารได้" };
  } catch (error) {
    return actionError(error);
  }
}

export async function archiveAssignmentAction(formData: FormData) {
  const assignmentId = value(formData, "assignmentId");
  const { assignment, supabase } = await teacherAssignment(assignmentId);
  const { error } = await supabase.from("assignments").update({ status: "archived" }).eq("id", assignmentId);
  if (error) throw new Error(error.message);
  revalidatePath("/teacher/assignments");
  revalidatePath(`/teacher/classes/${assignment.class_id}/assignments`);
}

export async function addExternalAssignmentAttachmentAction(
  _previousState: Phase3ActionState,
  formData: FormData,
): Promise<Phase3ActionState> {
  try {
    const assignmentId = z.string().uuid().parse(value(formData, "assignmentId"));
    const externalUrl = z.string().url("ลิงก์เอกสารไม่ถูกต้อง").parse(value(formData, "externalUrl"));
    const fileName = value(formData, "fileName") || "เอกสารประกอบ";
    const { assignment, supabase } = await teacherAssignment(assignmentId);
    const { error } = await supabase.from("assignment_attachments").insert({ assignment_id: assignmentId, external_url: externalUrl, file_name: fileName });
    if (error) throw new Error(error.message);
    revalidatePath(`/teacher/assignments/${assignmentId}`);
    revalidatePath(`/student/assignments/${assignmentId}`);
    revalidatePath(`/teacher/classes/${assignment.class_id}/assignments`);
    return { success: true, message: "เพิ่มลิงก์เอกสารประกอบแล้ว" };
  } catch (error) {
    return actionError(error);
  }
}

export async function removeAssignmentAttachmentAction(formData: FormData) {
  const assignmentId = value(formData, "assignmentId");
  const attachmentId = value(formData, "attachmentId");
  const { supabase } = await teacherAssignment(assignmentId);
  const { data } = await supabase.from("assignment_attachments").select("storage_path").eq("id", attachmentId).eq("assignment_id", assignmentId).single();
  if (data?.storage_path) await supabase.storage.from("assignment-files").remove([data.storage_path]);
  const { error } = await supabase.from("assignment_attachments").delete().eq("id", attachmentId).eq("assignment_id", assignmentId);
  if (error) throw new Error(error.message);
  revalidatePath(`/teacher/assignments/${assignmentId}`);
  revalidatePath(`/student/assignments/${assignmentId}`);
}

export async function saveSubmissionDraftAction(
  _previousState: Phase3ActionState,
  formData: FormData,
): Promise<Phase3ActionState> {
  try {
    const parsed = submissionDraftSchema.parse({
      assignmentId: value(formData, "assignmentId"),
      submissionId: value(formData, "submissionId"),
      answerText: value(formData, "answerText"),
      linkUrl: value(formData, "linkUrl"),
    });
    const { user, assignment, supabase } = await studentAssignment(parsed.assignmentId);
    if (parsed.answerText && !assignment.allowed_submission_types.includes("text")) throw new Error("งานนี้ไม่อนุญาตให้ส่งคำตอบแบบข้อความ");
    if (parsed.linkUrl && !assignment.allowed_submission_types.includes("link")) throw new Error("งานนี้ไม่อนุญาตให้แนบลิงก์");
    let submissionId = parsed.submissionId || "";
    let existingStatus = "";
    let existingRevisionCount = 0;
    if (submissionId) {
      const { data } = await supabase.from("submissions").select("status, revision_count").eq("id", submissionId).eq("submitted_by", user.id).single();
      existingStatus = data?.status ?? "";
      existingRevisionCount = data?.revision_count ?? 0;
    }
    if (assignment.status !== "published") throw new Error("งานนี้ปิดรับหรือยังไม่เปิดให้ส่ง");
    if (["graded", "passed", "failed"].includes(existingStatus)) {
      throw new Error("งานนี้ได้รับผลตรวจแล้วและไม่สามารถแก้ไขได้");
    }
    if (["submitted", "late"].includes(existingStatus) && !assignment.allow_resubmit) {
      throw new Error("ครูไม่อนุญาตให้แก้ไขหรือส่งงานใหม่");
    }

    let groupName: string | null = null;
    if (assignment.work_type === "group") {
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("group_name")
        .eq("class_id", assignment.class_id)
        .eq("student_id", user.id)
        .eq("status", "active")
        .single();
      groupName = enrollment?.group_name ?? assignment.target_group_name ?? null;
      if (!groupName) throw new Error("ยังไม่ได้กำหนดกลุ่มสำหรับนักเรียน");
    }

    if (!submissionId && assignment.work_type === "group" && groupName) {
      const { data: groupSubmission } = await supabase
        .from("submissions")
        .select("id, submitted_by")
        .eq("assignment_id", parsed.assignmentId)
        .eq("group_name", groupName)
        .maybeSingle();
      if (groupSubmission) {
        if (groupSubmission.submitted_by !== user.id) throw new Error("สมาชิกกลุ่มคนอื่นเป็นผู้รับผิดชอบการส่งงานนี้แล้ว");
        submissionId = groupSubmission.id;
      }
    }

    const payload = {
      assignment_id: parsed.assignmentId,
      submitted_by: user.id,
      group_name: groupName,
      answer_text: parsed.answerText || null,
      link_url: parsed.linkUrl || null,
      status: "draft" as const,
      withdrawn_at: null,
      revision_count: existingStatus === "revision_required" ? existingRevisionCount + 1 : existingRevisionCount,
    };
    if (submissionId) {
      const { error } = await supabase.from("submissions").update(payload).eq("id", submissionId).eq("submitted_by", user.id);
      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await supabase.from("submissions").insert(payload).select("id").single();
      if (error || !data) throw new Error(error?.message ?? "สร้างฉบับร่างไม่สำเร็จ");
      submissionId = data.id;
    }

    if (assignment.work_type === "group" && groupName) {
      const { data: groupEnrollments } = await supabase
        .from("enrollments")
        .select("student_id")
        .eq("class_id", assignment.class_id)
        .eq("group_name", groupName)
        .eq("status", "active");
      await supabase.from("submission_members").delete().eq("submission_id", submissionId);
      const memberRows = (groupEnrollments ?? []).map((row: { student_id: string }) => ({
        submission_id: submissionId,
        student_id: row.student_id,
        member_role: row.student_id === user.id ? "owner" : "member",
      }));
      if (memberRows.length) {
        const { error } = await supabase.from("submission_members").insert(memberRows);
        if (error) throw new Error(error.message);
      }
    }

    revalidatePath(`/student/assignments/${parsed.assignmentId}`);
    revalidatePath("/student/assignments");
    return { success: true, submissionId, message: "บันทึกฉบับร่างแล้ว คุณสามารถแนบไฟล์และส่งงานได้" };
  } catch (error) {
    return actionError(error);
  }
}

export async function submitAssignmentAction(formData: FormData) {
  const assignmentId = value(formData, "assignmentId");
  const submissionId = value(formData, "submissionId");
  const { user, assignment, supabase } = await studentAssignment(assignmentId);
  if (assignment.status !== "published") throw new Error("งานนี้ปิดรับแล้ว");
  const { data: submission, error } = await supabase
    .from("submissions")
    .select("id, answer_text, link_url, status, revision_count")
    .eq("id", submissionId)
    .eq("submitted_by", user.id)
    .single();
  if (error || !submission) throw new Error("กรุณาบันทึกฉบับร่างก่อนส่งงาน");
  const { count } = await supabase.from("submission_files").select("id", { count: "exact", head: true }).eq("submission_id", submissionId);
  if (!submission.answer_text && !submission.link_url && !count) throw new Error("กรุณาพิมพ์คำตอบ แนบลิงก์ หรืออัปโหลดไฟล์อย่างน้อย 1 รายการ");
  const now = new Date();
  const isLate = assignment.due_at ? now.getTime() > new Date(assignment.due_at).getTime() : false;
  if (isLate && !assignment.allow_late) throw new Error("เลยกำหนดส่งแล้วและครูไม่อนุญาตให้ส่งล่าช้า");
  const { error: updateError } = await supabase.from("submissions").update({
    status: isLate ? "late" : "submitted",
    submitted_at: now.toISOString(),
    withdrawn_at: null,
    revision_count: submission.revision_count,
  }).eq("id", submissionId).eq("submitted_by", user.id);
  if (updateError) throw new Error(updateError.message);
  revalidatePath(`/student/assignments/${assignmentId}`);
  revalidatePath("/student/assignments");
  revalidatePath(`/teacher/assignments/${assignmentId}`);
  revalidatePath("/teacher/assignments");
}

export async function withdrawSubmissionAction(formData: FormData) {
  const assignmentId = value(formData, "assignmentId");
  const submissionId = value(formData, "submissionId");
  const { user, assignment, supabase } = await studentAssignment(assignmentId);
  if (!assignment.allow_resubmit) throw new Error("ครูไม่อนุญาตให้ยกเลิกหรือส่งงานใหม่");
  const { error } = await supabase.from("submissions").update({ status: "withdrawn", withdrawn_at: new Date().toISOString() }).eq("id", submissionId).eq("submitted_by", user.id).in("status", ["submitted", "late"]);
  if (error) throw new Error(error.message);
  revalidatePath(`/student/assignments/${assignmentId}`);
  revalidatePath("/student/assignments");
  revalidatePath(`/teacher/assignments/${assignmentId}`);
}

export async function removeSubmissionFileAction(formData: FormData) {
  const assignmentId = value(formData, "assignmentId");
  const submissionId = value(formData, "submissionId");
  const fileId = value(formData, "fileId");
  const { user, supabase } = await studentAssignment(assignmentId);
  const { data: submission } = await supabase.from("submissions").select("status, revision_count").eq("id", submissionId).eq("submitted_by", user.id).single();
  if (!submission || !["draft", "withdrawn", "revision_required"].includes(submission.status)) throw new Error("ไม่สามารถลบไฟล์หลังส่งงานแล้ว");
  const { data: file } = await supabase.from("submission_files").select("storage_path").eq("id", fileId).eq("submission_id", submissionId).eq("uploaded_by", user.id).single();
  if (file?.storage_path) await supabase.storage.from("submission-files").remove([file.storage_path]);
  const { error } = await supabase.from("submission_files").delete().eq("id", fileId).eq("uploaded_by", user.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/student/assignments/${assignmentId}`);
}

export async function reviewSubmissionAction(
  _previousState: Phase3ActionState,
  formData: FormData,
): Promise<Phase3ActionState> {
  try {
    const parsed = reviewSchema.parse({
      assignmentId: value(formData, "assignmentId"),
      submissionId: value(formData, "submissionId"),
      score: value(formData, "score"),
      teacherFeedback: value(formData, "teacherFeedback"),
      reviewOutcome: value(formData, "reviewOutcome"),
    });
    const { user, assignment, supabase } = await teacherAssignment(parsed.assignmentId);
    const score = parsed.score === "" || parsed.score === undefined ? null : Number(parsed.score);
    if (parsed.reviewOutcome !== "revision_required" && score === null) throw new Error("กรุณากรอกคะแนน");
    if (score !== null && score > Number(assignment.max_score)) throw new Error("คะแนนต้องไม่เกินคะแนนเต็ม");
    const { error } = await supabase.from("submissions").update({
      score,
      teacher_feedback: parsed.teacherFeedback || null,
      status: parsed.reviewOutcome,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    }).eq("id", parsed.submissionId).eq("assignment_id", parsed.assignmentId);
    if (error) throw new Error(error.message);
    revalidatePath(`/teacher/assignments/${parsed.assignmentId}`);
    revalidatePath("/teacher/assignments");
    revalidatePath(`/student/assignments/${parsed.assignmentId}`);
    revalidatePath("/student/assignments");
    return { success: true, message: parsed.reviewOutcome === "revision_required" ? "ส่งคำขอแก้ไขให้นักเรียนแล้ว" : "บันทึกผลการตรวจงานแล้ว" };
  } catch (error) {
    return actionError(error);
  }
}
