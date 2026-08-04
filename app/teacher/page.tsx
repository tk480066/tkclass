import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  ClipboardCheck,
  Clock3,
  Layers3,
  Plus,
  School,
  UsersRound,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { getTeacherAssignmentDashboard } from "@/lib/data/phase3";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "ระบบครู" };

export default async function TeacherPage() {
  const user = await requireRole("teacher");
  const { classes, assignments, metrics: assignmentMetrics } = await getTeacherAssignmentDashboard(user.id);
  const metrics = {
    classes: classes.length,
    students: classes.reduce((sum, row) => sum + row.student_count, 0),
    lessons: classes.reduce((sum, row) => sum + row.lesson_count, 0),
    pendingReview: assignmentMetrics.pending_review_count,
  };

  return (
    <DashboardShell
      user={user}
      title="จัดการการเรียนรู้และงานของนักเรียน"
      description="สร้างชั้นเรียนและบทเรียน มอบหมายงาน ติดตามการส่ง ตรวจผลงาน ให้คะแนน และส่งคำขอแก้ไข"
    >
      <div className="phase2-dashboard-grid">
        <MetricCard icon={<School />} label="ชั้นเรียน" value={metrics.classes} />
        <MetricCard icon={<UsersRound />} label="นักเรียนในความรับผิดชอบ" value={metrics.students} />
        <MetricCard icon={<BookOpenCheck />} label="บทเรียนทั้งหมด" value={metrics.lessons} />
        <MetricCard icon={<Clock3 />} label="งานที่รอตรวจ" value={metrics.pendingReview} />
      </div>

      <div className="phase3-dashboard-columns">
        <section className="phase2-section-card">
          <div className="phase2-section-heading">
            <div><span className="phase-panel-kicker">MY CLASSES</span><h2>ชั้นเรียนล่าสุด</h2><p>เลือกชั้นเรียนเพื่อจัดการนักเรียน บทเรียน และงาน</p></div>
            <Link href="/teacher/classes" className="phase2-primary-button"><Plus size={17} /> จัดการชั้นเรียน</Link>
          </div>
          {classes.length ? (
            <div className="course-card-grid">
              {classes.slice(0, 4).map((classRow) => (
                <Link href={`/teacher/classes/${classRow.id}`} className="teacher-course-card" key={classRow.id} style={{ "--course-color": classRow.course_color ?? "#0d5ba7" } as React.CSSProperties}>
                  <span className="course-card-code">{classRow.class_code}</span>
                  <h3>{classRow.subject_name}</h3><p>{classRow.class_name}</p>
                  <div className="course-card-stats"><span><UsersRound size={15} /> {classRow.student_count} คน</span><span><Layers3 size={15} /> {classRow.unit_count} หน่วย</span><span><BookOpenCheck size={15} /> {classRow.lesson_count} บท</span></div>
                  <span className="course-card-link">เปิดชั้นเรียน <ArrowRight size={16} /></span>
                </Link>
              ))}
            </div>
          ) : <div className="phase2-empty-state"><School size={36} /><h3>ยังไม่มีชั้นเรียน</h3><p>เริ่มต้นโดยสร้างชั้นเรียนแรกของคุณ</p></div>}
        </section>

        <section className="phase2-section-card">
          <div className="phase2-section-heading">
            <div><span className="phase-panel-kicker">ASSIGNMENTS</span><h2>งานล่าสุด</h2><p>{assignments.length} งาน · รอตรวจ {assignmentMetrics.pending_review_count} รายการ</p></div>
            <Link href="/teacher/assignments" className="phase2-secondary-button"><ClipboardCheck size={17} /> งานทั้งหมด</Link>
          </div>
          <div className="phase3-dashboard-assignment-list">
            {assignments.slice(0, 6).map((assignment) => (
              <Link href={`/teacher/assignments/${assignment.id}`} key={assignment.id}>
                <span className={assignment.pending_review_count ? "has-pending" : ""}><ClipboardCheck size={18} /></span>
                <div><small>{assignment.class_code}</small><strong>{assignment.title}</strong><em>ส่งแล้ว {assignment.submission_count} · รอตรวจ {assignment.pending_review_count}</em></div>
                <ArrowRight size={17} />
              </Link>
            ))}
            {!assignments.length && <div className="phase2-empty-state small"><ClipboardCheck size={30} /><p>ยังไม่มีงานที่มอบหมาย</p></div>}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <article className="phase2-metric-card"><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></article>;
}
