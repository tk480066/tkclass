import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, FileQuestion, RotateCcw } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { QuizStatusBadge } from "@/components/phase4/quiz-status-badge";
import { getStudentQuizzes } from "@/lib/data/phase4";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "แบบทดสอบของฉัน" };

export default async function StudentQuizzesPage() {
  const user = await requireRole("student");
  const quizzes = await getStudentQuizzes(user.id);
  const openCount = quizzes.filter((quiz) => quiz.availability === "open").length;
  const pending = quizzes.filter((quiz) => quiz.latest_attempt?.status === "submitted").length;
  const passed = quizzes.filter((quiz) => quiz.latest_attempt?.passed === true).length;
  const attempts = quizzes.reduce((sum, quiz) => sum + quiz.attempt_count, 0);
  return (
    <DashboardShell user={user} title="แบบทดสอบของฉัน" description="ดูแบบทดสอบที่กำลังเปิด เริ่มทำ ติดตามเวลา และตรวจสอบผลคะแนนของตนเอง">
      <div className="phase2-dashboard-grid student-metric-grid">
        <Metric icon={<FileQuestion />} label="กำลังเปิด" value={openCount} suffix="ชุด" />
        <Metric icon={<RotateCcw />} label="ทำทั้งหมด" value={attempts} suffix="ครั้ง" />
        <Metric icon={<Clock3 />} label="รอครูตรวจ" value={pending} suffix="ชุด" />
        <Metric icon={<CheckCircle2 />} label="ผ่านแล้ว" value={passed} suffix="ชุด" />
      </div>

      <section className="phase2-section-card">
        <div className="phase2-section-heading"><div><span className="phase-panel-kicker">MY QUIZZES</span><h2>รายการแบบทดสอบ</h2><p>เรียงตามช่วงเวลาเปิดทำและรายวิชา</p></div></div>
        <div className="phase4-student-quiz-grid">
          {quizzes.map((quiz) => (
            <Link href={`/student/quizzes/${quiz.id}`} className="phase4-student-quiz-card" key={quiz.id}>
              <header><span className="phase4-quiz-icon"><FileQuestion size={22} /></span><QuizStatusBadge status={quiz.availability} /></header>
              <small>{quiz.class_code} · {quiz.class_name}</small><h3>{quiz.title}</h3><p>{quiz.subject_name} · ครู {quiz.teacher_name}</p>
              <div className="phase4-quiz-card-meta"><span>{quiz.total_points} คะแนน</span><span>{quiz.time_limit_minutes ? `${quiz.time_limit_minutes} นาที` : "ไม่จำกัดเวลา"}</span><span>{quiz.attempt_count}/{quiz.max_attempts} ครั้ง</span></div>
              {quiz.latest_attempt && <div className="phase4-latest-result"><QuizStatusBadge status={quiz.latest_attempt.status} /><strong>{quiz.latest_attempt.percent === null ? "-" : `${quiz.latest_attempt.percent}%`}</strong></div>}
              <span className="course-card-link">เปิดรายละเอียด <ArrowRight size={16} /></span>
            </Link>
          ))}
          {!quizzes.length && <div className="phase2-empty-state full-span"><FileQuestion size={38} /><h3>ยังไม่มีแบบทดสอบ</h3><p>เมื่อครูเผยแพร่แบบทดสอบ ระบบจะแสดงรายการที่นี่</p></div>}
        </div>
      </section>
    </DashboardShell>
  );
}

function Metric({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: number; suffix: string }) { return <article className="phase2-metric-card"><span>{icon}</span><div><strong>{value}<em>{suffix}</em></strong><small>{label}</small></div></article>; }
