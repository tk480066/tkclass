import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Save, Send } from "lucide-react";
import { saveQuizAttemptAction } from "@/app/phase4-actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { QuizTimer } from "@/components/phase4/quiz-timer";
import { getStudentQuizAttemptPayload } from "@/lib/data/phase4";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "ทำแบบทดสอบ" };

export default async function StudentQuizAttemptPage({ params, searchParams }: { params: Promise<{ attemptId: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { attemptId } = await params;
  const query = await searchParams;
  const user = await requireRole("student");
  const payload = await getStudentQuizAttemptPayload(user.id, attemptId);
  if (payload.attempt.status !== "in_progress") {
    return <DashboardShell user={user} title={payload.quiz.title} description="แบบทดสอบนี้ถูกส่งแล้ว"><section className="phase2-section-card phase2-empty-state"><p>แบบทดสอบถูกส่งเรียบร้อยแล้ว</p><Link href={`/student/quizzes/attempts/${attemptId}/result`} className="phase2-primary-button">ดูผลแบบทดสอบ</Link></section></DashboardShell>;
  }
  return (
    <DashboardShell user={user} title={payload.quiz.title} description={`ครั้งที่ ${payload.attempt.attempt_no} · ${payload.questions.length} ข้อ · ${payload.attempt.max_score} คะแนน`}>
      <div className="phase4-attempt-toolbar"><Link href={`/student/quizzes/${payload.quiz.id}`} className="phase2-back-link"><ArrowLeft size={16} /> กลับรายละเอียด</Link><QuizTimer expiresAt={payload.attempt.expires_at} formId="quiz-attempt-form" submitButtonId="quiz-final-submit" /></div>
      {query.saved === "1" && <div className="phase4-feedback success">บันทึกคำตอบฉบับร่างแล้ว</div>}
      <form id="quiz-attempt-form" action={saveQuizAttemptAction} className="phase4-attempt-form">
        <input type="hidden" name="attemptId" value={attemptId} />
        {payload.questions.map((question, index) => (
          <article className="phase4-answer-card" key={question.id}>
            <header><span>{index + 1}</span><div><small>{questionTypeLabel(question.question_type)} · {question.points} คะแนน{question.is_required ? " · บังคับตอบ" : ""}</small><h2>{question.prompt}</h2></div></header>
            <AnswerField question={question} />
          </article>
        ))}
        <div className="phase4-attempt-actions"><button className="phase2-secondary-button" type="submit" name="intent" value="draft"><Save size={17} /> บันทึกฉบับร่าง</button><button id="quiz-final-submit" className="phase2-primary-button" type="submit" name="intent" value="submit"><Send size={17} /> ส่งแบบทดสอบ</button></div>
      </form>
    </DashboardShell>
  );
}

function AnswerField({ question }: { question: Awaited<ReturnType<typeof getStudentQuizAttemptPayload>>["questions"][number] }) {
  const defaults = new Set(question.answer?.selected_option_ids ?? []);
  if (question.question_type === "single_choice" || question.question_type === "true_false") return <div className="phase4-choice-grid">{question.options.map((option) => <label key={option.id}><input type="radio" name={`q_${question.id}`} value={option.id} defaultChecked={defaults.has(option.id)} /><span>{option.option_text}</span></label>)}</div>;
  if (question.question_type === "multiple_choice") return <div className="phase4-choice-grid">{question.options.map((option) => <label key={option.id}><input type="checkbox" name={`q_${question.id}`} value={option.id} defaultChecked={defaults.has(option.id)} /><span>{option.option_text}</span></label>)}</div>;
  if (question.question_type === "short_answer") return <input className="field-control" name={`q_${question.id}`} defaultValue={question.answer?.answer_text ?? ""} placeholder="พิมพ์คำตอบสั้น" />;
  return <textarea className="field-control phase4-textarea essay" name={`q_${question.id}`} defaultValue={question.answer?.answer_text ?? ""} placeholder="อธิบายคำตอบของคุณ" />;
}
function questionTypeLabel(type: string) { return ({ single_choice: "เลือกคำตอบเดียว", multiple_choice: "เลือกได้หลายคำตอบ", true_false: "จริง–เท็จ", short_answer: "คำตอบสั้น", essay: "คำตอบอธิบาย" } as Record<string, string>)[type] ?? type; }
