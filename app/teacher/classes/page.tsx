import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, School, UsersRound } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { ClassForm } from "@/components/phase2/class-form";
import { getTeacherClassSummaries } from "@/lib/data/phase2";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "จัดการชั้นเรียน" };

export default async function TeacherClassesPage() {
  const user = await requireRole("teacher");
  const classes = await getTeacherClassSummaries(user.id);
  return (
    <DashboardShell user={user} title="ชั้นเรียนของฉัน" description="สร้าง แก้ไข และจัดการชั้นเรียนที่รับผิดชอบ พร้อมเชื่อมรายชื่อนักเรียนและหลักสูตร">
      <div className="phase2-two-column-layout">
        <section className="phase2-section-card sticky-form-card">
          <div className="phase2-section-heading compact"><div><span className="phase-panel-kicker">CREATE CLASS</span><h2>สร้างชั้นเรียนใหม่</h2></div></div>
          <ClassForm />
        </section>
        <section className="phase2-section-card">
          <div className="phase2-section-heading compact"><div><span className="phase-panel-kicker">CLASS LIST</span><h2>รายการชั้นเรียน</h2><p>{classes.length} ชั้นเรียน</p></div></div>
          <div className="class-list-stack">
            {classes.map((classRow) => (
              <Link href={`/teacher/classes/${classRow.id}`} className="class-list-item" key={classRow.id}>
                <span className="class-list-color" style={{ background: classRow.course_color ?? "#0d5ba7" }} />
                <div className="class-list-main"><small>{classRow.class_code}</small><strong>{classRow.subject_name}</strong><span>{classRow.class_name} · ห้อง {classRow.room || "-"}</span></div>
                <div className="class-list-metrics"><span><UsersRound size={15} /> {classRow.student_count}</span><span><BookOpenCheck size={15} /> {classRow.lesson_count}</span></div>
                <ArrowRight size={18} />
              </Link>
            ))}
            {!classes.length && <div className="phase2-empty-state small"><School size={30} /><p>ยังไม่มีชั้นเรียน</p></div>}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
