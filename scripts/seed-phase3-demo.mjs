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

function daysFromNow(days) {
  return new Date(Date.now() + days * 86400000).toISOString();
}

async function ensureAssignment(classId, title, payload) {
  const { data: existing } = await admin.from("assignments").select("id").eq("class_id", classId).eq("title", title).maybeSingle();
  if (existing) {
    const { error } = await admin.from("assignments").update({ ...payload, title }).eq("id", existing.id);
    if (error) throw error;
    return existing.id;
  }
  const { data, error } = await admin.from("assignments").insert({ class_id: classId, title, ...payload }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function main() {
  const teacher = await findUserByEmail("teacher@tkmooc.local");
  const student1 = await findUserByEmail("10001@students.tkmooc.local");
  const student2 = await findUserByEmail("10002@students.tkmooc.local");
  if (!teacher || !student1 || !student2) throw new Error("Run npm run create-demo-users and npm run seed-phase2 before seed-phase3");

  const { data: classRow, error: classError } = await admin.from("classes").select("id").eq("teacher_id", teacher.id).eq("class_code", "CS-M2-01").single();
  if (classError) throw classError;

  await admin.from("enrollments").update({ group_name: "กลุ่ม A" }).eq("class_id", classRow.id).eq("student_id", student1.id);

  const assignment1 = await ensureAssignment(classRow.id, "ใบงานการแยกย่อยปัญหา", {
    instructions: "เลือกปัญหาใกล้ตัว 1 เรื่อง แบ่งปัญหาออกเป็นส่วนย่อยอย่างน้อย 4 ส่วน และอธิบายวิธีดำเนินการแต่ละส่วนให้ชัดเจน",
    work_type: "individual",
    max_score: 20,
    passing_score: 12,
    publish_at: new Date().toISOString(),
    due_at: daysFromNow(5),
    allow_late: true,
    allow_resubmit: true,
    target_mode: "class",
    target_group_name: null,
    allowed_submission_types: ["text", "file", "image", "link"],
    status: "published",
  });

  const assignment2 = await ensureAssignment(classRow.id, "สร้าง Flowchart ระบบสั่งอาหาร", {
    instructions: "ออกแบบ Flowchart ตั้งแต่รับรายการอาหาร ตรวจสอบเงิน ชำระเงิน และแสดงผลการสั่งซื้อ สามารถส่งเป็นรูปภาพ PDF หรือลิงก์ผลงานได้",
    work_type: "individual",
    max_score: 30,
    passing_score: 18,
    publish_at: new Date().toISOString(),
    due_at: daysFromNow(10),
    allow_late: false,
    allow_resubmit: true,
    target_mode: "class",
    target_group_name: null,
    allowed_submission_types: ["file", "image", "link"],
    status: "published",
  });

  const assignment3 = await ensureAssignment(classRow.id, "ภารกิจกลุ่ม: ออกแบบเกมแก้ปัญหา", {
    instructions: "สมาชิกในกลุ่มร่วมกันออกแบบแนวคิดเกมเพื่อสอนการคิดเชิงคำนวณ ส่งรายละเอียด แนวคิดหน้าจอ และลิงก์ต้นแบบ",
    work_type: "group",
    max_score: 40,
    passing_score: 24,
    publish_at: new Date().toISOString(),
    due_at: daysFromNow(14),
    allow_late: true,
    allow_resubmit: true,
    target_mode: "group",
    target_group_name: "กลุ่ม A",
    allowed_submission_types: ["text", "file", "image", "video", "link"],
    status: "published",
  });

  await ensureAssignment(classRow.id, "แบบฝึกหัดฉบับร่างของครู", {
    instructions: "รายการนี้เป็นฉบับร่าง นักเรียนจะยังไม่เห็นจนกว่าครูจะเผยแพร่",
    work_type: "individual",
    max_score: 10,
    passing_score: 6,
    publish_at: null,
    due_at: daysFromNow(21),
    allow_late: true,
    allow_resubmit: true,
    target_mode: "class",
    target_group_name: null,
    allowed_submission_types: ["text"],
    status: "draft",
  });

  const { data: attachment } = await admin.from("assignment_attachments").select("id").eq("assignment_id", assignment2).eq("external_url", "https://app.diagrams.net/").maybeSingle();
  if (!attachment) {
    const { error } = await admin.from("assignment_attachments").insert({ assignment_id: assignment2, external_url: "https://app.diagrams.net/", file_name: "เครื่องมือวาด Flowchart ออนไลน์" });
    if (error) throw error;
  }

  const { error: submission1Error } = await admin.from("submissions").upsert({
    assignment_id: assignment1,
    submitted_by: student1.id,
    answer_text: "ปัญหา: การจัดกิจกรรมค่ายคอมพิวเตอร์\n1. กำหนดเป้าหมาย\n2. แบ่งหน้าที่ทีมงาน\n3. เตรียมสถานที่และอุปกรณ์\n4. ประเมินผลกิจกรรม",
    status: "revision_required",
    submitted_at: new Date().toISOString(),
    teacher_feedback: "วิเคราะห์ได้ดีแล้ว กรุณาเพิ่มรายละเอียดวิธีดำเนินการของแต่ละส่วน และยกตัวอย่างผู้รับผิดชอบ",
    reviewed_at: new Date().toISOString(),
    reviewed_by: teacher.id,
    revision_count: 0,
  }, { onConflict: "assignment_id,submitted_by" });
  if (submission1Error) throw submission1Error;

  const { error: submission2Error } = await admin.from("submissions").upsert({
    assignment_id: assignment1,
    submitted_by: student2.id,
    answer_text: "ปัญหา: การเตรียมตัวสอบ แบ่งเป็นการรวบรวมเนื้อหา วางตารางอ่าน ทำแบบฝึกหัด และทบทวนข้อผิดพลาด",
    status: "submitted",
    submitted_at: new Date().toISOString(),
    revision_count: 0,
  }, { onConflict: "assignment_id,submitted_by" });
  if (submission2Error) throw submission2Error;

  console.log("Phase 3 demo data created successfully");
  console.log(`Assignments: ${assignment1}, ${assignment2}, ${assignment3}`);
  console.log("10001 has a revision-required submission; 10002 has a pending review submission.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
