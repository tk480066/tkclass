import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, CircleX, FileQuestion } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { ManualGradeForm } from "@/components/phase4/manual-grade-form";
import { QuizStatusBadge } from "@/components/phase4/quiz-status-badge";
import { getTeacherQuizAttempt } from "@/lib/data/phase4";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "ตรวจแบบทดสอบ" };

export default async function QuizAttemptReviewPage({ params }: { params: Promise<{ quizId: string; attemptId: string }> }) {
  const { quizId, attemptId } = await params;
  const user = await requireRole("teacher");
  const data = await getTeacherQuizAttempt(user.id, attemptId);
  return (
    <DashboardShell user={user} title={`ตรวจคำตอบ · ${data.attempt.student_name}`} description={`${data.quiz.title} · ครั้งที่ ${data.attempt.attempt_no} · ${data.attempt.student_code}`}>
      <Link href={`/teacher/quizzes/${quizId}`} className="phase2-back-link"><ArrowLeft size={16} /> กลับแบบทดสอบ</Link>
      <section className="phase4-result-summary teacher-review-summary">
        <div><QuizStatusBadge status={data.attempt.status} /><h2>{data.attempt.percent === null ? "รอตรวจ" : `${data.attempt.percent}%`}</h2><p>{data.attempt.score ?? 0} / {data.attempt.max_score} คะแนน · {data.attempt.passed === null ? "ยังไม่สรุปผล" : data.attempt.passed ? "ผ่าน" : "ไม่ผ่าน"}</p></div>
      </section>
      <div className="phase4-review-list">
        {data.questions.map((question, index) => (
          <article className="phase4-review-card" key={question.id}>
            <header><span>{index + 1}</span><div><small>{question.points} คะแนน · {questionTypeLabel(question.question_type)}</small><h3>{question.prompt}</h3></div>{question.answer?.is_correct === true ? <CheckCircle2 className="correct-icon" /> : question.answer?.is_correct === false ? <CircleX className="wrong-icon" /> : <FileQuestion />}</header>
            <div className="phase4-student-answer"><strong>คำตอบนักเรียน</strong><p>{answerLabel(question)}</p></div>
            {question.question_type === "essay" && question.answer ? <ManualGradeForm quizId={quizId} attemptId={attemptId} answerId={question.answer.id} points={question.points} currentScore={question.answer.awarded_score} feedback={question.answer.teacher_feedback} /> : <div className="phase4-auto-score">คะแนนอัตโนมัติ: <strong>{question.answer?.awarded_score ?? 0} / {question.points}</strong></div>}
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}

function questionTypeLabel(type: string) { return ({ single_choice: "เลือกคำตอบเดียว", multiple_choice: "หลายคำตอบ", true_false: "จริง–เท็จ", short_answer: "คำตอบสั้น", essay: "คำตอบอธิบาย" } as Record<string, string>)[type] ?? type; }
function answerLabel(question: Awaited<ReturnType<typeof getTeacherQuizAttempt>>["questions"][number]) {
  if (!question.answer) return "ไม่ได้ตอบ";
  if (["short_answer", "essay"].includes(question.question_type)) return question.answer.answer_text || "ไม่ได้ตอบ";
  const selected = new Set(question.answer.selected_option_ids);
  return question.options.filter((option) => selected.has(option.id)).map((option) => option.option_text).join(", ") || "ไม่ได้เลือกคำตอบ";
}
