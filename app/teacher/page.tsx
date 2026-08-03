import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Layers3,
  Plus,
  School,
  UsersRound,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { getTeacherClassSummaries } from "@/lib/data/phase2";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "ระบบครู" };

export default async function TeacherPage() {
  const user = await requireRole("teacher");
  const classes = await getTeacherClassSummaries(user.id);
  const metrics = {
    classes: classes.length,
    students: classes.reduce((sum, row) => sum + row.student_count, 0),
    units: classes.reduce((sum, row) => sum + row.unit_count, 0),
    lessons: classes.reduce((sum, row) => sum + row.lesson_count, 0),
  };

  return (
    <DashboardShell
      user={user}
      title="จัดการชั้นเรียนและบทเรียน"
      description="สร้างชั้นเรียน จัดการรายชื่อนักเรียน ออกแบบหน่วยการเรียนรู้และบทเรียน พร้อมตรวจสอบความก้าวหน้าของผู้เรียน"
    >
      <div className="phase2-dashboard-grid">
        <MetricCard icon={<School />} label="ชั้นเรียน" value={metrics.classes} />
        <MetricCard icon={<UsersRound />} label="นักเรียนในความรับผิดชอบ" value={metrics.students} />
        <MetricCard icon={<Layers3 />} label="หน่วยการเรียนรู้" value={metrics.units} />
        <MetricCard icon={<BookOpenCheck />} label="บทเรียนทั้งหมด" value={metrics.lessons} />
      </div>

      <section className="phase2-section-card">
        <div className="phase2-section-heading">
          <div><span className="phase-panel-kicker">MY CLASSES</span><h2>ชั้นเรียนล่าสุด</h2><p>เลือกชั้นเรียนเพื่อจัดการนักเรียน หน่วยการเรียนรู้ และบทเรียน</p></div>
          <Link href="/teacher/classes" className="phase2-primary-button"><Plus size={17} /> จัดการชั้นเรียน</Link>
        </div>
        {classes.length ? (
          <div className="course-card-grid">
            {classes.slice(0, 6).map((classRow) => (
              <Link href={`/teacher/classes/${classRow.id}`} className="teacher-course-card" key={classRow.id} style={{ "--course-color": classRow.course_color ?? "#0d5ba7" } as React.CSSProperties}>
                <span className="course-card-code">{classRow.class_code}</span>
                <h3>{classRow.subject_name}</h3>
                <p>{classRow.class_name}</p>
                <div className="course-card-stats">
                  <span><UsersRound size={15} /> {classRow.student_count} คน</span>
                  <span><Layers3 size={15} /> {classRow.unit_count} หน่วย</span>
                  <span><BookOpenCheck size={15} /> {classRow.lesson_count} บท</span>
                </div>
                <span className="course-card-link">เปิดชั้นเรียน <ArrowRight size={16} /></span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="phase2-empty-state"><School size={36} /><h3>ยังไม่มีชั้นเรียน</h3><p>เริ่มต้นโดยสร้างชั้นเรียนแรกของคุณ</p><Link href="/teacher/classes" className="phase2-primary-button"><Plus size={17} /> สร้างชั้นเรียน</Link></div>
        )}
      </section>
    </DashboardShell>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <article className="phase2-metric-card"><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></article>;
}
