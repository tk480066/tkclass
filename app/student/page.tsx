import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, CheckCircle2, ClipboardList, Clock3, FileQuestion, GraduationCap, Layers3 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatusBadge } from "@/components/phase3/status-badge";
import { getStudentCourses } from "@/lib/data/phase2";
import { getStudentAssignments } from "@/lib/data/phase3";
import { getStudentQuizzes } from "@/lib/data/phase4";
import { QuizStatusBadge } from "@/components/phase4/quiz-status-badge";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "ระบบนักเรียน" };

export default async function StudentPage() {
  const user = await requireRole("student");
  const [courses, assignments, quizzes] = await Promise.all([getStudentCourses(user.id), getStudentAssignments(user.id), getStudentQuizzes(user.id)]);
  const totalLessons = courses.reduce((sum, course) => sum + course.lesson_count, 0);
  const completed = courses.reduce((sum, course) => sum + course.completed_lessons, 0);
  const pendingAssignments = assignments.filter((row) => ["not_started", "draft", "withdrawn", "revision_required"].includes(row.display_status)).length;
  const openQuizzes = quizzes.filter((row) => row.availability === "open").length;
  const dueSoon = assignments.filter((row) => row.due_at && new Date(row.due_at).getTime() > Date.now() && new Date(row.due_at).getTime() - Date.now() <= 3 * 86400000 && ["not_started", "draft", "withdrawn", "revision_required"].includes(row.display_status)).length;

  return (
    <DashboardShell user={user} title="พื้นที่การเรียนรู้ของฉัน" description="เข้าถึงรายวิชา บทเรียน งานที่ได้รับมอบหมาย และติดตามผลการเรียนของตนเองได้จากทุกอุปกรณ์">
      <div className="phase2-dashboard-grid student-metric-grid">
        <StudentMetric icon={<GraduationCap />} label="รายวิชาที่ลงทะเบียน" value={courses.length} suffix="วิชา" />
        <StudentMetric icon={<Layers3 />} label="เรียนจบแล้ว" value={completed} suffix={`/${totalLessons} บท`} />
        <StudentMetric icon={<ClipboardList />} label="งานที่ต้องทำ" value={pendingAssignments} suffix="งาน" />
        <StudentMetric icon={<Clock3 />} label="ใกล้ครบกำหนด" value={dueSoon} suffix="งาน" />
        <StudentMetric icon={<FileQuestion />} label="แบบทดสอบเปิด" value={openQuizzes} suffix="ชุด" />
      </div>

      <section className="phase2-section-card">
        <div className="phase2-section-heading"><div><span className="phase-panel-kicker">MY ASSIGNMENTS</span><h2>งานที่ต้องดำเนินการ</h2><p>งานใหม่ งานค้าง และงานที่ครูขอให้แก้ไข</p></div><Link href="/student/assignments" className="phase2-secondary-button">ดูงานทั้งหมด <ArrowRight size={17} /></Link></div>
        <div className="phase3-dashboard-student-tasks">
          {assignments.filter((row) => ["not_started", "draft", "withdrawn", "revision_required"].includes(row.display_status)).slice(0, 5).map((assignment) => (
            <Link href={`/student/assignments/${assignment.id}`} key={assignment.id}><span><ClipboardList size={18} /></span><div><small>{assignment.subject_name}</small><strong>{assignment.title}</strong><em>กำหนดส่ง {formatDate(assignment.due_at)}</em></div><StatusBadge status={assignment.display_status} /><ArrowRight size={17} /></Link>
          ))}
          {!pendingAssignments && <div className="phase2-empty-state small"><CheckCircle2 size={32} /><h3>ไม่มีงานค้าง</h3><p>คุณดำเนินการงานที่ได้รับมอบหมายครบแล้ว</p></div>}
        </div>
      </section>



      <section className="phase2-section-card">
        <div className="phase2-section-heading"><div><span className="phase-panel-kicker">OPEN QUIZZES</span><h2>แบบทดสอบที่กำลังเปิด</h2><p>เริ่มทำและติดตามผลคะแนนของฉัน</p></div><Link href="/student/quizzes" className="phase2-secondary-button">ดูแบบทดสอบทั้งหมด <ArrowRight size={17} /></Link></div>
        <div className="phase4-dashboard-quiz-list student">
          {quizzes.filter((quiz) => quiz.availability === "open").slice(0, 5).map((quiz) => (
            <Link href={`/student/quizzes/${quiz.id}`} key={quiz.id}><span><FileQuestion size={18} /></span><div><small>{quiz.subject_name}</small><strong>{quiz.title}</strong><em>{quiz.total_points} คะแนน · {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} นาที` : "ไม่จำกัดเวลา"}</em></div><QuizStatusBadge status={quiz.latest_attempt?.status ?? quiz.availability} /><ArrowRight size={17} /></Link>
          ))}
          {!openQuizzes && <div className="phase2-empty-state small"><CheckCircle2 size={30} /><p>ไม่มีแบบทดสอบที่กำลังเปิด</p></div>}
        </div>
      </section>

      <section className="phase2-section-card">
        <div className="phase2-section-heading"><div><span className="phase-panel-kicker">MY COURSES</span><h2>รายวิชาของฉัน</h2><p>เลือกวิชาเพื่อดูหน่วยการเรียนรู้และบทเรียน</p></div><Link href="/student/courses" className="phase2-secondary-button">ดูทั้งหมด <ArrowRight size={17} /></Link></div>
        <div className="student-course-grid">
          {courses.slice(0, 4).map((course) => (
            <Link href={`/student/courses/${course.id}`} className="student-course-card" key={course.id} style={{ "--course-color": course.course_color ?? "#0d5ba7" } as React.CSSProperties}>
              <div className="student-course-cover"><span>{course.class_code}</span><GraduationCap size={36} /></div><div className="student-course-body"><small>{course.class_name}</small><h3>{course.subject_name}</h3><p>ครูผู้สอน: {course.teacher_name}</p><div className="course-progress-row"><div><i style={{ width: `${course.progress_percent}%` }} /></div><strong>{course.progress_percent}%</strong></div><span className="course-card-link">เข้าสู่รายวิชา <ArrowRight size={16} /></span></div>
            </Link>
          ))}
          {!courses.length && <div className="phase2-empty-state full-span"><BookOpenCheck size={38} /><h3>ยังไม่มีรายวิชา</h3><p>ติดต่อครูผู้สอนเพื่อเพิ่มคุณเข้าสู่ชั้นเรียน</p></div>}
        </div>
      </section>
    </DashboardShell>
  );
}
function StudentMetric({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: number; suffix: string }) { return <article className="phase2-metric-card"><span>{icon}</span><div><strong>{value}<em>{suffix}</em></strong><small>{label}</small></div></article>; }
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "ไม่กำหนด"; }
