"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { getTeacherClass } from "@/lib/data/phase2";
import { getStudentQuizAttemptPayload } from "@/lib/data/phase4";
import { createClient } from "@/lib/supabase/server";
import type { QuizQuestionType, QuizRow } from "@/lib/types";

export type Phase4ActionState = { success?: boolean; message?: string; quizId?: string; questionId?: string; error?: string };

const quizSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  classId: z.string().uuid(),
  lessonId: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(3, "กรุณากรอกชื่อแบบทดสอบอย่างน้อย 3 ตัวอักษร"),
  instructions: z.string().trim().optional(),
  status: z.enum(["draft", "published", "closed"]),
  openAt: z.string().optional(),
  closeAt: z.string().optional(),
  timeLimitMinutes: z.string().optional(),
  maxAttempts: z.coerce.number().int().min(1).max(20),
  passingPercent: z.coerce.number().min(0).max(100),
});

const questionSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  quizId: z.string().uuid(),
  questionType: z.enum(["single_choice", "multiple_choice", "true_false", "short_answer", "essay"]),
  prompt: z.string().trim().min(2, "กรุณากรอกคำถาม"),
  explanation: z.string().trim().optional(),
  points: z.coerce.number().positive("คะแนนต้องมากกว่า 0").max(1000),
  orderNo: z.coerce.number().int().min(1),
  acceptedAnswers: z.string().optional(),
});

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}
function checked(formData: FormData, key: string) { return formData.get(key) === "on" || formData.get(key) === "true"; }
function optionalDate(raw: string) {
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) throw new Error("รูปแบบวันที่หรือเวลาไม่ถูกต้อง");
  return date.toISOString();
}
function actionError(error: unknown): Phase4ActionState {
  const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาด กรุณาลองใหม่";
  return { error: message };
}

async function teacherQuiz(quizId: string) {
  const user = await requireRole("teacher");
  const supabase = await createClient();
  const { data, error } = await supabase.from("quizzes").select("*").eq("id", quizId).single();
  if (error || !data) throw new Error("ไม่พบแบบทดสอบ");
  const quiz = data as unknown as QuizRow;
  await getTeacherClass(user.id, quiz.class_id);
  return { user, quiz, supabase };
}

export async function saveQuizAction(_previous: Phase4ActionState, formData: FormData): Promise<Phase4ActionState> {
  try {
    const parsed = quizSchema.parse({
      id: value(formData, "id"), classId: value(formData, "classId"), lessonId: value(formData, "lessonId"),
      title: value(formData, "title"), instructions: value(formData, "instructions"), status: value(formData, "status"),
      openAt: value(formData, "openAt"), closeAt: value(formData, "closeAt"), timeLimitMinutes: value(formData, "timeLimitMinutes"),
      maxAttempts: value(formData, "maxAttempts"), passingPercent: value(formData, "passingPercent"),
    });
    const user = await requireRole("teacher");
    await getTeacherClass(user.id, parsed.classId);
    const openAt = optionalDate(parsed.openAt ?? "");
    const closeAt = optionalDate(parsed.closeAt ?? "");
    if (openAt && closeAt && new Date(closeAt) <= new Date(openAt)) throw new Error("เวลาปิดต้องอยู่หลังเวลาเปิด");
    const timeLimit = parsed.timeLimitMinutes ? Number(parsed.timeLimitMinutes) : null;
    if (timeLimit !== null && (!Number.isInteger(timeLimit) || timeLimit < 1 || timeLimit > 600)) throw new Error("เวลาทำแบบทดสอบต้องอยู่ระหว่าง 1–600 นาที");

    const payload = {
      class_id: parsed.classId,
      lesson_id: parsed.lessonId || null,
      title: parsed.title,
      instructions: parsed.instructions || null,
      status: parsed.status,
      open_at: openAt,
      close_at: closeAt,
      time_limit_minutes: timeLimit,
      max_attempts: parsed.maxAttempts,
      passing_percent: parsed.passingPercent,
      shuffle_questions: checked(formData, "shuffleQuestions"),
      shuffle_options: checked(formData, "shuffleOptions"),
      show_score_after_submit: checked(formData, "showScoreAfterSubmit"),
      show_correct_answers: checked(formData, "showCorrectAnswers"),
    };
    const supabase = await createClient();
    let quizId = parsed.id || "";
    if (quizId) {
      await teacherQuiz(quizId);
      const { error } = await supabase.from("quizzes").update(payload).eq("id", quizId).eq("class_id", parsed.classId);
      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await supabase.from("quizzes").insert(payload).select("id").single();
      if (error || !data) throw new Error(error?.message ?? "สร้างแบบทดสอบไม่สำเร็จ");
      quizId = data.id;
    }
    revalidatePath("/teacher");
    revalidatePath("/teacher/quizzes");
    revalidatePath(`/teacher/classes/${parsed.classId}`);
    revalidatePath(`/teacher/classes/${parsed.classId}/quizzes`);
    revalidatePath(`/teacher/quizzes/${quizId}`);
    revalidatePath("/student/quizzes");
    return { success: true, quizId, message: parsed.id ? "บันทึกแบบทดสอบแล้ว" : "สร้างแบบทดสอบแล้ว เพิ่มคำถามได้ทันที" };
  } catch (error) { return actionError(error); }
}

