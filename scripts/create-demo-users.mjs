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
  let page = 1;
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const found = data.users.find((user) => user.email === email);
    if (found) return found;
    if (data.users.length < 100) return null;
    page += 1;
  }
  return null;
}

async function ensureAuthUser({ email, password, metadata }) {
  const existing = await findUserByEmail(email);

  // Important: if the account already exists, reset its password as well.
  // Previous versions returned the existing account without updating the password,
  // so the credentials printed by this script could differ from the real password.
  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (error) throw error;
    return data.user;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (error) throw error;
  return data.user;
}

async function main() {
  const teacher = await ensureAuthUser({
    email: "teacher@tkmooc.local",
    password: "TKMOOC@1234",
    metadata: { display_name: "ครูปิง" },
  });

  const student = await ensureAuthUser({
    email: "10001@students.tkmooc.local",
    password: "123456",
    metadata: { display_name: "นักเรียนตัวอย่าง" },
  });

  const { error: teacherProfileError } = await admin.from("profiles").upsert({
    id: teacher.id,
    role: "teacher",
    display_name: "ครูปิง",
    status: "active",
  });
  if (teacherProfileError) throw teacherProfileError;

  const { error: teacherDetailError } = await admin.from("teacher_profiles").upsert({
    user_id: teacher.id,
    teacher_code: "T001",
    email: "teacher@tkmooc.local",
    department: "วิทยาศาสตร์และเทคโนโลยี",
  });
  if (teacherDetailError) throw teacherDetailError;

  const { error: studentProfileError } = await admin.from("profiles").upsert({
    id: student.id,
    role: "student",
    display_name: "เด็กชายทดสอบ ระบบดี",
    status: "active",
  });
  if (studentProfileError) throw studentProfileError;

  const { error: studentDetailError } = await admin.from("student_profiles").upsert({
    user_id: student.id,
    student_code: "10001",
    title: "เด็กชาย",
    first_name: "ทดสอบ",
    last_name: "ระบบดี",
    nickname: "เทสต์",
    level: "ม.2",
    room: "1",
    student_number: 1,
  });
  if (studentDetailError) throw studentDetailError;

  const { data: classRow, error: classError } = await admin
    .from("classes")
    .upsert(
      {
        teacher_id: teacher.id,
        class_code: "CS-M2-01",
        subject_name: "วิทยาการคำนวณ",
        class_name: "มัธยมศึกษาปีที่ 2/1",
        level: "ม.2",
        room: "2213",
        semester: 1,
        academic_year: 2569,
        description: "ชั้นเรียนตัวอย่างสำหรับระบบพื้นฐาน",
        status: "active",
      },
      { onConflict: "class_code" },
    )
    .select("id")
    .single();
  if (classError) throw classError;

  const { error: enrollmentError } = await admin.from("enrollments").upsert(
    {
      class_id: classRow.id,
      student_id: student.id,
      student_number: 1,
      group_name: "กลุ่ม A",
      status: "active",
    },
    { onConflict: "class_id,student_id" },
  );
  if (enrollmentError) throw enrollmentError;

  console.log("Demo users created successfully\n");
  console.log("Teacher: teacher@tkmooc.local / TKMOOC@1234");
  console.log("Student: 10001 / PIN 123456");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
