"use server";

import { revalidatePath } from "next/cache";
import { z, ZodError } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type Phase2ActionState = {
  success?: boolean;
  message?: string;
  error?: string;
};

const classSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  classCode: z.string().trim().min(2, "กรุณากรอกรหัสวิชา"),
  subjectName: z.string().trim().min(2, "กรุณากรอกชื่อรายวิชา"),
  className: z.string().trim().min(2, "กรุณากรอกชื่อชั้นเรียน"),
  level: z.string().trim().optional(),
  room: z.string().trim().optional(),
  semester: z.coerce.number().int().min(1).max(3),
  academicYear: z.coerce.number().int().min(2500).max(3000),
  description: z.string().trim().optional(),
  onlineMeetingUrl: z.string().trim().url("ลิงก์ห้องเรียนออนไลน์ไม่ถูกต้อง").optional().or(z.literal("")),
  courseColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "รหัสสีไม่ถูกต้อง"),
  status: z.enum(["active", "inactive", "archived"]),
});

const unitSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  classId: z.string().uuid(),
  title: z.string().trim().min(2, "กรุณากรอกชื่อหน่วยการเรียนรู้"),
  description: z.string().trim().optional(),
  objectives: z.string().trim().optional(),
  orderNo: z.coerce.number().int().min(1),
  status: z.enum(["draft", "published", "archived"]),
  publishAt: z.string().optional(),
});

const lessonSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  unitId: z.string().uuid(),
  classId: z.string().uuid(),
  title: z.string().trim().min(2, "กรุณากรอกชื่อบทเรียน"),
  summary: z.string().trim().optional(),
  objectives: z.string().trim().optional(),
  orderNo: z.coerce.number().int().min(1),
  estimatedMinutes: z.coerce.number().int().min(1).max(600),
  status: z.enum(["draft", "published", "archived"]),
  publishAt: z.string().optional(),
  coverPath: z.string().trim().optional(),
});

const blockSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  lessonId: z.string().uuid(),
  classId: z.string().uuid(),
  blockType: z.enum(["text", "image", "video", "file", "link", "activity"]),
  title: z.string().trim().optional(),
  body: z.string().trim().optional(),
  externalUrl: z.string().trim().url("ลิงก์ไม่ถูกต้อง").optional().or(z.literal("")),
  storagePath: z.string().trim().optional(),
  orderNo: z.coerce.number().int().min(1),
  isRequired: z.string().optional(),
  question: z.string().trim().optional(),
  responseType: z.enum(["text", "long_text"]).optional(),
});

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function optionalDate(valueToParse: string) {
  if (!valueToParse) return null;
  const date = new Date(valueToParse);
  if (Number.isNaN(date.getTime())) throw new Error("วันและเวลาไม่ถูกต้อง");
  return date.toISOString();
}

