import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, CircleX, EyeOff, FileQuestion, RotateCcw, Trophy } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { QuizStatusBadge } from "@/components/phase4/quiz-status-badge";
import { getStudentQuizAttemptResult } from "@/lib/data/phase4";
import { requireRole } from "@/lib/auth/require-role";
import type { QuizAnswerRow, StudentQuizResultQuestion } from "@/lib/types";

export const metadata: Metadata = { title: "ผลแบบทดสอบ" };

export default async function StudentQuizResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const user = await requireRole("student");
  const { attempt, quiz, answers, questions } = await getStudentQuizAttemptResult(user.id, attemptId);
  const showScore = quiz.show_score_after_submit;
  const correct = answers.filter((answer) => answer.is_correct === true).length;
  const wrong = answers.filter((answer) => answer.is_correct === false).length;
  const pending = answers.filter((answer) => answer.is_correct === null).length;
  const answerMap = new Map(answers.map((answer) => [answer.question_id, answer]));

  return (
    <DashboardShell user={user} title={`ผลแบบทดสอบ · ${quiz.title}`} description={`ครั้งที่ ${attempt.attempt_no} · ส่งเมื่อ ${formatDate(attempt.submitted_at)}`}>
      <Link href={`/student/quizzes/${quiz.id}`} className="phase2-back-link"><ArrowLeft size={16} /> กลับรายละเอียดแบบทดสอบ</Link>

      <section className={`phase4-result-summary ${showScore && attempt.passed === true ? "passed" : showScore && attempt.passed === false ? "failed" : "pending"}`}>
        <div className="phase4-result-icon">
          {!showScore ? <EyeOff /> : attempt.passed === true ? <Trophy /> : attempt.passed === false ? <CircleX /> : <Clock3 />}
        </div>
        <div>
          <QuizStatusBadge status={attempt.status} />
          <h2>{showScore && attempt.percent !== null ? `${attempt.percent}%` : "ยังไม่เปิดเผยคะแนน"}</h2>
          <p>{showScore ? `${attempt.score ?? 0} / ${attempt.max_score} คะแนน` : "ครูปิดการแสดงคะแนนหลังส่ง"}</p>
          <strong>{!showScore ? "รอครูเปิดเผยผลคะแนน" : attempt.passed === null ? "มีคำตอบที่ต้องรอครูตรวจ" : attempt.passed ? "ผ่านเกณฑ์" : "ยังไม่ผ่านเกณฑ์"}</strong>
        </div>
      </section>

      {showScore ? (
        <div className="phase2-dashboard-grid">
          <Metric icon={<CheckCircle2 />} label="ตอบถูก" value={correct} />
          <Metric icon={<CircleX />} label="ตอบผิด" value={wrong} />
          <Metric icon={<Clock3 />} label="รอตรวจ" value={pending} />
          <Metric icon={<Trophy />} label="เกณฑ์ผ่าน" value={`${quiz.passing_percent}%`} />
        </div>
      ) : (
        <div className="phase2-dashboard-grid">
          <Metric icon={<FileQuestion />} label="จำนวนคำถาม" value={questions.length} />
          <Metric icon={<Trophy />} label="คะแนนเต็ม" value={attempt.max_score} />
          <Metric icon={<RotateCcw />} label="ครั้งที่ทำ" value={attempt.attempt_no} />
          <Metric icon={<EyeOff />} label="สถานะคะแนน" value="ซ่อนอยู่" />
        </div>
      )}

      <section className="phase2-section-card">
        <div className="phase2-section-heading">
          <div>
            <span className="phase-panel-kicker">ANSWER REVIEW</span>
            <h2>คำตอบของฉัน</h2>
            <p>{quiz.show_correct_answers ? "ครูอนุญาตให้แสดงเฉลยและคำอธิบาย" : "ระบบแสดงคำตอบของนักเรียนโดยยังไม่เปิดเผยเฉลย"}</p>
          </div>
        </div>
        <div className="phase4-student-review-list">
          {questions.map((question, index) => {
            const answer = answerMap.get(question.id) ?? null;
            return (
              <article className="phase4-student-review-card" key={question.id}>
                <header>
                  <span>{index + 1}</span>
                  <div><small>{questionTypeLabel(question.question_type)} · {question.points} คะแนน</small><h3>{question.prompt}</h3></div>
                  {showScore && <ResultIcon answer={answer} />}
                </header>
                <div className="phase4-review-answer-box">
                  <strong>คำตอบของนักเรียน</strong>
                  <p>{studentAnswerLabel(question, answer)}</p>
                </div>
                {showScore && (
                  <div className="phase4-review-score-row">
                    <span>{answer?.is_correct === null || answer?.is_correct === undefined ? "รอครูตรวจ" : answer.is_correct ? "ตอบถูก" : "ตอบผิด"}</span>
                    <strong>{answer?.awarded_score === null || answer?.awarded_score === undefined ? "-" : `${answer.awarded_score} / ${question.points} คะแนน`}</strong>
                  </div>
                )}
                {quiz.show_correct_answers && (
                  <div className="phase4-correct-answer-box">
                    <strong>เฉลย</strong>
                    <p>{correctAnswerLabel(question)}</p>
                    {question.explanation && <small>{question.explanation}</small>}
                  </div>
                )}
                {showScore && answer?.teacher_feedback && <div className="phase4-teacher-feedback"><strong>ความคิดเห็นครู</strong><p>{answer.teacher_feedback}</p></div>}
              </article>
            );
          })}
        </div>
      </section>
    </DashboardShell>
  );
}

function ResultIcon({ answer }: { answer: QuizAnswerRow | null }) {
  if (answer?.is_correct === true) return <CheckCircle2 className="correct-icon" />;
  if (answer?.is_correct === false) return <CircleX className="wrong-icon" />;
  return <Clock3 />;
}

function studentAnswerLabel(question: StudentQuizResultQuestion, answer: QuizAnswerRow | null) {
  if (!answer) return "ไม่ได้ตอบ";
  if (["short_answer", "essay"].includes(question.question_type)) return answer.answer_text || "ไม่ได้ตอบ";
  const selected = new Set(answer.selected_option_ids);
  return question.options.filter((option) => selected.has(option.id)).map((option) => option.option_text).join(", ") || "ไม่ได้เลือกคำตอบ";
}

function correctAnswerLabel(question: StudentQuizResultQuestion) {
  if (question.question_type === "essay") return question.explanation || "พิจารณาตามเกณฑ์และความคิดเห็นของครู";
  if (question.question_type === "short_answer") return question.accepted_answers.join(", ") || "ไม่มีข้อมูลเฉลย";
  return question.options.filter((option) => option.is_correct === true).map((option) => option.option_text).join(", ") || "ไม่มีข้อมูลเฉลย";
}

function questionTypeLabel(type: string) {
  return ({ single_choice: "เลือกคำตอบเดียว", multiple_choice: "เลือกได้หลายคำตอบ", true_false: "จริง–เท็จ", short_answer: "คำตอบสั้น", essay: "คำตอบอธิบาย" } as Record<string, string>)[type] ?? type;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return <article className="phase2-metric-card"><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></article>;
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "-";
}
