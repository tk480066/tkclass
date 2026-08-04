import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, Clock3, FileQuestion, Plus, School } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { QuizStatusBadge } from "@/components/phase4/quiz-status-badge";
import { getTeacherQuizDashboard } from "@/lib/data/phase4";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "แบบทดสอบ" };

export default async function TeacherQuizzesPage() {
  const user = await requireRole("teacher");
  const { classes, quizzes, metrics } = await getTeacherQuizDashboard(user.id);
  return (
    <DashboardShell user={user} title="แบบทดสอบและการประเมินผล" description="สร้างคลังคำถาม เปิดแบบทดสอบออนไลน์ ตรวจคำตอบอัตโนมัติ และให้คะแนนคำตอบอธิบาย">
      <div className="phase2-dashboard-grid">
        <Metric icon={<FileQuestion />} label="แบบทดสอบทั้งหมด" value={metrics.quiz_count} />
        <Metric icon={<CheckCircle2 />} label="กำลังเปิด" value={metrics.published_count} />
        <Metric icon={<BarChart3 />} label="ครั้งที่เข้าสอบ" value={metrics.attempt_count} />
        <Metric icon={<Clock3 />} label="รอตรวจคำตอบ" value={metrics.pending_review_count} />
      </div>

      <section className="phase2-section-card">
        <div className="phase2-section-heading"><div><span className="phase-panel-kicker">CREATE BY CLASS</span><h2>เลือกชั้นเรียนเพื่อสร้างแบบทดสอบ</h2><p>แบบทดสอบทุกชุดเชื่อมกับชั้นเรียนและสิทธิ์ของนักเรียนที่ลงทะเบียน</p></div></div>
        <div className="phase3-class-shortcuts phase4-class-shortcuts">
          {classes.map((classRow) => (
            <Link href={`/teacher/classes/${classRow.id}/quizzes`} key={classRow.id} style={{ "--course-color": classRow.course_color ?? "#0d5ba7" } as React.CSSProperties}>
              <span><School size={19} /></span><div><small>{classRow.class_code}</small><strong>{classRow.subject_name}</strong><em>{classRow.class_name}</em></div><Plus size={18} />
            </Link>
          ))}
          {!classes.length && <div className="phase2-empty-state small"><School size={30} /><p>กรุณาสร้างชั้นเรียนก่อนสร้างแบบทดสอบ</p><Link href="/teacher/classes" className="phase2-primary-button">สร้างชั้นเรียน</Link></div>}
        </div>
      </section>

      <section className="phase2-section-card">
        <div className="phase2-section-heading"><div><span className="phase-panel-kicker">QUIZ LIBRARY</span><h2>รายการแบบทดสอบ</h2><p>{quizzes.length} ชุด</p></div></div>
        <div className="phase4-quiz-list">
          {quizzes.map((quiz) => (
            <Link href={`/teacher/quizzes/${quiz.id}`} className="phase4-quiz-row" key={quiz.id}>
              <span className="phase4-quiz-icon"><FileQuestion size={22} /></span>
              <div className="phase4-quiz-main"><div><QuizStatusBadge status={quiz.status} /><small>{quiz.class_code} · {quiz.class_name}</small></div><strong>{quiz.title}</strong><span>{quiz.question_count} ข้อ · {quiz.total_points} คะแนน · ทำแล้ว {quiz.attempt_count} ครั้ง</span></div>
              <div className="phase4-row-metrics"><span><strong>{quiz.pending_review_count}</strong> รอตรวจ</span><span><strong>{quiz.average_percent ?? "-"}%</strong> เฉลี่ย</span></div>
              <ArrowRight size={18} />
            </Link>
          ))}
          {!quizzes.length && <div className="phase2-empty-state"><FileQuestion size={38} /><h3>ยังไม่มีแบบทดสอบ</h3><p>เลือกชั้นเรียนด้านบนเพื่อสร้างแบบทดสอบชุดแรก</p></div>}
        </div>
      </section>
    </DashboardShell>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <article className="phase2-metric-card"><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></article>;
}