export async function archiveQuizAction(formData: FormData) {
  const quizId = value(formData, "quizId");
  const { quiz, supabase } = await teacherQuiz(quizId);
  const { error } = await supabase.from("quizzes").update({ status: "archived" }).eq("id", quizId);
  if (error) throw new Error(error.message);
  revalidatePath("/teacher/quizzes");
  revalidatePath(`/teacher/classes/${quiz.class_id}/quizzes`);
  redirect("/teacher/quizzes");
}

export async function saveQuizQuestionAction(_previous: Phase4ActionState, formData: FormData): Promise<Phase4ActionState> {
  try {
    const parsed = questionSchema.parse({
      id: value(formData, "id"), quizId: value(formData, "quizId"), questionType: value(formData, "questionType"),
      prompt: value(formData, "prompt"), explanation: value(formData, "explanation"), points: value(formData, "points"),
      orderNo: value(formData, "orderNo"), acceptedAnswers: value(formData, "acceptedAnswers"),
    });
    const { quiz, supabase } = await teacherQuiz(parsed.quizId);
    const questionType = parsed.questionType as QuizQuestionType;
    const optionTexts = Array.from({ length: 6 }, (_, index) => value(formData, `optionText${index}`)).filter(Boolean);
    const correctIndexes = Array.from({ length: 6 }, (_, index) => checked(formData, `correctOption${index}`) ? index : -1).filter((index) => index >= 0);
    let acceptedAnswers: string[] = [];

    if (["single_choice", "multiple_choice"].includes(questionType)) {
      if (optionTexts.length < 2) throw new Error("คำถามแบบตัวเลือกต้องมีอย่างน้อย 2 ตัวเลือก");
      const validCorrect = correctIndexes.filter((index) => Boolean(value(formData, `optionText${index}`)));
      if (!validCorrect.length) throw new Error("กรุณากำหนดคำตอบที่ถูกต้องอย่างน้อย 1 ตัวเลือก");
      if (questionType === "single_choice" && validCorrect.length !== 1) throw new Error("คำถามแบบเลือกคำตอบเดียวต้องมีคำตอบถูกเพียง 1 ตัวเลือก");
    }
    if (questionType === "true_false" && correctIndexes.length !== 1) throw new Error("กรุณาเลือกคำตอบที่ถูกต้องระหว่าง จริง หรือ เท็จ");
    if (questionType === "short_answer") {
      acceptedAnswers = (parsed.acceptedAnswers ?? "").split(/[\n,]/).map((item: string) => item.trim()).filter(Boolean);
      if (!acceptedAnswers.length) throw new Error("กรุณากำหนดคำตอบที่ยอมรับอย่างน้อย 1 คำตอบ");
    }

    const payload = {
      quiz_id: parsed.quizId,
      question_type: questionType,
      prompt: parsed.prompt,
      explanation: parsed.explanation || null,
      points: parsed.points,
      order_no: parsed.orderNo,
      is_required: checked(formData, "isRequired"),
      accepted_answers: acceptedAnswers,
      case_sensitive: checked(formData, "caseSensitive"),
    };
    let questionId = parsed.id || "";
    if (questionId) {
      const { error } = await supabase.from("quiz_questions").update(payload).eq("id", questionId).eq("quiz_id", parsed.quizId);
      if (error) throw new Error(error.message);
      const { error: deleteError } = await supabase.from("quiz_options").delete().eq("question_id", questionId);
      if (deleteError) throw new Error(deleteError.message);
    } else {
      const { data, error } = await supabase.from("quiz_questions").insert(payload).select("id").single();
      if (error || !data) throw new Error(error?.message ?? "เพิ่มคำถามไม่สำเร็จ");
      questionId = data.id;
    }

    let options: Array<{ question_id: string; option_text: string; is_correct: boolean; order_no: number }> = [];
    if (questionType === "true_false") {
      options = [
        { question_id: questionId, option_text: "จริง", is_correct: checked(formData, "correctOption0"), order_no: 1 },
        { question_id: questionId, option_text: "เท็จ", is_correct: checked(formData, "correctOption1"), order_no: 2 },
      ];
    } else if (["single_choice", "multiple_choice"].includes(questionType)) {
      options = Array.from({ length: 6 }, (_, index) => ({ text: value(formData, `optionText${index}`), correct: checked(formData, `correctOption${index}`), originalIndex: index }))
        .filter((item) => item.text)
        .map((item, index) => ({ question_id: questionId, option_text: item.text, is_correct: item.correct, order_no: index + 1 }));
    }
    if (options.length) {
      const { error } = await supabase.from("quiz_options").insert(options);
      if (error) throw new Error(error.message);
    }

    revalidatePath(`/teacher/quizzes/${parsed.quizId}`);
    revalidatePath(`/teacher/classes/${quiz.class_id}/quizzes`);
    revalidatePath("/teacher/quizzes");
    return { success: true, questionId, message: parsed.id ? "แก้ไขคำถามแล้ว" : "เพิ่มคำถามแล้ว" };
  } catch (error) { return actionError(error); }
}

