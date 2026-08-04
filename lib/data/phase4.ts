import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatStudentName, getTeacherClass, getTeacherClassSummaries } from "@/lib/data/phase2";
import type {
  QuizAnswerRow,
  QuizAttemptRow,
  QuizAttemptWithStudent,
  QuizOptionRow,
  QuizQuestionRow,
  QuizQuestionWithOptions,
  QuizRow,
  StudentProfile,
  StudentQuizAttemptPayload,
  StudentQuizResultPayload,
  StudentQuizSummary,
  TeacherQuizSummary,
} from "@/lib/types";

const QUIZ_SELECT = "id, class_id, lesson_id, title, instructions, status, open_at, close_at, time_limit_minutes, max_attempts, passing_percent, shuffle_questions, shuffle_options, show_score_after_submit, show_correct_answers, total_points, created_at, updated_at";
const QUESTION_SELECT = "id, quiz_id, question_type, prompt, explanation, points, order_no, is_required, accepted_answers, case_sensitive, created_at, updated_at";
const OPTION_SELECT = "id, question_id, option_text, is_correct, order_no, created_at";
const ATTEMPT_SELECT = "id, quiz_id, student_id, attempt_no, status, started_at, expires_at, submitted_at, graded_at, score, max_score, percent, passed, question_order, option_order, created_at, updated_at";
const ANSWER_SELECT = "id, attempt_id, question_id, answer_text, selected_option_ids, answer_json, is_correct, awarded_score, teacher_feedback, graded_at, graded_by, created_at, updated_at";

export function quizAvailability(quiz: Pick<QuizRow, "status" | "open_at" | "close_at">) {
  const now = Date.now();
  if (quiz.open_at && new Date(quiz.open_at).getTime() > now) return "upcoming" as const;
  if (quiz.status !== "published" || (quiz.close_at && new Date(quiz.close_at).getTime() <= now)) return "closed" as const;
  return "open" as const;
}

export async function getTeacherQuizDashboard(teacherId: string) {
  const [classes, quizzes] = await Promise.all([
    getTeacherClassSummaries(teacherId),
    getTeacherQuizzes(teacherId),
  ]);
  return {
    classes,
    quizzes,
    metrics: {
      quiz_count: quizzes.length,
      published_count: quizzes.filter((quiz) => quiz.status === "published").length,
      attempt_count: quizzes.reduce((sum, quiz) => sum + quiz.attempt_count, 0),
      pending_review_count: quizzes.reduce((sum, quiz) => sum + quiz.pending_review_count, 0),
    },
  };
}

export async function getTeacherQuizzes(teacherId: string, classId?: string): Promise<TeacherQuizSummary[]> {
  const supabase = await createClient();
  let classQuery = supabase
    .from("classes")
    .select("id, class_code, subject_name, class_name")
    .eq("teacher_id", teacherId);
  if (classId) classQuery = classQuery.eq("id", classId);
  const { data: classes, error: classError } = await classQuery;
  if (classError) throw new Error(classError.message);
  const classRows = (classes ?? []) as Array<{ id: string; class_code: string; subject_name: string; class_name: string }>;
  const classIds = classRows.map((row) => row.id);
  if (!classIds.length) return [];

  const { data: quizzes, error } = await supabase
    .from("quizzes")
    .select(QUIZ_SELECT)
    .in("class_id", classIds)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  const quizRows = (quizzes ?? []) as unknown as QuizRow[];
  if (!quizRows.length) return [];
  const quizIds = quizRows.map((row) => row.id);

  const [{ data: questions }, { data: attempts }] = await Promise.all([
    supabase.from("quiz_questions").select("quiz_id").in("quiz_id", quizIds),
    supabase.from("quiz_attempts").select("quiz_id, status, percent").in("quiz_id", quizIds),
  ]);
  const classMap = new Map(classRows.map((row) => [row.id, row]));

  return quizRows.map((quiz) => {
    const classRow = classMap.get(quiz.class_id)!;
    const quizAttempts = (attempts ?? []).filter((row: { quiz_id: string }) => row.quiz_id === quiz.id) as Array<{ quiz_id: string; status: string; percent: number | null }>;
    const gradedPercent = quizAttempts.filter((row) => row.percent !== null).map((row) => Number(row.percent));
    return {
      ...quiz,
      class_code: classRow.class_code,
      subject_name: classRow.subject_name,
      class_name: classRow.class_name,
      question_count: (questions ?? []).filter((row: { quiz_id: string }) => row.quiz_id === quiz.id).length,
      attempt_count: quizAttempts.length,
      pending_review_count: quizAttempts.filter((row) => row.status === "submitted").length,
      average_percent: gradedPercent.length ? Math.round((gradedPercent.reduce((sum, value) => sum + value, 0) / gradedPercent.length) * 100) / 100 : null,
    };
  });
}

