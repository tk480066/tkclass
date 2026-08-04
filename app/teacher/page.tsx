import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  ClipboardCheck,
  FileQuestion,
  Clock3,
  CalendarCheck2,
  GraduationCap,
  Layers3,
  MessageCircleMore,
  Plus,
  School,
  UsersRound,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { getTeacherAssignmentDashboard } from "@/lib/data/phase3";
import { getTeacherQuizDashboard } from "@/lib/data/phase4";
import { getTeacherAttendanceDashboard } from "@/lib/data/phase5";
import { getCommunicationCounts } from "@/lib/data/phase6";
import { QuizStatusBadge } from "@/components/phase4/quiz-status-badge";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "ระบบครู" };

export default async function TeacherPage() {
  const user = await requireRole("teacher");
  const [assignmentData, quizData, attendanceData, communicationCounts] = await Promise.all([getTeacherAssignmentDashboard(user.id), getTeacherQuizDashboard(user.id), getTeacherAttendanceDashboard(user.id), getCommunicationCounts(user.id, user.profile.role)]);
  const { classes, assignments, metrics: assignmentMetrics } = assignmentData;
  const { quizzes, metrics: quizMetrics } = quizData;
  const metrics = {
    classes: classes.length,
    students: classes.reduce((sum, row) => sum + row.student_count, 0),
    lessons: classes.reduce((sum, row) => sum + row.lesson_count, 0),
    pendingReview: assignmentMetrics.pending_review_count,
    quizzes: quizMetrics.quiz_count,
    attendanceOpen: attendanceData.metrics.open,
    attendanceToday: attendanceData.metrics.today,
    unreadMessages: communicationCounts.unreadMessages,
  };

  return (
    <DashboardShell
      user={user}
      title="จัดการการเรียนรู้และงานของนักเรียน"
      description="สร้างชั้นเรียนและบทเรียน มอบหมายงาน เช็กชื่อ ให้คะแนน และสื่อสารกับนักเรียนจากพื้นที่เดียวกัน"
    >
      <div className="phase2-dashboard-grid">
        <MetricCard icon={<School />} label="ชั้นเรียน" value={metrics.classes} />
        <MetricCard icon={<UsersRound />} label="นักเรียนในความรับผิดชอบ" value={metrics.students} />
        <MetricCard icon={<BookOpenCheck />} label="บทเรียนทั้งหมด" value={metrics.lessons} />
        <MetricCard icon={<Clock3 />} label="งานที่รอตรวจ" value={metrics.pendingReview} />
        <MetricCard icon={<FileQuestion />} label="แบบทดสอบ" value={metrics.quizzes} />
        <MetricCard icon={<CalendarCheck2 />} label="คาบเช็กชื่อวันนี้" value={metrics.attendanceToday} />
        <MetricCard icon={<MessageCircleMore />} label="ข้อความยังไม่อ่าน" value={metrics.unreadMessages} />
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


      <div className="phase5-dashboard-shortcuts phase6-dashboard-shortcuts">
        <Link href="/teacher/communication"><MessageCircleMore size={24} /><div><span className="phase-panel-kicker">COMMUNICATION</span><strong>ประกาศและข้อความ</strong><p>สื่อสารกับผู้เรียนและติดตามการอ่าน</p></div><em>{metrics.unreadMessages} ยังไม่อ่าน</em><ArrowRight size={18} /></Link>
        <Link href="/teacher/attendance"><CalendarCheck2 size={24} /><div><span className="phase-panel-kicker">ATTENDANCE</span><strong>เช็กชื่อและเวลาเรียน</strong><p>สร้างคาบ เปิดรหัส และดูประวัติการเข้าเรียน</p></div><em>{metrics.attendanceOpen} คาบกำลังเปิด</em><ArrowRight size={18} /></Link>
        <Link href="/teacher/gradebook"><GraduationCap size={24} /><div><span className="phase-panel-kicker">GRADEBOOK</span><strong>สมุดคะแนนและผลการเรียน</strong><p>รวมคะแนนงาน แบบทดสอบ และคะแนนเพิ่มเติม</p></div><em>{classes.length} ชั้นเรียน</em><ArrowRight size={18} /></Link>
      </div>

      <section className="phase2-section-card">
        <div className="phase2-section-heading">
          <div><span className="phase-panel-kicker">QUIZZES</span><h2>แบบทดสอบล่าสุด</h2><p>{quizzes.length} ชุด · รอตรวจ {quizMetrics.pending_review_count} ครั้ง</p></div>
          <Link href="/teacher/quizzes" className="phase2-secondary-button"><FileQuestion size={17} /> แบบทดสอบทั้งหมด</Link>
        </div>
        <div className="phase4-dashboard-quiz-list">
          {quizzes.slice(0, 5).map((quiz) => (
            <Link href={`/teacher/quizzes/${quiz.id}`} key={quiz.id}><span><FileQuestion size={18} /></span><div><small>{quiz.class_code}</small><strong>{quiz.title}</strong><em>{quiz.question_count} ข้อ · ทำแล้ว {quiz.attempt_count} ครั้ง</em></div><QuizStatusBadge status={quiz.status} /><ArrowRight size={17} /></Link>
          ))}
          {!quizzes.length && <div className="phase2-empty-state small"><FileQuestion size={30} /><p>ยังไม่มีแบบทดสอบ</p></div>}
        </div>
      </section>
    </DashboardShell>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <article className="phase2-metric-card"><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></article>;
}