export async function deleteQuizQuestionAction(formData: FormData) {
  const quizId = value(formData, "quizId");
  const questionId = value(formData, "questionId");
  await teacherQuiz(quizId);
  const supabase = await createClient();
  const { error } = await supabase.from("quiz_questions").delete().eq("id", questionId).eq("quiz_id", quizId);
  if (error) throw new Error(error.message);
  revalidatePath(`/teacher/quizzes/${quizId}`);
}

export async function startQuizAttemptAction(formData: FormData) {
  const quizId = z.string().uuid().parse(value(formData, "quizId"));
  await requireRole("student");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_quiz_attempt", { target_quiz_id: quizId });
  if (error || !data) redirect(`/student/quizzes/${quizId}?error=${encodeURIComponent(error?.message ?? "เริ่มแบบทดสอบไม่สำเร็จ")}`);
  redirect(`/student/quizzes/attempts/${data}`);
}

export async function saveQuizAttemptAction(formData: FormData) {
  const user = await requireRole("student");
  const attemptId = z.string().uuid().parse(value(formData, "attemptId"));
  const intent = value(formData, "intent") || "draft";
  const payload = await getStudentQuizAttemptPayload(user.id, attemptId);
  if (payload.attempt.status !== "in_progress") redirect(`/student/quizzes/attempts/${attemptId}/result`);
  const isExpired = Boolean(payload.attempt.expires_at && new Date(payload.attempt.expires_at).getTime() <= Date.now());
  const shouldSubmit = intent === "submit" || isExpired;
  const supabase = await createClient();

  for (const question of payload.questions) {
    const field = `q_${question.id}`;
    const selected = formData.getAll(field).filter((item): item is string => typeof item === "string").map((item: string) => item.trim()).filter(Boolean);
    const answerText = ["short_answer", "essay"].includes(question.question_type) ? (selected[0] ?? "") : null;
    const selectedOptionIds = ["single_choice", "multiple_choice", "true_false"].includes(question.question_type) ? selected : [];
    const answered = Boolean(answerText) || selectedOptionIds.length > 0;
    if (shouldSubmit && !isExpired && question.is_required && !answered) throw new Error(`กรุณาตอบคำถาม: ${question.prompt}`);
    if (!answered && !shouldSubmit) continue;
    const { error } = await supabase.from("quiz_answers").upsert({
      attempt_id: attemptId,
      question_id: question.id,
      answer_text: answerText || null,
      selected_option_ids: selectedOptionIds,
      answer_json: {},
      is_correct: null,
      awarded_score: null,
      graded_at: null,
      graded_by: null,
    }, { onConflict: "attempt_id,question_id" });
    if (error) throw new Error(error.message);
  }

  if (shouldSubmit) {
    const { error } = await supabase.rpc("submit_quiz_attempt", { target_attempt_id: attemptId });
    if (error) throw new Error(error.message);
    revalidatePath("/student/quizzes");
    revalidatePath("/student");
    revalidatePath("/teacher/quizzes");
    redirect(`/student/quizzes/attempts/${attemptId}/result`);
  }
  revalidatePath(`/student/quizzes/attempts/${attemptId}`);
  redirect(`/student/quizzes/attempts/${attemptId}?saved=1`);
}

export async function gradeQuizAnswerAction(_previous: Phase4ActionState, formData: FormData): Promise<Phase4ActionState> {
  try {
    const attemptId = z.string().uuid().parse(value(formData, "attemptId"));
    const answerId = z.string().uuid().parse(value(formData, "answerId"));
    const quizId = z.string().uuid().parse(value(formData, "quizId"));
    const awardedScore = z.coerce.number().min(0).parse(value(formData, "awardedScore"));
    const questionPoints = z.coerce.number().positive().parse(value(formData, "questionPoints"));
    if (awardedScore > questionPoints) throw new Error("คะแนนที่ให้ต้องไม่เกินคะแนนเต็มของคำถาม");
    const { user, supabase } = await teacherQuiz(quizId);
    const { error } = await supabase.from("quiz_answers").update({
      awarded_score: awardedScore,
      teacher_feedback: value(formData, "teacherFeedback") || null,
      is_correct: awardedScore === questionPoints,
      graded_at: new Date().toISOString(),
      graded_by: user.id,
    }).eq("id", answerId).eq("attempt_id", attemptId);
    if (error) throw new Error(error.message);
    const { error: recalcError } = await supabase.rpc("recalculate_quiz_attempt", { target_attempt_id: attemptId });
    if (recalcError) throw new Error(recalcError.message);
    revalidatePath(`/teacher/quizzes/${quizId}/attempts/${attemptId}`);
    revalidatePath(`/teacher/quizzes/${quizId}`);
    revalidatePath(`/student/quizzes/attempts/${attemptId}/result`);
    return { success: true, message: "บันทึกคะแนนและความคิดเห็นแล้ว" };
  } catch (error) { return actionError(error); }
}
