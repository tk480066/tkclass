import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, GraduationCap, Layers3 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { getStudentCourses } from "@/lib/data/phase2";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "รายวิชาของฉัน" };

export default async function StudentCoursesPage() {
  const user = await requireRole("student");
  const courses = await getStudentCourses(user.id);
  return (
    <DashboardShell user={user} title="รายวิชาของฉัน" description="รายวิชาที่ลงทะเบียน ครูผู้สอน จำนวนบทเรียน และความก้าวหน้าของคุณ">
      <section className="phase2-section-card">
        <div className="phase2-section-heading compact"><div><span className="phase-panel-kicker">ENROLLED COURSES</span><h2>{courses.length} รายวิชา</h2></div></div>
        <div className="student-course-grid">
          {courses.map((course) => (
            <Link href={`/student/courses/${course.id}`} className="student-course-card detailed" key={course.id} style={{ "--course-color": course.course_color ?? "#0d5ba7" } as React.CSSProperties}>
              <div className="student-course-cover"><span>{course.class_code}</span><GraduationCap size={38} /></div>
              <div className="student-course-body">
                <small>{course.class_name}</small><h3>{course.subject_name}</h3><p>ครูผู้สอน: {course.teacher_name}</p>
                <div className="student-course-details"><span><Layers3 size={15} /> {course.unit_count} หน่วย</span><span><BookOpenCheck size={15} /> {course.lesson_count} บท</span></div>
                <div className="course-progress-row"><div><i style={{ width: `${course.progress_percent}%` }} /></div><strong>{course.progress_percent}%</strong></div>
                <span className="course-card-link">เปิดรายวิชา <ArrowRight size={16} /></span>
              </div>
            </Link>
          ))}
          {!courses.length && <div className="phase2-empty-state full-span"><GraduationCap size={38} /><h3>ยังไม่มีรายวิชาที่ลงทะเบียน</h3></div>}
        </div>
      </section>
    </DashboardShell>
  );
}
