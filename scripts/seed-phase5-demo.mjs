import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function findUserByEmail(email) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const found = data.users.find((user) => user.email === email);
    if (found) return found;
    if (data.users.length < 100) return null;
  }
  return null;
}

function dateOnly(offsetDays) {
  const date = new Date(Date.now() + offsetDays * 86400000);
  return date.toISOString().slice(0, 10);
}

function isoAt(offsetDays, hour, minute = 0) {
  const date = new Date(Date.now() + offsetDays * 86400000);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}

async function ensureCategory(classId, name, weight, orderNo) {
  const { data: existing, error: findError } = await admin.from("grade_categories").select("id").eq("class_id", classId).eq("name", name).maybeSingle();
  if (findError) throw findError;
  if (existing) {
    const { error } = await admin.from("grade_categories").update({ weight_percent: weight, order_no: orderNo, is_active: true }).eq("id", existing.id);
    if (error) throw error;
    return existing.id;
  }
  const { data, error } = await admin.from("grade_categories").insert({ class_id: classId, name, weight_percent: weight, order_no: orderNo, is_active: true }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function ensureSourceItem({ classId, categoryId, sourceType, sourceId, title, maxScore, status, dueAt, orderNo }) {
  const { data: existing, error: findError } = await admin.from("grade_items").select("id").eq("class_id", classId).eq("source_type", sourceType).eq("source_id", sourceId).maybeSingle();
  if (findError) throw findError;
  const payload = { class_id: classId, category_id: categoryId, source_type: sourceType, source_id: sourceId, title, max_score: Math.max(Number(maxScore) || 1, 1), item_weight: 1, status, due_at: dueAt, order_no: orderNo };
  if (existing) {
    const { error } = await admin.from("grade_items").update(payload).eq("id", existing.id);
    if (error) throw error;
    return existing.id;
  }
  const { data, error } = await admin.from("grade_items").insert(payload).select("id").single();
  if (error) throw error;
  return data.id;
}

async function main() {
  const teacher = await findUserByEmail("teacher@tkmooc.local");
  const studentUsers = await Promise.all(["10001", "10002", "10003", "10004"].map((code) => findUserByEmail(`${code}@students.tkmooc.local`)));
  if (!teacher || studentUsers.some((student) => !student)) throw new Error("Run create-demo-users and seed-phase2 before seed-phase5");
  const students = studentUsers.filter(Boolean);

  const { data: classRow, error: classError } = await admin.from("classes").select("id").eq("teacher_id", teacher.id).eq("class_code", "CS-M2-01").single();
  if (classError) throw classError;
  const classId = classRow.id;

  const { data: oldSessions, error: oldError } = await admin.from("attendance_sessions").select("id").eq("class_id", classId).like("title", "[Demo]%");
  if (oldError) throw oldError;
  if (oldSessions?.length) {
    const { error } = await admin.from("attendance_sessions").delete().in("id", oldSessions.map((row) => row.id));
    if (error) throw error;
  }

  const sessionPayloads = [
    { class_id: classId, title: "[Demo] เช็กชื่อบทเรียนแนวคิดเชิงคำนวณ", session_date: dateOnly(-2), period_label: "คาบ 2", opens_at: isoAt(-2, 2, 20), closes_at: isoAt(-2, 3, 10), late_after_minutes: 15, allow_self_checkin: true, check_in_code: "510201", status: "closed", created_by: teacher.id },
    { class_id: classId, title: "[Demo] เช็กชื่อกิจกรรมผังงาน", session_date: dateOnly(-1), period_label: "คาบ 4", opens_at: isoAt(-1, 5, 10), closes_at: isoAt(-1, 6, 0), late_after_minutes: 10, allow_self_checkin: true, check_in_code: "510202", status: "closed", created_by: teacher.id },
    { class_id: classId, title: "[Demo] เช็กชื่อวันนี้", session_date: dateOnly(0), period_label: "คาบ 5", opens_at: new Date(Date.now() - 15 * 60000).toISOString(), closes_at: new Date(Date.now() + 45 * 60000).toISOString(), late_after_minutes: 15, allow_self_checkin: true, check_in_code: "510203", status: "open", created_by: teacher.id },
  ];
  const { data: sessions, error: sessionError } = await admin.from("attendance_sessions").insert(sessionPayloads).select("id, title, status");
  if (sessionError) throw sessionError;

  const statuses = [
    ["present", "present", "late", "absent"],
    ["present", "late", "present", "leave"],
    ["present", "unmarked", "unmarked", "unmarked"],
  ];
  const records = sessions.flatMap((session, sessionIndex) => students.map((student, studentIndex) => ({
    session_id: session.id,
    student_id: student.id,
    status: statuses[sessionIndex][studentIndex],
    checked_in_at: ["present", "late", "activity"].includes(statuses[sessionIndex][studentIndex]) ? new Date(Date.now() - studentIndex * 180000).toISOString() : null,
    check_in_method: studentIndex === 0 ? "code" : "manual",
    note: statuses[sessionIndex][studentIndex] === "leave" ? "แจ้งลากิจล่วงหน้า" : null,
    marked_by: teacher.id,
  })));
  const { error: recordError } = await admin.from("attendance_records").insert(records);
  if (recordError) throw recordError;

  const assignmentCategoryId = await ensureCategory(classId, "งานและการส่งงาน", 40, 1);
  const quizCategoryId = await ensureCategory(classId, "แบบทดสอบ", 40, 2);
  const customCategoryId = await ensureCategory(classId, "คะแนนอื่น ๆ", 20, 3);
  const { error: settingsError } = await admin.from("grade_settings").upsert({ class_id: classId, calculation_method: "weighted_categories", publish_final_grade: true, minimum_attendance_percent: 80 }, { onConflict: "class_id" });
  if (settingsError) throw settingsError;

  const { data: assignments, error: assignmentError } = await admin.from("assignments").select("id, title, max_score, status, due_at, created_at").eq("class_id", classId).neq("status", "archived").order("created_at");
  if (assignmentError) throw assignmentError;
  for (const [index, assignment] of (assignments ?? []).entries()) {
    await ensureSourceItem({ classId, categoryId: assignmentCategoryId, sourceType: "assignment", sourceId: assignment.id, title: assignment.title, maxScore: assignment.max_score, status: ["published", "closed"].includes(assignment.status) ? "published" : "draft", dueAt: assignment.due_at, orderNo: index + 1 });
  }

  const { data: quizzes, error: quizError } = await admin.from("quizzes").select("id, title, total_points, status, close_at, created_at").eq("class_id", classId).neq("status", "archived").order("created_at");
  if (quizError) throw quizError;
  for (const [index, quiz] of (quizzes ?? []).entries()) {
    await ensureSourceItem({ classId, categoryId: quizCategoryId, sourceType: "quiz", sourceId: quiz.id, title: quiz.title, maxScore: quiz.total_points, status: ["published", "closed"].includes(quiz.status) ? "published" : "draft", dueAt: quiz.close_at, orderNo: index + 1 });
  }

  const { data: oldCustom, error: customFindError } = await admin.from("grade_items").select("id").eq("class_id", classId).eq("source_type", "custom").eq("title", "คะแนนกิจกรรมในชั้นเรียน").maybeSingle();
  if (customFindError) throw customFindError;
  let customItemId = oldCustom?.id;
  if (customItemId) {
    const { error } = await admin.from("grade_items").update({ category_id: customCategoryId, max_score: 10, item_weight: 1, status: "published", order_no: 1 }).eq("id", customItemId);
    if (error) throw error;
  } else {
    const { data, error } = await admin.from("grade_items").insert({ class_id: classId, category_id: customCategoryId, source_type: "custom", source_id: null, title: "คะแนนกิจกรรมในชั้นเรียน", description: "การมีส่วนร่วม การตอบคำถาม และการทำงานร่วมกับเพื่อน", max_score: 10, item_weight: 1, status: "published", order_no: 1 }).select("id").single();
    if (error) throw error;
    customItemId = data.id;
  }

  const customScores = [9, 8, 7.5, 6];
  const { error: gradeError } = await admin.from("grade_entries").upsert(students.map((student, index) => ({ grade_item_id: customItemId, student_id: student.id, score: customScores[index], is_excused: false, feedback: index === 0 ? "มีส่วนร่วมสม่ำเสมอ" : null, graded_by: teacher.id, graded_at: new Date().toISOString() })), { onConflict: "grade_item_id,student_id" });
  if (gradeError) throw gradeError;

  console.log("Phase 5 demo data created successfully");
  console.log("Open attendance code: 510203");
  console.log("Gradebook includes assignment, quiz, and custom activity scores.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
