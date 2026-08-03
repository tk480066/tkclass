import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpenCheck, CheckCircle2, Clock3, Layers3, PlayCircle } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { getStudentCourse } from "@/lib/data/phase2";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "รายละเอียดรายวิชา" };

export default async function StudentCoursePage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const user = await requireRole("student");
  const { course, units } = await getStudentCourse(user.id, classId);
  return (
    <DashboardShell user={user} title={course.subject_name} description={`${course.class_name} · ครูผู้สอน ${course.teacher_name} · ความก้าวหน้า ${course.progress_percent}%`}>
      <Link href="/student/courses" className="phase2-back-link"><ArrowLeft size={16} /> กลับรายวิชาของฉัน</Link>
      <section className="student-course-hero-card" style={{ "--course-color": course.course_color ?? "#0d5ba7" } as React.CSSProperties}>
        <div><span>{course.class_code}</span><h2>{course.subject_name}</h2><p>{course.description || "เรียนรู้ผ่านบทเรียน กิจกรรม และสื่อประกอบที่ครูจัดเตรียมไว้"}</p><div className="student-course-details"><span><Layers3 size={16} /> {course.unit_count} หน่วย</span><span><BookOpenCheck size={16} /> {course.lesson_count} บทเรียน</span></div></div>
        <div className="large-progress-ring"><strong>{course.progress_percent}%</strong><span>ความก้าวหน้า</span></div>
      </section>

      <div className="student-unit-list">
        {units.map((unit) => (
          <section className="student-unit-card" key={unit.id}>
            <header><span className="unit-order-badge">{unit.order_no}</span><div><small>UNIT {unit.order_no}</small><h2>{unit.title}</h2><p>{unit.description || ""}</p></div></header>
            <div className="student-lesson-list">
              {unit.lessons.map((lesson) => {
                const completed = lesson.progress?.status === "completed";
                return (
                  <Link href={`/student/lessons/${lesson.id}`} className={`student-lesson-row ${completed ? "is-completed" : ""}`} key={lesson.id}>
                    <span className="student-lesson-status">{completed ? <CheckCircle2 size={20} /> : <PlayCircle size={20} />}</span>
                    <div><small>บทที่ {lesson.order_no}</small><strong>{lesson.title}</strong><span><Clock3 size={14} /> {lesson.estimated_minutes} นาที · {completed ? "เรียนจบแล้ว" : lesson.progress ? "กำลังเรียน" : "ยังไม่เริ่ม"}</span></div>
                    <ArrowRight size={18} />
                  </Link>
                );
              })}
              {!unit.lessons.length && <div className="phase2-empty-state small"><BookOpenCheck size={25} /><p>ยังไม่มีบทเรียนที่เผยแพร่</p></div>}
            </div>
          </section>
        ))}
        {!units.length && <div className="phase2-section-card phase2-empty-state"><Layers3 size={38} /><h3>ครูยังไม่ได้เผยแพร่หน่วยการเรียนรู้</h3></div>}
      </div>
    </DashboardShell>
  );
}