export async function getTeacherQuizEditor(teacherId: string, quizId: string) {
  const supabase = await createClient();
  const { data: quiz, error } = await supabase.from("quizzes").select(QUIZ_SELECT).eq("id", quizId).single();
  if (error || !quiz) notFound();
  const quizRow = quiz as unknown as QuizRow;
  const classRow = await getTeacherClass(teacherId, quizRow.class_id);

  const [{ data: questions, error: questionError }, { data: attempts, error: attemptError }] = await Promise.all([
    supabase.from("quiz_questions").select(QUESTION_SELECT).eq("quiz_id", quizId).order("order_no", { ascending: true }),
    supabase.from("quiz_attempts").select(ATTEMPT_SELECT).eq("quiz_id", quizId).order("attempt_no", { ascending: false }),
  ]);
  if (questionError) throw new Error(questionError.message);
  if (attemptError) throw new Error(attemptError.message);
  const questionRows = (questions ?? []) as unknown as QuizQuestionRow[];
  const questionIds = questionRows.map((row) => row.id);
  const { data: options, error: optionError } = questionIds.length
    ? await supabase.from("quiz_options").select(OPTION_SELECT).in("question_id", questionIds).order("order_no", { ascending: true })
    : { data: [] as QuizOptionRow[], error: null };
  if (optionError) throw new Error(optionError.message);
  const optionRows = (options ?? []) as unknown as QuizOptionRow[];
  const questionsWithOptions: QuizQuestionWithOptions[] = questionRows.map((question) => ({
    ...question,
    options: optionRows.filter((option) => option.question_id === question.id),
  }));

  const attemptRows = (attempts ?? []) as unknown as QuizAttemptRow[];
  const studentIds = [...new Set(attemptRows.map((row) => row.student_id))];
  const { data: students } = studentIds.length
    ? await supabase.from("student_profiles").select("user_id, student_code, title, first_name, last_name, nickname, level, room, student_number, created_at, updated_at").in("user_id", studentIds)
    : { data: [] as StudentProfile[] };
  const studentMap = new Map(((students ?? []) as unknown as StudentProfile[]).map((student) => [student.user_id, student]));
  const attemptsWithStudent: QuizAttemptWithStudent[] = attemptRows.map((attempt) => {
    const student = studentMap.get(attempt.student_id);
    return {
      ...attempt,
      student_code: student?.student_code ?? "-",
      student_name: student ? formatStudentName(student) : "ไม่พบข้อมูลนักเรียน",
    };
  });

  return { classRow, quiz: quizRow, questions: questionsWithOptions, attempts: attemptsWithStudent };
}

export async function getTeacherQuizAttempt(teacherId: string, attemptId: string) {
  const supabase = await createClient();
  const { data: attempt, error } = await supabase.from("quiz_attempts").select(ATTEMPT_SELECT).eq("id", attemptId).single();
  if (error || !attempt) notFound();
  const attemptRow = attempt as unknown as QuizAttemptRow;
  const editor = await getTeacherQuizEditor(teacherId, attemptRow.quiz_id);
  const { data: answers, error: answerError } = await supabase.from("quiz_answers").select(ANSWER_SELECT).eq("attempt_id", attemptId);
  if (answerError) throw new Error(answerError.message);
  const student = editor.attempts.find((row) => row.id === attemptId);
  if (!student) notFound();
  const answerMap = new Map(((answers ?? []) as unknown as QuizAnswerRow[]).map((answer) => [answer.question_id, answer]));
  return {
    ...editor,
    attempt: student,
    questions: editor.questions.map((question) => ({ ...question, answer: answerMap.get(question.id) ?? null })),
  };
}

