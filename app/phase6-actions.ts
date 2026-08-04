"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, requireUser } from "@/lib/auth/require-role";
import { getAnnouncementDetail, getConversationDetail } from "@/lib/data/phase6";
import { getTeacherClass } from "@/lib/data/phase2";
import { createClient } from "@/lib/supabase/server";
import type { AnnouncementStatus, CommunicationPriority, ConversationStatus } from "@/lib/types";

export type Phase6ActionState = {
  success?: boolean;
  error?: string;
  message?: string;
  announcementId?: string;
  conversationId?: string;
  messageId?: string;
};

function value(formData: FormData, name: string) {
  const item = formData.get(name);
  return typeof item === "string" ? item.trim() : "";
}

function checked(formData: FormData, name: string) {
  return ["on", "true", "1"].includes(value(formData, name));
}

function toIso(input: string) {
  if (!input) return null;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) throw new Error("รูปแบบวันเวลาไม่ถูกต้อง");
  return date.toISOString();
}

function actionError(error: unknown): Phase6ActionState {
  console.error(error);
  if (error && typeof error === "object" && "issues" in error) {
    const issues = (error as { issues?: Array<{ message?: string }> }).issues;
    return { error: issues?.[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  return { error: error instanceof Error ? error.message : "ดำเนินการไม่สำเร็จ" };
}

const announcementSchema = z.object({
  id: z.string().uuid().or(z.literal("")).optional(),
  classId: z.string().uuid(),
  title: z.string().min(2, "กรุณากรอกหัวข้อประกาศ").max(200),
  body: z.string().min(2, "กรุณากรอกรายละเอียดประกาศ").max(10000),
  priority: z.enum(["normal", "important", "urgent"]),
  status: z.enum(["draft", "published", "archived"]),
  publishAt: z.string().optional(),
  expiresAt: z.string().optional(),
});

export async function saveAnnouncementAction(
  _previous: Phase6ActionState,
  formData: FormData,
): Promise<Phase6ActionState> {
  try {
    const parsed = announcementSchema.parse({
      id: value(formData, "id"),
      classId: value(formData, "classId"),
      title: value(formData, "title"),
      body: value(formData, "body"),
      priority: value(formData, "priority") || "normal",
      status: value(formData, "status") || "draft",
      publishAt: value(formData, "publishAt"),
      expiresAt: value(formData, "expiresAt"),
    });
    const user = await requireRole("teacher");
    await getTeacherClass(user.id, parsed.classId);
    const supabase = await createClient();
    const publishAt = toIso(parsed.publishAt ?? "");
    const expiresAt = toIso(parsed.expiresAt ?? "");
    if (publishAt && expiresAt && new Date(expiresAt) <= new Date(publishAt)) {
      throw new Error("เวลาสิ้นสุดต้องอยู่หลังเวลาเผยแพร่");
    }
    const payload = {
      class_id: parsed.classId,
      author_id: user.id,
      title: parsed.title,
      body: parsed.body,
      priority: parsed.priority as CommunicationPriority,
      status: parsed.status as AnnouncementStatus,
      publish_at: publishAt,
      expires_at: expiresAt,
      is_pinned: checked(formData, "isPinned"),
    };
    let announcementId = parsed.id || "";
    if (announcementId) {
      const { error } = await supabase.from("announcements").update(payload).eq("id", announcementId);
      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await supabase.from("announcements").insert(payload).select("id").single();
      if (error || !data) throw new Error(error?.message ?? "สร้างประกาศไม่สำเร็จ");
      announcementId = data.id;
    }
    revalidatePath("/teacher");
    revalidatePath("/teacher/communication");
    revalidatePath("/teacher/communication/announcements");
    revalidatePath(`/teacher/communication/announcements/${announcementId}`);
    revalidatePath("/student");
    revalidatePath("/student/communication");
    return {
      success: true,
      message: parsed.id ? "บันทึกประกาศแล้ว" : "สร้างประกาศแล้ว",
      announcementId,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function setAnnouncementStatusAction(formData: FormData) {
  const announcementId = z.string().uuid().parse(value(formData, "announcementId"));
  const status = z.enum(["draft", "published", "archived"]).parse(value(formData, "status"));
  const user = await requireRole("teacher");
  await getAnnouncementDetail(user.id, announcementId);
  const supabase = await createClient();
  const { error } = await supabase.from("announcements").update({ status }).eq("id", announcementId);
  if (error) throw new Error(error.message);
  revalidatePath("/teacher/communication");
  revalidatePath("/teacher/communication/announcements");
  revalidatePath(`/teacher/communication/announcements/${announcementId}`);
  revalidatePath("/student/communication");
}

export async function addAnnouncementExternalAttachmentAction(
  _previous: Phase6ActionState,
  formData: FormData,
): Promise<Phase6ActionState> {
  try {
    const announcementId = z.string().uuid().parse(value(formData, "announcementId"));
    const externalUrl = z.string().url("กรุณากรอกลิงก์ให้ถูกต้อง").parse(value(formData, "externalUrl"));
    const fileName = z.string().min(1, "กรุณากรอกชื่อเอกสาร").max(180).parse(value(formData, "fileName"));
    const user = await requireRole("teacher");
    await getAnnouncementDetail(user.id, announcementId);
    const supabase = await createClient();
    const { error } = await supabase.from("announcement_attachments").insert({
      announcement_id: announcementId,
      external_url: externalUrl,
      file_name: fileName,
    });
    if (error) throw new Error(error.message);
    revalidatePath(`/teacher/communication/announcements/${announcementId}`);
    revalidatePath(`/student/communication/announcements/${announcementId}`);
    return { success: true, message: "เพิ่มลิงก์ประกอบแล้ว", announcementId };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteAnnouncementAttachmentAction(formData: FormData) {
  const attachmentId = z.string().uuid().parse(value(formData, "attachmentId"));
  const announcementId = z.string().uuid().parse(value(formData, "announcementId"));
  const user = await requireRole("teacher");
  await getAnnouncementDetail(user.id, announcementId);
  const supabase = await createClient();
  const { data } = await supabase.from("announcement_attachments").select("storage_path").eq("id", attachmentId).single();
  const { error } = await supabase.from("announcement_attachments").delete().eq("id", attachmentId).eq("announcement_id", announcementId);
  if (error) throw new Error(error.message);
  if (data?.storage_path) await supabase.storage.from("communication-files").remove([data.storage_path]);
  revalidatePath(`/teacher/communication/announcements/${announcementId}`);
  revalidatePath(`/student/communication/announcements/${announcementId}`);
}

export async function markAnnouncementReadAction(formData: FormData) {
  const announcementId = z.string().uuid().parse(value(formData, "announcementId"));
  const user = await requireUser();
  await getAnnouncementDetail(user.id, announcementId);
  const supabase = await createClient();
  const { error } = await supabase.from("announcement_reads").upsert({
    announcement_id: announcementId,
    user_id: user.id,
    read_at: new Date().toISOString(),
  }, { onConflict: "announcement_id,user_id" });
  if (error) throw new Error(error.message);
  revalidatePath("/student");
  revalidatePath("/student/communication");
  revalidatePath(`/student/communication/announcements/${announcementId}`);
}

const createConversationSchema = z.object({
  contactValue: z.string().min(1, "กรุณาเลือกผู้ติดต่อหรือรายวิชา"),
  subject: z.string().min(2, "กรุณากรอกหัวข้อการสนทนา").max(180),
  initialBody: z.string().min(1, "กรุณากรอกข้อความเริ่มต้น").max(5000),
});

export async function createConversationAction(
  _previous: Phase6ActionState,
  formData: FormData,
): Promise<Phase6ActionState> {
  try {
    const parsed = createConversationSchema.parse({
      contactValue: value(formData, "contactValue"),
      subject: value(formData, "subject"),
      initialBody: value(formData, "initialBody"),
    });
    const user = await requireRole("teacher", "student");
    const [classId, studentIdFromValue] = parsed.contactValue.split("|");
    z.string().uuid().parse(classId);
    const targetStudentId = user.profile.role === "student"
      ? user.id
      : z.string().uuid().parse(studentIdFromValue);
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("create_class_conversation", {
      target_class_id: classId,
      target_student_id: targetStudentId,
      conversation_subject: parsed.subject,
      initial_body: parsed.initialBody,
    });
    if (error || !data) throw new Error(error?.message ?? "สร้างการสนทนาไม่สำเร็จ");
    const conversationId = data as string;
    revalidatePath("/teacher/communication");
    revalidatePath("/teacher/communication/messages");
    revalidatePath("/student/communication");
    revalidatePath("/student/communication/messages");
    return { success: true, message: "เปิดการสนทนาแล้ว", conversationId };
  } catch (error) {
    return actionError(error);
  }
}

export async function sendMessageAction(
  _previous: Phase6ActionState,
  formData: FormData,
): Promise<Phase6ActionState> {
  try {
    const conversationId = z.string().uuid().parse(value(formData, "conversationId"));
    const body = z.string().min(1, "กรุณากรอกข้อความ").max(5000).parse(value(formData, "body"));
    const user = await requireRole("teacher", "student");
    await getConversationDetail(user.id, conversationId);
    const supabase = await createClient();
    const { data, error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body,
    }).select("id").single();
    if (error || !data) throw new Error(error?.message ?? "ส่งข้อความไม่สำเร็จ");
    const base = user.profile.role === "teacher" ? "/teacher/communication/messages" : "/student/communication/messages";
    revalidatePath(base);
    revalidatePath(`${base}/${conversationId}`);
    revalidatePath(user.profile.role === "teacher" ? "/teacher" : "/student");
    return { success: true, message: "ส่งข้อความแล้ว", conversationId, messageId: data.id };
  } catch (error) {
    return actionError(error);
  }
}

export async function markConversationReadAction(formData: FormData) {
  const conversationId = z.string().uuid().parse(value(formData, "conversationId"));
  const user = await requireRole("teacher", "student");
  await getConversationDetail(user.id, conversationId);
  const supabase = await createClient();
  const { error } = await supabase.from("conversation_participants").update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath(user.profile.role === "teacher" ? "/teacher/communication" : "/student/communication");
}

export async function setConversationStatusAction(formData: FormData) {
  const conversationId = z.string().uuid().parse(value(formData, "conversationId"));
  const status = z.enum(["active", "closed", "archived"]).parse(value(formData, "status")) as ConversationStatus;
  const user = await requireRole("teacher");
  const detail = await getConversationDetail(user.id, conversationId);
  const supabase = await createClient();
  const { error } = await supabase.from("conversations").update({ status }).eq("id", conversationId);
  if (error) throw new Error(error.message);
  revalidatePath("/teacher/communication/messages");
  revalidatePath(`/teacher/communication/messages/${conversationId}`);
  revalidatePath(`/student/communication/messages/${conversationId}`);
  revalidatePath(`/teacher/classes/${detail.conversation.class_id}`);
}

export async function deleteMessageAttachmentAction(formData: FormData) {
  const attachmentId = z.string().uuid().parse(value(formData, "attachmentId"));
  const conversationId = z.string().uuid().parse(value(formData, "conversationId"));
  const user = await requireRole("teacher", "student");
  await getConversationDetail(user.id, conversationId);
  const supabase = await createClient();
  const { data } = await supabase.from("message_attachments").select("storage_path").eq("id", attachmentId).single();
  const { error } = await supabase.from("message_attachments").delete().eq("id", attachmentId);
  if (error) throw new Error(error.message);
  if (data?.storage_path) await supabase.storage.from("communication-files").remove([data.storage_path]);
  const base = user.profile.role === "teacher" ? "/teacher/communication/messages" : "/student/communication/messages";
  revalidatePath(`${base}/${conversationId}`);
}
