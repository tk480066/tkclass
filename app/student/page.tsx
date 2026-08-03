import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, CheckCircle2, GraduationCap, Layers3 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { getStudentCourses } from "@/lib/data/phase2";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "ระบบนักเรียน" };

export default async function StudentPage() {
  const user = await requireRole("student");
  const courses = await getStudentCourses(user.id);
  const totalLessons = courses.reduce((sum, course) => sum + course.lesson_count, 0);
  const completed = courses.reduce((sum, course) => sum + course.completed_lessons, 0);
  const averageProgress = courses.length ? Math.round(courses.reduce((sum, course) => sum + course.progress_percent, 0) / courses.length) : 0;

  return (
    <DashboardShell user={user} title="พื้นที่การเรียนรู้ของฉัน" description="เข้าถึงรายวิชา บทเรียน และติดตามความก้าวหน้าของตนเองได้จากทุกอุปกรณ์">
      <div className="phase2-dashboard-grid student-metric-grid">
        <StudentMetric icon={<GraduationCap />} label="รายวิชาที่ลงทะเบียน" value={courses.length} suffix="วิชา" />
        <StudentMetric icon={<Layers3 />} label="บทเรียนทั้งหมด" value={totalLessons} suffix="บท" />
        <StudentMetric icon={<CheckCircle2 />} label="เรียนจบแล้ว" value={completed} suffix="บท" />
        <StudentMetric icon={<BookOpenCheck />} label="ความก้าวหน้าเฉลี่ย" value={averageProgress} suffix="%" />
      </div>

      <section className="phase2-section-card">
        <div className="phase2-section-heading">
          <div><span className="phase-panel-kicker">MY COURSES</span><h2>รายวิชาของฉัน</h2><p>เลือกวิชาเพื่อดูหน่วยการเรียนรู้และบทเรียนที่เผยแพร่แล้ว</p></div>
          <Link href="/student/courses" className="phase2-secondary-button">ดูทั้งหมด <ArrowRight size={17} /></Link>
        </div>
        <div className="student-course-grid">
          {courses.slice(0, 6).map((course) => (
            <Link href={`/student/courses/${course.id}`} className="student-course-card" key={course.id} style={{ "--course-color": course.course_color ?? "#0d5ba7" } as React.CSSProperties}>
              <div className="student-course-cover"><span>{course.class_code}</span><GraduationCap size={36} /></div>
              <div className="student-course-body"><small>{course.class_name}</small><h3>{course.subject_name}</h3><p>ครูผู้สอน: {course.teacher_name}</p><div className="course-progress-row"><div><i style={{ width: `${course.progress_percent}%` }} /></div><strong>{course.progress_percent}%</strong></div><span className="course-card-link">เข้าสู่รายวิชา <ArrowRight size={16} /></span></div>
            </Link>
          ))}
          {!courses.length && <div className="phase2-empty-state full-span"><GraduationCap size={38} /><h3>ยังไม่มีรายวิชา</h3><p>ติดต่อครูผู้สอนเพื่อเพิ่มคุณเข้าสู่ชั้นเรียน</p></div>}
        </div>
      </section>
    </DashboardShell>
  );
}

function StudentMetric({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: number; suffix: string }) {
  return <article className="phase2-metric-card"><span>{icon}</span><div><strong>{value}<em>{suffix}</em></strong><small>{label}</small></div></article>;
}
