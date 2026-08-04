import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, FileQuestion, PlayCircle, RotateCcw, Trophy } from "lucide-react";
import { startQuizAttemptAction } from "@/app/phase4-actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { QuizStatusBadge } from "@/components/phase4/quiz-status-badge";
import { getStudentQuizDetail } from "@/lib/data/phase4";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "รายละเอียดแบบทดสอบ" };

export default async function StudentQuizDetailPage({ params, searchParams }: { params: Promise<{ quizId: string }>; searchParams: Promise<{ error?: string }> }) {
  const { quizId } = await params;
  const query = await searchParams;
  const user = await requireRole("student");
  const { quiz, questionCount } = await getStudentQuizDetail(user.id, quizId);
  const activeAttempt = quiz.latest_attempt?.status === "in_progress" ? quiz.latest_attempt : null;
  return (
    <DashboardShell user={user} title={quiz.title} description={`${quiz.subject_name} · ${quiz.class_name} · ครู ${quiz.teacher_name}`}>
      <Link href="/student/quizzes" className="phase2-back-link"><ArrowLeft size={16} /> กลับแบบทดสอบของฉัน</Link>
      {query.error && <div className="phase4-feedback error"><AlertCircle size={18} /> {decodeURIComponent(query.error)}</div>}
      <section className="phase4-student-quiz-hero">
        <div><QuizStatusBadge status={quiz.availability} /><h2>{quiz.title}</h2><p>{quiz.instructions || "อ่านคำถามให้ครบถ้วนและส่งคำตอบภายในเวลาที่กำหนด"}</p><div className="phase4-quiz-rule-grid"><span><FileQuestion /> <strong>{questionCount}</strong><small>จำนวนคำถาม</small></span><span><Trophy /> <strong>{quiz.total_points}</strong><small>คะแนนเต็ม</small></span><span><Clock3 /> <strong>{quiz.time_limit_minutes ?? "∞"}</strong><small>{quiz.time_limit_minutes ? "นาที" : "ไม่จำกัดเวลา"}</small></span><span><RotateCcw /> <strong>{quiz.attempt_count}/{quiz.max_attempts}</strong><small>จำนวนครั้งที่ทำ</small></span></div></div>
        <div className="phase4-start-panel">
          <strong>เกณฑ์ผ่าน {quiz.passing_percent}%</strong>
          <p>เปิด {formatDate(quiz.open_at)}<br />ปิด {formatDate(quiz.close_at)}</p>
          {activeAttempt ? <Link href={`/student/quizzes/attempts/${activeAttempt.id}`} className="phase2-primary-button"><PlayCircle size={18} /> ทำต่อจากครั้งเดิม</Link> : quiz.can_attempt ? <form action={startQuizAttemptAction}><input type="hidden" name="quizId" value={quiz.id} /><button className="phase2-primary-button" type="submit"><PlayCircle size={18} /> เริ่มทำแบบทดสอบ</button></form> : <div className="phase4-unavailable-message"><AlertCircle size={18} /> {quiz.availability === "upcoming" ? "ยังไม่ถึงเวลาเปิด" : quiz.availability === "closed" ? "แบบทดสอบปิดแล้ว" : "ใช้สิทธิ์ทำครบจำนวนแล้ว"}</div>}
        </div>
      </section>

      {quiz.latest_attempt && quiz.latest_attempt.status !== "in_progress" && (
        <section className="phase2-section-card phase4-previous-result"><div><CheckCircle2 size={28} /><span><small>ผลการทำครั้งล่าสุด · ครั้งที่ {quiz.latest_attempt.attempt_no}</small><strong>{quiz.latest_attempt.percent === null ? "รอครูตรวจ" : `${quiz.latest_attempt.percent}%`}</strong><p>{quiz.latest_attempt.passed === null ? "ยังไม่สรุปผล" : quiz.latest_attempt.passed ? "ผ่านเกณฑ์" : "ยังไม่ผ่านเกณฑ์"}</p></span></div><Link href={`/student/quizzes/attempts/${quiz.latest_attempt.id}/result`}>ดูผลอย่างละเอียด</Link></section>
      )}
    </DashboardShell>
  );
}
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "ไม่กำหนด"; }
