import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, GraduationCap, School, UsersRound } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { getTeacherGradebookDashboard } from "@/lib/data/phase5";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "สมุดคะแนน" };

export default async function TeacherGradebookPage() {
  const user = await requireRole("teacher");
  const { classes } = await getTeacherGradebookDashboard(user.id);
  const published = classes.filter((row) => row.final_grade_published).length;
  return (
    <DashboardShell user={user} title="สมุดคะแนนและผลการเรียน" description="รวมคะแนนจากงาน แบบทดสอบ และคะแนนเพิ่มเติม พร้อมคำนวณผลรวมตามหมวดและติดตามเวลาเรียน">
      <div className="phase2-dashboard-grid">
        <Metric icon={<School />} label="ชั้นเรียน" value={classes.length} suffix="ห้อง" />
        <Metric icon={<UsersRound />} label="นักเรียน" value={classes.reduce((sum, row) => sum + row.student_count, 0)} suffix="คน" />
        <Metric icon={<BookOpenCheck />} label="รายการเรียนรู้" value={classes.reduce((sum, row) => sum + row.lesson_count, 0)} suffix="รายการ" />
        <Metric icon={<GraduationCap />} label="เผยแพร่ผลรวม" value={published} suffix="ห้อง" />
      </div>

      <section className="phase2-section-card">
        <div className="phase2-section-heading"><div><span className="phase-panel-kicker">GRADEBOOK BY CLASS</span><h2>เลือกชั้นเรียน</h2><p>เปิดสมุดคะแนน ตั้งค่าน้ำหนัก และเผยแพร่ผลการเรียนรายห้อง</p></div></div>
        <div className="course-card-grid">
          {classes.map((classRow) => (
            <Link href={`/teacher/classes/${classRow.id}/gradebook`} className="teacher-course-card phase5-gradebook-class-card" key={classRow.id} style={{ "--course-color": classRow.course_color ?? "#0d5ba7" } as React.CSSProperties}>
              <span className="course-card-code">{classRow.class_code}</span>
              <h3>{classRow.subject_name}</h3><p>{classRow.class_name}</p>
              <div className="course-card-stats"><span><UsersRound size={15} /> {classRow.student_count} คน</span><span><GraduationCap size={15} /> {classRow.final_grade_published ? "เผยแพร่ผลแล้ว" : "ยังไม่เผยแพร่ผล"}</span></div>
              <span className="course-card-link">เปิดสมุดคะแนน <ArrowRight size={16} /></span>
            </Link>
          ))}
          {!classes.length && <div className="phase2-empty-state full-span"><School size={38} /><h3>ยังไม่มีชั้นเรียน</h3><p>สร้างชั้นเรียนก่อนเริ่มใช้สมุดคะแนน</p></div>}
        </div>
      </section>
    </DashboardShell>
  );
}

function Metric({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: number; suffix: string }) {
  return <article className="phase2-metric-card"><span>{icon}</span><div><strong>{value}<em>{suffix}</em></strong><small>{label}</small></div></article>;
}