function actionError(error: unknown): Phase2ActionState {
  console.error(error);
  if (error instanceof ZodError) {
    return { error: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
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

export async function saveClassAction(
  _previousState: Phase2ActionState,
  formData: FormData,
): Promise<Phase2ActionState> {
  try {
    const user = await requireRole("teacher");
    const parsed = classSchema.parse({
      id: value(formData, "id"),
      classCode: value(formData, "classCode"),
      subjectName: value(formData, "subjectName"),
      className: value(formData, "className"),
      level: value(formData, "level"),
      room: value(formData, "room"),
      semester: value(formData, "semester"),
      academicYear: value(formData, "academicYear"),
      description: value(formData, "description"),
      onlineMeetingUrl: value(formData, "onlineMeetingUrl"),
      courseColor: value(formData, "courseColor") || "#0d5ba7",
      status: value(formData, "status") || "active",
    });

    const supabase = await createClient();
    const payload = {
      teacher_id: user.id,
      class_code: parsed.classCode,
      subject_name: parsed.subjectName,
      class_name: parsed.className,
      level: parsed.level || null,
      room: parsed.room || null,
      semester: parsed.semester,
      academic_year: parsed.academicYear,
      description: parsed.description || null,
      online_meeting_url: parsed.onlineMeetingUrl || null,
      course_color: parsed.courseColor,
      status: parsed.status,
    };

    const result = parsed.id
      ? await supabase.from("classes").update(payload).eq("id", parsed.id).eq("teacher_id", user.id)
      : await supabase.from("classes").insert(payload);

    if (result.error) throw new Error(result.error.message);
    revalidatePath("/teacher");
    revalidatePath("/teacher/classes");
    if (parsed.id) revalidatePath(`/teacher/classes/${parsed.id}`);
    return { success: true, message: parsed.id ? "บันทึกชั้นเรียนแล้ว" : "สร้างชั้นเรียนเรียบร้อยแล้ว" };
  } catch (error) {
    return actionError(error);
  }
}

export async function archiveClassAction(formData: FormData) {
  const classId = value(formData, "classId");
  const user = await assertTeacherOwnsClass(classId);
  const supabase = await createClient();
  const { error } = await supabase
    .from("classes")
    .update({ status: "archived" })
    .eq("id", classId)
    .eq("teacher_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/teacher");
  revalidatePath("/teacher/classes");
}

export async function saveUnitAction(
  _previousState: Phase2ActionState,
  formData: FormData,
): Promise<Phase2ActionState> {
  try {
    const parsed = unitSchema.parse({
      id: value(formData, "id"),
      classId: value(formData, "classId"),
      title: value(formData, "title"),
      description: value(formData, "description"),
      objectives: value(formData, "objectives"),
      orderNo: value(formData, "orderNo"),
      status: value(formData, "status"),
      publishAt: value(formData, "publishAt"),
    });
    await assertTeacherOwnsClass(parsed.classId);
    const supabase = await createClient();
    const payload = {
      class_id: parsed.classId,
      title: parsed.title,
      description: parsed.description || null,
      objectives: parsed.objectives || null,
      order_no: parsed.orderNo,
      status: parsed.status,
      publish_at: optionalDate(parsed.publishAt ?? ""),
    };
    const result = parsed.id
      ? await supabase.from("units").update(payload).eq("id", parsed.id).eq("class_id", parsed.classId)
      : await supabase.from("units").insert(payload);
    if (result.error) throw new Error(result.error.message);
    revalidatePath(`/teacher/classes/${parsed.classId}`);
    revalidatePath(`/teacher/classes/${parsed.classId}/curriculum`);
    revalidatePath(`/student/courses/${parsed.classId}`);
    return { success: true, message: parsed.id ? "บันทึกหน่วยการเรียนรู้แล้ว" : "เพิ่มหน่วยการเรียนรู้แล้ว" };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteUnitAction(formData: FormData) {
  const classId = value(formData, "classId");
  const unitId = value(formData, "unitId");
  await assertTeacherOwnsClass(classId);
  const supabase = await createClient();
  const { error } = await supabase.from("units").delete().eq("id", unitId).eq("class_id", classId);
  if (error) throw new Error(error.message);
  revalidatePath(`/teacher/classes/${classId}/curriculum`);
  revalidatePath(`/student/courses/${classId}`);
}

export async function saveLessonAction(
  _previousState: Phase2ActionState,
  formData: FormData,
): Promise<Phase2ActionState> {
  try {
    const parsed = lessonSchema.parse({
      id: value(formData, "id"),
      unitId: value(formData, "unitId"),
      classId: value(formData, "classId"),
      title: value(formData, "title"),
      summary: value(formData, "summary"),
      objectives: value(formData, "objectives"),
      orderNo: value(formData, "orderNo"),
      estimatedMinutes: value(formData, "estimatedMinutes"),
      status: value(formData, "status"),
      publishAt: value(formData, "publishAt"),
      coverPath: value(formData, "coverPath"),
    });
    await assertTeacherOwnsClass(parsed.classId);
    const supabase = await createClient();
    const { data: unit } = await supabase
      .from("units")
      .select("id")
      .eq("id", parsed.unitId)
      .eq("class_id", parsed.classId)
      .single();
    if (!unit) throw new Error("ไม่พบหน่วยการเรียนรู้");

    const payload = {
      unit_id: parsed.unitId,
      title: parsed.title,
      summary: parsed.summary || null,
      objectives: parsed.objectives || null,
      order_no: parsed.orderNo,
      estimated_minutes: parsed.estimatedMinutes,
      status: parsed.status,
      publish_at: optionalDate(parsed.publishAt ?? ""),
      cover_path: parsed.coverPath || null,
    };
    const result = parsed.id
      ? await supabase.from("lessons").update(payload).eq("id", parsed.id).eq("unit_id", parsed.unitId)
      : await supabase.from("lessons").insert(payload);
    if (result.error) throw new Error(result.error.message);
    revalidatePath(`/teacher/classes/${parsed.classId}/curriculum`);
    if (parsed.id) revalidatePath(`/teacher/lessons/${parsed.id}`);
    revalidatePath(`/student/courses/${parsed.classId}`);
    return { success: true, message: parsed.id ? "บันทึกบทเรียนแล้ว" : "เพิ่มบทเรียนแล้ว" };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteLessonAction(formData: FormData) {
  const classId = value(formData, "classId");
  const lessonId = value(formData, "lessonId");
  await assertTeacherOwnsClass(classId);
  const supabase = await createClient();
  const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
  if (error) throw new Error(error.message);
  revalidatePath(`/teacher/classes/${classId}/curriculum`);
  revalidatePath(`/student/courses/${classId}`);
}

export async function saveLessonBlockAction(
  _previousState: Phase2ActionState,
  formData: FormData,
): Promise<Phase2ActionState> {
  try {
    const parsed = blockSchema.parse({
      id: value(formData, "id"),
      lessonId: value(formData, "lessonId"),
      classId: value(formData, "classId"),
      blockType: value(formData, "blockType"),
      title: value(formData, "title"),
      body: value(formData, "body"),
      externalUrl: value(formData, "externalUrl"),
      storagePath: value(formData, "storagePath"),
      orderNo: value(formData, "orderNo"),
      isRequired: value(formData, "isRequired"),
      question: value(formData, "question"),
      responseType: value(formData, "responseType") || "long_text",
    });
    await assertTeacherOwnsClass(parsed.classId);
    const supabase = await createClient();
    const { data: lesson } = await supabase
      .from("lessons")
      .select("id, unit_id")
      .eq("id", parsed.lessonId)
      .single();
    if (!lesson) throw new Error("ไม่พบบทเรียน");
    const { data: lessonUnit } = await supabase
      .from("units")
      .select("id, class_id")
      .eq("id", lesson.unit_id)
      .eq("class_id", parsed.classId)
      .single();
    if (!lessonUnit) throw new Error("บทเรียนไม่อยู่ในชั้นเรียนนี้");

    const metadata = parsed.blockType === "activity"
      ? { question: parsed.question || parsed.title || "คำถามระหว่างบท", responseType: parsed.responseType || "long_text" }
      : {};
    const payload = {
      lesson_id: parsed.lessonId,
      block_type: parsed.blockType,
      title: parsed.title || null,
      body: parsed.body || null,
      external_url: parsed.externalUrl || null,
      storage_path: parsed.storagePath || null,
      metadata,
      order_no: parsed.orderNo,
      is_required: parsed.isRequired === "on",
    };
    const result = parsed.id
      ? await supabase.from("lesson_blocks").update(payload).eq("id", parsed.id).eq("lesson_id", parsed.lessonId)
      : await supabase.from("lesson_blocks").insert(payload);
    if (result.error) throw new Error(result.error.message);
    revalidatePath(`/teacher/lessons/${parsed.lessonId}`);
    revalidatePath(`/student/lessons/${parsed.lessonId}`);
    return { success: true, message: parsed.id ? "บันทึกเนื้อหาแล้ว" : "เพิ่มเนื้อหาในบทเรียนแล้ว" };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteLessonBlockAction(formData: FormData) {
  const classId = value(formData, "classId");
  const lessonId = value(formData, "lessonId");
  const blockId = value(formData, "blockId");
  await assertTeacherOwnsClass(classId);
  const supabase = await createClient();
  const { error } = await supabase
    .from("lesson_blocks")
    .delete()
    .eq("id", blockId)
    .eq("lesson_id", lessonId);
  if (error) throw new Error(error.message);
  revalidatePath(`/teacher/lessons/${lessonId}`);
  revalidatePath(`/student/lessons/${lessonId}`);
}

export async function enrollExistingStudentAction(
  _previousState: Phase2ActionState,
  formData: FormData,
): Promise<Phase2ActionState> {
  try {
    const classId = z.string().uuid().parse(value(formData, "classId"));
    const studentCode = z.string().regex(/^\d{5}$/, "รหัสนักเรียนต้องเป็นตัวเลข 5 หลัก").parse(value(formData, "studentCode"));
    const number = value(formData, "studentNumber");
    const groupName = value(formData, "groupName").trim();
    await assertTeacherOwnsClass(classId);
    const supabase = await createClient();
    const { data: student, error: studentError } = await supabase
      .from("student_profiles")
      .select("user_id")
      .eq("student_code", studentCode)
      .single();
    if (studentError || !student) throw new Error("ไม่พบนักเรียนรหัสนี้ กรุณานำเข้ารายชื่อนักเรียนก่อน");
    const { error } = await supabase.from("enrollments").upsert(
      {
        class_id: classId,
        student_id: student.user_id,
        student_number: number ? Number(number) : null,
        group_name: groupName || null,
        status: "active",
      },
      { onConflict: "class_id,student_id" },
    );
    if (error) throw new Error(error.message);
    revalidatePath(`/teacher/classes/${classId}`);
    revalidatePath(`/teacher/classes/${classId}/students`);
    return { success: true, message: `เพิ่มนักเรียน ${studentCode} เข้าชั้นเรียนแล้ว` };
  } catch (error) {
    return actionError(error);
  }
}

export async function removeEnrollmentAction(formData: FormData) {
  const classId = value(formData, "classId");
  const enrollmentId = value(formData, "enrollmentId");
  await assertTeacherOwnsClass(classId);
  const supabase = await createClient();
  const { error } = await supabase
    .from("enrollments")
    .delete()
    .eq("id", enrollmentId)
    .eq("class_id", classId);
  if (error) throw new Error(error.message);
  revalidatePath(`/teacher/classes/${classId}/students`);
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

async function loadAuthUsersByEmail() {
  const admin = createAdminClient();
  const users = new Map<string, { id: string; email?: string | null }>();
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    for (const item of data.users as Array<{ id: string; email?: string | null }>) {
      if (item.email) users.set(item.email, item);
    }
    if (data.users.length < 100) break;
  }
  return users;
}

export async function importStudentsAction(
  _previousState: Phase2ActionState,
  formData: FormData,
): Promise<Phase2ActionState> {
  try {
    const classId = z.string().uuid().parse(value(formData, "classId"));
    await assertTeacherOwnsClass(classId);
    const csvText = value(formData, "csvText").trim();
    if (!csvText) throw new Error("กรุณาวางข้อมูล CSV");
    const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length > 101) throw new Error("นำเข้าได้ครั้งละไม่เกิน 100 คน");

    const header = parseCsvLine(lines[0]).map((item) => item.toLowerCase());
    const expected = ["student_code", "title", "first_name", "last_name", "nickname", "level", "room", "student_number", "pin", "group_name"];
    const hasHeader = expected.every((field) => header.includes(field));
    const dataLines = hasHeader ? lines.slice(1) : lines;
    const admin = createAdminClient();
    const authUsersByEmail = await loadAuthUsersByEmail();
    let imported = 0;
    const failures: string[] = [];

    for (const [index, line] of dataLines.entries()) {
      try {
        const columns = parseCsvLine(line);
        const row = hasHeader
          ? Object.fromEntries(header.map((field, columnIndex) => [field, columns[columnIndex] ?? ""]))
          : Object.fromEntries(expected.map((field, columnIndex) => [field, columns[columnIndex] ?? ""]));
        const studentCode = z.string().regex(/^\d{5}$/).parse(row.student_code);
        const firstName = z.string().min(1).parse(row.first_name);
        const lastName = z.string().min(1).parse(row.last_name);
        const pin = row.pin || "123456";
        if (pin.length < 6) throw new Error("PIN ต้องมีอย่างน้อย 6 ตัวอักษร");
        const email = `${studentCode}@students.tkmooc.local`;
        const displayName = [row.title, firstName, lastName].filter(Boolean).join(" ");
        let authUser = authUsersByEmail.get(email) ?? null;
        if (!authUser) {
          const { data, error } = await admin.auth.admin.createUser({
            email,
            password: pin,
            email_confirm: true,
            user_metadata: { display_name: displayName },
          });
          if (error) throw error;
          authUser = data.user;
          if (authUser) authUsersByEmail.set(email, authUser);
        }
        if (!authUser) throw new Error("ไม่สามารถสร้างบัญชีได้");

        const { error: profileError } = await admin.from("profiles").upsert({
          id: authUser.id,
          role: "student",
          display_name: displayName,
          status: "active",
        });
        if (profileError) throw profileError;
        const { error: studentError } = await admin.from("student_profiles").upsert({
          user_id: authUser.id,
          student_code: studentCode,
          title: row.title || null,
          first_name: firstName,
          last_name: lastName,
          nickname: row.nickname || null,
          level: row.level || null,
          room: row.room || null,
          student_number: row.student_number ? Number(row.student_number) : null,
        });
        if (studentError) throw studentError;
        const { error: enrollmentError } = await admin.from("enrollments").upsert(
          {
            class_id: classId,
            student_id: authUser.id,
            student_number: row.student_number ? Number(row.student_number) : null,
            group_name: row.group_name || null,
            status: "active",
          },
          { onConflict: "class_id,student_id" },
        );
        if (enrollmentError) throw enrollmentError;
        imported += 1;
      } catch (rowError) {
        failures.push(`บรรทัด ${index + (hasHeader ? 2 : 1)}: ${rowError instanceof Error ? rowError.message : "ข้อมูลไม่ถูกต้อง"}`);
      }
    }

    revalidatePath(`/teacher/classes/${classId}`);
    revalidatePath(`/teacher/classes/${classId}/students`);
    return {
      success: imported > 0,
      message: `นำเข้าสำเร็จ ${imported} คน${failures.length ? ` · ไม่สำเร็จ ${failures.length} คน` : ""}`,
      error: failures.length ? failures.slice(0, 5).join(" | ") : undefined,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateLessonProgressAction(formData: FormData) {
  const user = await requireRole("student");
  const lessonId = z.string().uuid().parse(value(formData, "lessonId"));
  const nextStatus = z.enum(["in_progress", "completed"]).parse(value(formData, "status"));
  const supabase = await createClient();
  const now = new Date().toISOString();
  const payload = {
    lesson_id: lessonId,
    student_id: user.id,
    status: nextStatus,
    progress_percent: nextStatus === "completed" ? 100 : 25,
    started_at: now,
    completed_at: nextStatus === "completed" ? now : null,
    last_viewed_at: now,
  };
  const { error } = await supabase.from("lesson_progress").upsert(payload, { onConflict: "lesson_id,student_id" });
  if (error) throw new Error(error.message);
  revalidatePath(`/student/lessons/${lessonId}`);
  revalidatePath("/student");
  revalidatePath("/student/courses");
}

export async function saveActivityResponseAction(
  _previousState: Phase2ActionState,
  formData: FormData,
): Promise<Phase2ActionState> {
  try {
    const user = await requireRole("student");
    const lessonId = z.string().uuid().parse(value(formData, "lessonId"));
    const blockId = z.string().uuid().parse(value(formData, "blockId"));
    const responseText = z.string().trim().min(1, "กรุณากรอกคำตอบ").parse(value(formData, "responseText"));
    const supabase = await createClient();
    const { error } = await supabase.from("lesson_responses").upsert(
      {
        lesson_block_id: blockId,
        student_id: user.id,
        response_text: responseText,
        response_json: {},
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "lesson_block_id,student_id" },
    );
    if (error) throw new Error(error.message);
    revalidatePath(`/student/lessons/${lessonId}`);
    return { success: true, message: "บันทึกคำตอบแล้ว" };
  } catch (error) {
    return actionError(error);
  }
}
