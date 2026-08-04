import type { Metadata } from "next";
import Link from "next/link";
import { Archive, ArrowLeft, ArrowRight, CheckCircle2, Clock3, FileQuestion, Pencil, Trash2, UsersRound } from "lucide-react";
import { archiveQuizAction, deleteQuizQuestionAction } from "@/app/phase4-actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { QuestionForm } from "@/components/phase4/question-form";
import { QuizForm } from "@/components/phase4/quiz-form";
import { QuizStatusBadge } from "@/components/phase4/quiz-status-badge";
import { getClassCurriculum } from "@/lib/data/phase2";
import { getTeacherQuizEditor } from "@/lib/data/phase4";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "จัดการแบบทดสอบ" };

export default async function TeacherQuizEditorPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  const user = await requireRole("teacher");
  const editor = await getTeacherQuizEditor(user.id, quizId);
  const curriculum = await getClassCurriculum(user.id, editor.classRow.id);
  const lessons = curriculum.flatMap((unit) => unit.lessons);
  const pending = editor.attempts.filter((attempt) => attempt.status === "submitted").length;
  return (
    <DashboardShell user={user} title={editor.quiz.title} description={`${editor.classRow.subject_name} · ${editor.classRow.class_name} · ${editor.questions.length} ข้อ · ${editor.quiz.total_points} คะแนน`}>
      <Link href="/teacher/quizzes" className="phase2-back-link"><ArrowLeft size={16} /> กลับคลังแบบทดสอบ</Link>
      <div className="phase2-dashboard-grid">
        <Metric icon={<FileQuestion />} label="จำนวนคำถาม" value={editor.questions.length} />
        <Metric icon={<CheckCircle2 />} label="คะแนนเต็ม" value={editor.quiz.total_points} />
        <Metric icon={<UsersRound />} label="ครั้งที่เข้าสอบ" value={editor.attempts.length} />
        <Metric icon={<Clock3 />} label="รอตรวจคำตอบ" value={pending} />
      </div>

      <section className="phase2-section-card">
        <div className="phase2-section-heading"><div><span className="phase-panel-kicker">QUIZ SETTINGS</span><h2>ตั้งค่าแบบทดสอบ</h2><p><QuizStatusBadge status={editor.quiz.status} /></p></div></div>
        <QuizForm classRow={editor.classRow} quiz={editor.quiz} lessons={lessons} />
      </section>

      <section className="phase2-section-card">
        <div className="phase2-section-heading"><div><span className="phase-panel-kicker">QUESTION BUILDER</span><h2>คำถามในแบบทดสอบ</h2><p>รองรับเลือกคำตอบเดียว หลายคำตอบ จริง–เท็จ คำตอบสั้น และคำตอบอธิบาย</p></div></div>
        <div className="phase4-question-list">
          {editor.questions.map((question, index) => (
            <article className="phase4-question-card" key={question.id}>
              <header><span className="phase4-question-number">{index + 1}</span><div><small>{questionTypeLabel(question.question_type)} · {question.points} คะแนน</small><h3>{question.prompt}</h3></div><div className="phase4-question-actions"><details><summary><Pencil size={16} /> แก้ไข</summary><div className="phase4-inline-editor"><QuestionForm quizId={quizId} nextOrder={question.order_no} question={question} /></div></details><form action={deleteQuizQuestionAction}><input type="hidden" name="quizId" value={quizId} /><input type="hidden" name="questionId" value={question.id} /><button type="submit" aria-label="ลบคำถาม"><Trash2 size={16} /></button></form></div></header>
              {question.options.length > 0 && <div className="phase4-option-preview">{question.options.map((option) => <span className={option.is_correct ? "correct" : ""} key={option.id}>{option.option_text}{option.is_correct && <CheckCircle2 size={14} />}</span>)}</div>}
              {question.accepted_answers.length > 0 && <p className="phase4-accepted-answer">คำตอบที่ยอมรับ: {question.accepted_answers.join(", ")}</p>}
            </article>
          ))}
          {!editor.questions.length && <div className="phase2-empty-state small"><FileQuestion size={32} /><p>ยังไม่มีคำถาม เพิ่มคำถามแรกด้านล่าง</p></div>}
        </div>
        <details className="phase4-add-question" open={!editor.questions.length}><summary>+ เพิ่มคำถามใหม่</summary><QuestionForm quizId={quizId} nextOrder={editor.questions.length + 1} /></details>
      </section>

      <section className="phase2-section-card">
        <div className="phase2-section-heading"><div><span className="phase-panel-kicker">ATTEMPTS</span><h2>ผลการทำแบบทดสอบ</h2><p>เปิดดูคำตอบ ให้คะแนนข้ออธิบาย และติดตามผลผ่าน</p></div></div>
        <div className="phase4-attempt-list">
          {editor.attempts.map((attempt) => <Link href={`/teacher/quizzes/${quizId}/attempts/${attempt.id}`} key={attempt.id}><span className="phase4-attempt-avatar">{attempt.student_code.slice(-2)}</span><div><strong>{attempt.student_name}</strong><small>{attempt.student_code} · ครั้งที่ {attempt.attempt_no}</small></div><QuizStatusBadge status={attempt.status} /><span className="phase4-attempt-score">{attempt.percent === null ? "-" : `${attempt.percent}%`}</span><ArrowRight size={17} /></Link>)}
          {!editor.attempts.length && <div className="phase2-empty-state small"><UsersRound size={30} /><p>ยังไม่มีนักเรียนเริ่มทำแบบทดสอบ</p></div>}
        </div>
      </section>

      <form action={archiveQuizAction} className="archive-class-form"><input type="hidden" name="quizId" value={quizId} /><button type="submit"><Archive size={17} /> เก็บแบบทดสอบเข้าคลัง</button></form>
    </DashboardShell>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <article className="phase2-metric-card"><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></article>; }
function questionTypeLabel(type: string) { return ({ single_choice: "เลือกคำตอบเดียว", multiple_choice: "หลายคำตอบ", true_false: "จริง–เท็จ", short_answer: "คำตอบสั้น", essay: "คำตอบอธิบาย" } as Record<string, string>)[type] ?? type; }
