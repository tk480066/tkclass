import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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

async function ensureStudent(row) {
  const email = `${row.code}@students.tkmooc.local`;
  let user = await findUserByEmail(email);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: row.pin,
      email_confirm: true,
      user_metadata: { display_name: `${row.title}${row.firstName} ${row.lastName}` },
    });
    if (error) throw error;
    user = data.user;
  }
  if (!user) throw new Error(`Cannot create ${row.code}`);

  const displayName = `${row.title}${row.firstName} ${row.lastName}`;
  let result = await admin.from("profiles").upsert({ id: user.id, role: "student", display_name: displayName, status: "active" });
  if (result.error) throw result.error;
  result = await admin.from("student_profiles").upsert({
    user_id: user.id,
    student_code: row.code,
    title: row.title,
    first_name: row.firstName,
    last_name: row.lastName,
    nickname: row.nickname,
    level: "ม.2",
    room: "1",
    student_number: row.number,
  });
  if (result.error) throw result.error;
  return user;
}

async function ensureUnit(classId, payload) {
  const { data: existing } = await admin.from("units").select("id").eq("class_id", classId).eq("title", payload.title).maybeSingle();
  if (existing) {
    const { error } = await admin.from("units").update(payload).eq("id", existing.id);
    if (error) throw error;
    return existing.id;
  }
  const { data, error } = await admin.from("units").insert({ class_id: classId, ...payload }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function ensureLesson(unitId, payload) {
  const { data: existing } = await admin.from("lessons").select("id").eq("unit_id", unitId).eq("title", payload.title).maybeSingle();
  if (existing) {
    const { error } = await admin.from("lessons").update(payload).eq("id", existing.id);
    if (error) throw error;
    return existing.id;
  }
  const { data, error } = await admin.from("lessons").insert({ unit_id: unitId, ...payload }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function ensureBlock(lessonId, payload) {
  const { data: existing } = await admin.from("lesson_blocks").select("id").eq("lesson_id", lessonId).eq("order_no", payload.order_no).maybeSingle();
  if (existing) {
    const { error } = await admin.from("lesson_blocks").update(payload).eq("id", existing.id);
    if (error) throw error;
    return existing.id;
  }
  const { data, error } = await admin.from("lesson_blocks").insert({ lesson_id: lessonId, ...payload }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function main() {
  const teacher = await findUserByEmail("teacher@tkmooc.local");
  const demoStudent = await findUserByEmail("10001@students.tkmooc.local");
  if (!teacher || !demoStudent) throw new Error("Run npm run create-demo-users before seed-phase2");

  const { data: classRow, error: classError } = await admin
    .from("classes")
    .select("id")
    .eq("teacher_id", teacher.id)
    .eq("class_code", "CS-M2-01")
    .single();
  if (classError) throw classError;

  const students = [
    { code: "10002", pin: "123456", title: "เด็กหญิง", firstName: "พิมพ์ชนก", lastName: "เรียนดี", nickname: "พิม", number: 2, group: "กลุ่ม A" },
    { code: "10003", pin: "123456", title: "เด็กชาย", firstName: "กิตติพงศ์", lastName: "สร้างสรรค์", nickname: "กิต", number: 3, group: "กลุ่ม B" },
    { code: "10004", pin: "123456", title: "เด็กหญิง", firstName: "ณัฐชา", lastName: "ขยันยิ่ง", nickname: "ชา", number: 4, group: "กลุ่ม B" },
  ];

  for (const row of students) {
    const student = await ensureStudent(row);
    const { error } = await admin.from("enrollments").upsert({
      class_id: classRow.id,
      student_id: student.id,
      student_number: row.number,
      group_name: row.group,
      status: "active",
    }, { onConflict: "class_id,student_id" });
    if (error) throw error;
  }

  const unit1 = await ensureUnit(classRow.id, {
    title: "หน่วยที่ 1 แนวคิดเชิงคำนวณ",
    description: "เรียนรู้การแยกย่อยปัญหา การหารูปแบบ นามธรรม และการออกแบบขั้นตอนวิธี",
    objectives: "อธิบายองค์ประกอบของแนวคิดเชิงคำนวณได้\nประยุกต์ใช้แนวคิดเชิงคำนวณแก้ปัญหาใกล้ตัวได้",
    order_no: 1,
    status: "published",
    publish_at: new Date().toISOString(),
  });

  const lesson1 = await ensureLesson(unit1, {
    title: "การแยกย่อยปัญหา",
    summary: "แบ่งปัญหาใหญ่เป็นส่วนย่อยเพื่อให้วิเคราะห์และแก้ไขได้ง่ายขึ้น",
    objectives: "วิเคราะห์สถานการณ์และแบ่งปัญหาเป็นงานย่อยได้",
    order_no: 1,
    estimated_minutes: 25,
    status: "published",
    publish_at: new Date().toISOString(),
  });

  await ensureBlock(lesson1, {
    block_type: "text",
    title: "Decomposition คืออะไร",
    body: "การแยกย่อยปัญหา (Decomposition) คือการแบ่งปัญหาที่ซับซ้อนออกเป็นส่วนย่อย แต่ละส่วนสามารถวิเคราะห์และจัดการได้ง่ายขึ้น จากนั้นจึงนำผลลัพธ์กลับมาประกอบเป็นคำตอบของปัญหาใหญ่",
    order_no: 1,
    is_required: true,
  });
  await ensureBlock(lesson1, {
    block_type: "video",
    title: "วิดีโอประกอบบทเรียน",
    body: "ดูวิดีโอและจดประเด็นสำคัญเกี่ยวกับการแยกย่อยปัญหา",
    external_url: "https://www.youtube.com/watch?v=TF84fbW46JQ",
    order_no: 2,
    is_required: true,
  });
  await ensureBlock(lesson1, {
    block_type: "activity",
    title: "ลองคิดดู",
    body: "ยกตัวอย่างสถานการณ์หนึ่งในชีวิตประจำวันที่สามารถใช้การแยกย่อยปัญหาได้",
    metadata: { question: "คุณจะแบ่งสถานการณ์ดังกล่าวออกเป็นงานย่อยอย่างไร", responseType: "long_text" },
    order_no: 3,
    is_required: true,
  });

  const lesson2 = await ensureLesson(unit1, {
    title: "การหารูปแบบ",
    summary: "ค้นหาความเหมือน ความต่าง และแนวโน้มจากข้อมูลหรือปัญหา",
    objectives: "ระบุรูปแบบที่ซ้ำกันและใช้คาดการณ์ผลลัพธ์ได้",
    order_no: 2,
    estimated_minutes: 20,
    status: "published",
    publish_at: new Date().toISOString(),
  });
  await ensureBlock(lesson2, {
    block_type: "text",
    title: "Pattern Recognition",
    body: "การหารูปแบบช่วยให้เราใช้ประสบการณ์จากปัญหาที่เคยพบมาแก้ปัญหาใหม่ได้รวดเร็วขึ้น ลองสังเกตข้อมูลที่ซ้ำกัน ความสัมพันธ์ และสิ่งที่เปลี่ยนแปลงตามลำดับ",
    order_no: 1,
    is_required: true,
  });

  const unit2 = await ensureUnit(classRow.id, {
    title: "หน่วยที่ 2 ผังงานและขั้นตอนวิธี",
    description: "ออกแบบลำดับขั้นตอนและสื่อสารวิธีแก้ปัญหาด้วย Flowchart",
    objectives: "เลือกใช้สัญลักษณ์ผังงานได้ถูกต้อง\nสร้างผังงานจากสถานการณ์ที่กำหนดได้",
    order_no: 2,
    status: "published",
    publish_at: new Date().toISOString(),
  });
  const lesson3 = await ensureLesson(unit2, {
    title: "รู้จักสัญลักษณ์ Flowchart",
    summary: "เรียนรู้ Start/End, Process, Input/Output และ Decision",
    objectives: "อธิบายหน้าที่ของสัญลักษณ์ผังงานพื้นฐานได้",
    order_no: 1,
    estimated_minutes: 30,
    status: "published",
    publish_at: new Date().toISOString(),
  });
  await ensureBlock(lesson3, {
    block_type: "text",
    title: "สัญลักษณ์พื้นฐาน",
    body: "วงรีใช้แทนจุดเริ่มต้นและสิ้นสุด สี่เหลี่ยมผืนผ้าใช้แทนกระบวนการ สี่เหลี่ยมด้านขนานใช้แทนข้อมูลเข้าและออก และรูปสี่เหลี่ยมขนมเปียกปูนใช้แทนการตัดสินใจ",
    order_no: 1,
    is_required: true,
  });

  const { error: progressError } = await admin.from("lesson_progress").upsert({
    lesson_id: lesson1,
    student_id: demoStudent.id,
    status: "completed",
    progress_percent: 100,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    last_viewed_at: new Date().toISOString(),
  }, { onConflict: "lesson_id,student_id" });
  if (progressError) throw progressError;

  console.log("Phase 2 demo data created successfully");
  console.log("Class: CS-M2-01");
  console.log("Students: 10001, 10002, 10003, 10004 / PIN 123456");
  console.log("Units: 2 / Lessons: 3");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