export async function getStudentQuizzes(studentId: string, classId?: string): Promise<StudentQuizSummary[]> {
  const supabase = await createClient();
  let enrollmentQuery = supabase.from("enrollments").select("class_id").eq("student_id", studentId).eq("status", "active");
  if (classId) enrollmentQuery = enrollmentQuery.eq("class_id", classId);
  const { data: enrollments, error: enrollmentError } = await enrollmentQuery;
  if (enrollmentError) throw new Error(enrollmentError.message);
  const classIds = (enrollments ?? []).map((row: { class_id: string }) => row.class_id);
  if (!classIds.length) return [];

  const [{ data: classes, error: classError }, { data: quizzes, error: quizError }] = await Promise.all([
    supabase.from("classes").select("id, class_code, subject_name, class_name, teacher_id").in("id", classIds),
    supabase.from("quizzes").select(QUIZ_SELECT).in("class_id", classIds).in("status", ["published", "closed"]).order("open_at", { ascending: false, nullsFirst: false }),
  ]);
  if (classError) throw new Error(classError.message);
  if (quizError) throw new Error(quizError.message);
  const classRows = (classes ?? []) as Array<{ id: string; class_code: string; subject_name: string; class_name: string; teacher_id: string }>;
  const quizRows = (quizzes ?? []) as unknown as QuizRow[];
  const quizIds = quizRows.map((row) => row.id);
  const teacherIds = [...new Set(classRows.map((row) => row.teacher_id))];

  const [{ data: attempts, error: attemptError }, { data: teachers }] = await Promise.all([
    quizIds.length ? supabase.rpc("get_my_quiz_attempts", { target_quiz_ids: quizIds }) : Promise.resolve({ data: [], error: null }),
    teacherIds.length ? supabase.from("profiles").select("id, display_name").in("id", teacherIds) : Promise.resolve({ data: [] }),
  ]);
  if (attemptError) throw new Error(attemptError.message);
  const attemptRows = (Array.isArray(attempts) ? attempts : []) as unknown as QuizAttemptRow[];
  const classMap = new Map(classRows.map((row) => [row.id, row]));
  const teacherMap = new Map(((teachers ?? []) as Array<{ id: string; display_name: string }>).map((row) => [row.id, row.display_name]));

  return quizRows.map((quiz) => {
    const classRow = classMap.get(quiz.class_id)!;
    const ownAttempts = attemptRows.filter((attempt) => attempt.quiz_id === quiz.id).sort((a, b) => b.attempt_no - a.attempt_no);
    const availability = quizAvailability(quiz);
    return {
      ...quiz,
      class_code: classRow.class_code,
      subject_name: classRow.subject_name,
      class_name: classRow.class_name,
      teacher_name: teacherMap.get(classRow.teacher_id) ?? "-",
      attempt_count: ownAttempts.length,
      latest_attempt: ownAttempts[0] ?? null,
      availability,
      can_attempt: availability === "open" && ownAttempts.length < quiz.max_attempts && !ownAttempts.some((attempt) => attempt.status === "in_progress"),
    };
  });
}

export async function getStudentQuizDetail(studentId: string, quizId: string) {
  const quizzes = await getStudentQuizzes(studentId);
  const quiz = quizzes.find((row) => row.id === quizId);
  if (!quiz) notFound();
  const supabase = await createClient();
  const { data: count, error } = await supabase.rpc("get_quiz_question_count", { target_quiz_id: quizId });
  if (error) throw new Error(error.message);
  return { quiz, questionCount: Number(count ?? 0) };
}

export async function getStudentQuizAttemptPayload(studentId: string, attemptId: string): Promise<StudentQuizAttemptPayload> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_quiz_attempt_payload", { target_attempt_id: attemptId });
  if (error || !data) notFound();
  const payload = data as unknown as StudentQuizAttemptPayload;
  if (payload.attempt.student_id !== studentId) notFound();
  return payload;
}

export async function getStudentQuizAttemptResult(studentId: string, attemptId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_quiz_attempt_result", { target_attempt_id: attemptId });
  if (error || !data) notFound();
  const payload = data as unknown as StudentQuizResultPayload;
  if (payload.attempt.student_id !== studentId) notFound();
  return payload;
}
