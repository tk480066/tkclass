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

async function addQuestion(quizId, payload, options = []) {
  const { data, error } = await admin.from("quiz_questions").insert({ quiz_id: quizId, ...payload }).select("id").single();
  if (error) throw error;
  const rows = options.map((option, index) => ({ question_id: data.id, option_text: option.text, is_correct: option.correct, order_no: index + 1 }));
  if (rows.length) {
    const { data: inserted, error: optionError } = await admin.from("quiz_options").insert(rows).select("id, option_text, is_correct");
    if (optionError) throw optionError;
    return { id: data.id, options: inserted };
  }
  return { id: data.id, options: [] };
}

async function main() {
  const teacher = await findUserByEmail("teacher@tkmooc.local");
  const student1 = await findUserByEmail("10001@students.tkmooc.local");
  const student2 = await findUserByEmail("10002@students.tkmooc.local");
  if (!teacher || !student1 || !student2) throw new Error("Run create-demo-users and seed-phase2 before seed-phase4");

  const { data: classRow, error: classError } = await admin.from("classes").select("id").eq("teacher_id", teacher.id).eq("class_code", "CS-M2-01").single();
  if (classError) throw classError;

  const { data: oldQuiz } = await admin.from("quizzes").select("id").eq("class_id", classRow.id).eq("title", "แบบทดสอบแนวคิดเชิงคำนวณ").maybeSingle();
  if (oldQuiz) {
    const { error } = await admin.from("quizzes").delete().eq("id", oldQuiz.id);
    if (error) throw error;
  }

  const now = new Date();
  const closeAt = new Date(Date.now() + 14 * 86400000).toISOString();
  const { data: quiz, error: quizError } = await admin.from("quizzes").insert({
    class_id: classRow.id,
    title: "แบบทดสอบแนวคิดเชิงคำนวณ",
    instructions: "เลือกคำตอบที่ถูกต้อง ตอบคำถามสั้น และอธิบายการประยุกต์ใช้แนวคิดเชิงคำนวณให้ครบถ้วน",
    status: "published",
    open_at: now.toISOString(),
    close_at: closeAt,
    time_limit_minutes: 20,
    max_attempts: 2,
    passing_percent: 60,
    shuffle_questions: true,
    shuffle_options: true,
    show_score_after_submit: true,
    show_correct_answers: false,
  }).select("id").single();
  if (quizError) throw quizError;

  const q1 = await addQuestion(quiz.id, {
    question_type: "single_choice", prompt: "ข้อใดอธิบายการแยกย่อยปัญหาได้ถูกต้องที่สุด", explanation: "แบ่งปัญหาใหญ่เป็นส่วนย่อยที่จัดการได้", points: 2, order_no: 1, is_required: true,
  }, [
    { text: "แบ่งปัญหาใหญ่ออกเป็นส่วนย่อย", correct: true },
    { text: "ตัดรายละเอียดทุกอย่างออก", correct: false },
    { text: "ทดลองแบบสุ่มโดยไม่วางแผน", correct: false },
    { text: "คัดลอกวิธีแก้ปัญหาของผู้อื่น", correct: false },
  ]);
  const q2 = await addQuestion(quiz.id, {
    question_type: "multiple_choice", prompt: "ข้อใดเป็นองค์ประกอบของแนวคิดเชิงคำนวณ เลือกได้มากกว่า 1 ข้อ", explanation: "องค์ประกอบหลักได้แก่ Decomposition, Pattern Recognition, Abstraction และ Algorithm Design", points: 2, order_no: 2, is_required: true,
  }, [
    { text: "การแยกย่อยปัญหา", correct: true },
    { text: "การหารูปแบบ", correct: true },
    { text: "การออกแบบขั้นตอนวิธี", correct: true },
    { text: "การเดาคำตอบโดยไม่วิเคราะห์", correct: false },
  ]);
  const q3 = await addQuestion(quiz.id, {
    question_type: "true_false", prompt: "ผังงานช่วยสื่อสารลำดับขั้นตอนของวิธีแก้ปัญหาได้", explanation: "ผังงานใช้สัญลักษณ์และลูกศรแสดงลำดับขั้นตอน", points: 1, order_no: 3, is_required: true,
  }, [{ text: "จริง", correct: true }, { text: "เท็จ", correct: false }]);
  const q4 = await addQuestion(quiz.id, {
    question_type: "short_answer", prompt: "คำภาษาอังกฤษของคำว่า ขั้นตอนวิธี คืออะไร", explanation: "Algorithm", points: 2, order_no: 4, is_required: true, accepted_answers: ["algorithm", "Algorithm"], case_sensitive: false,
  });
  const q5 = await addQuestion(quiz.id, {
    question_type: "essay", prompt: "ยกตัวอย่างปัญหาใกล้ตัว 1 เรื่อง และอธิบายว่าจะใช้แนวคิดเชิงคำนวณแก้ปัญหานั้นอย่างไร", explanation: "พิจารณาการแยกย่อย การหารูปแบบ นามธรรม และขั้นตอนวิธี", points: 3, order_no: 5, is_required: true,
  });

  const questionIds = [q1.id, q2.id, q3.id, q4.id, q5.id];
  const { data: refreshedQuiz, error: refreshError } = await admin.from("quizzes").select("total_points").eq("id", quiz.id).single();
  if (refreshError) throw refreshError;
  const maxScore = Number(refreshedQuiz.total_points);

  const { data: attempt1, error: a1Error } = await admin.from("quiz_attempts").insert({
    quiz_id: quiz.id, student_id: student1.id, attempt_no: 1, status: "graded", started_at: new Date(Date.now() - 1800000).toISOString(), submitted_at: new Date(Date.now() - 900000).toISOString(), graded_at: new Date().toISOString(), score: 9, max_score: maxScore, percent: 90, passed: true, question_order: questionIds,
  }).select("id").single();
  if (a1Error) throw a1Error;
  const q1Correct = q1.options.find((item) => item.is_correct).id;
  const q2Correct = q2.options.filter((item) => item.is_correct).map((item) => item.id);
  const q3Correct = q3.options.find((item) => item.is_correct).id;
  const { error: ans1Error } = await admin.from("quiz_answers").insert([
    { attempt_id: attempt1.id, question_id: q1.id, selected_option_ids: [q1Correct], is_correct: true, awarded_score: 2, graded_at: new Date().toISOString() },
    { attempt_id: attempt1.id, question_id: q2.id, selected_option_ids: q2Correct, is_correct: true, awarded_score: 2, graded_at: new Date().toISOString() },
    { attempt_id: attempt1.id, question_id: q3.id, selected_option_ids: [q3Correct], is_correct: true, awarded_score: 1, graded_at: new Date().toISOString() },
    { attempt_id: attempt1.id, question_id: q4.id, answer_text: "Algorithm", is_correct: true, awarded_score: 2, graded_at: new Date().toISOString() },
    { attempt_id: attempt1.id, question_id: q5.id, answer_text: "ปัญหาการเตรียมตัวสอบ แบ่งเนื้อหาเป็นบท จัดตารางอ่าน หารูปแบบข้อสอบ และวางขั้นตอนทบทวน", is_correct: true, awarded_score: 2, teacher_feedback: "อธิบายเป็นลำดับดี ควรระบุการใช้นามธรรมเพิ่มเติม", graded_at: new Date().toISOString(), graded_by: teacher.id },
  ]);
  if (ans1Error) throw ans1Error;

  const { data: attempt2, error: a2Error } = await admin.from("quiz_attempts").insert({
    quiz_id: quiz.id, student_id: student2.id, attempt_no: 1, status: "submitted", started_at: new Date(Date.now() - 1200000).toISOString(), submitted_at: new Date().toISOString(), score: 7, max_score: maxScore, percent: 70, passed: null, question_order: questionIds,
  }).select("id").single();
  if (a2Error) throw a2Error;
  const { error: ans2Error } = await admin.from("quiz_answers").insert([
    { attempt_id: attempt2.id, question_id: q1.id, selected_option_ids: [q1Correct], is_correct: true, awarded_score: 2, graded_at: new Date().toISOString() },
    { attempt_id: attempt2.id, question_id: q2.id, selected_option_ids: q2Correct, is_correct: true, awarded_score: 2, graded_at: new Date().toISOString() },
    { attempt_id: attempt2.id, question_id: q3.id, selected_option_ids: [q3Correct], is_correct: true, awarded_score: 1, graded_at: new Date().toISOString() },
    { attempt_id: attempt2.id, question_id: q4.id, answer_text: "algorithm", is_correct: true, awarded_score: 2, graded_at: new Date().toISOString() },
    { attempt_id: attempt2.id, question_id: q5.id, answer_text: "ใช้การแบ่งงานเป็นส่วนย่อยแล้วทำตามลำดับ", is_correct: null, awarded_score: null },
  ]);
  if (ans2Error) throw ans2Error;

  console.log("Phase 4 demo data created successfully");
  console.log(`Quiz: ${quiz.id}`);
  console.log("Student 10001: graded 90%; Student 10002: waiting for essay review.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
