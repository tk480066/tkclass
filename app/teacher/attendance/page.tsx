import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarCheck2, CheckCircle2, Clock3, School, UserRoundX } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { AttendanceStatusBadge } from "@/components/phase5/attendance-status-badge";
import { getTeacherAttendanceDashboard } from "@/lib/data/phase5";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "เช็กชื่อ" };

export default async function TeacherAttendancePage() {
  const user = await requireRole("teacher");
  const { classes, sessions, metrics } = await getTeacherAttendanceDashboard(user.id);
  return (
    <DashboardShell user={user} title="เช็กชื่อและติดตามเวลาเรียน" description="สร้างคาบเช็กชื่อ เปิดรหัสสำหรับนักเรียน บันทึกสถานะรายบุคคล และดูสรุปการเข้าเรียนของแต่ละชั้น">
      <div className="phase2-dashboard-grid">
        <Metric icon={<CalendarCheck2 />} label="คาบวันนี้" value={metrics.today} />
        <Metric icon={<Clock3 />} label="กำลังเปิด" value={metrics.open} />
        <Metric icon={<CheckCircle2 />} label="ปิดแล้ว" value={metrics.closed} />
        <Metric icon={<UserRoundX />} label="ยังไม่เช็ก" value={metrics.unmarked} />
      </div>

      <section className="phase2-section-card">
        <div className="phase2-section-heading"><div><span className="phase-panel-kicker">CREATE BY CLASS</span><h2>เลือกชั้นเรียนเพื่อเช็กชื่อ</h2><p>สร้างคาบใหม่หรือดูประวัติการเข้าเรียนของชั้นนั้น</p></div></div>
        <div className="phase3-class-shortcuts phase5-class-shortcuts">
          {classes.map((classRow) => (
            <Link href={`/teacher/classes/${classRow.id}/attendance`} key={classRow.id} style={{ "--course-color": classRow.course_color ?? "#0d5ba7" } as React.CSSProperties}>
              <span><School size={19} /></span><div><small>{classRow.class_code}</small><strong>{classRow.subject_name}</strong><em>{classRow.class_name} · {classRow.student_count} คน</em></div><ArrowRight size={18} />
            </Link>
          ))}
          {!classes.length && <div className="phase2-empty-state small"><School size={30} /><p>กรุณาสร้างชั้นเรียนก่อนเริ่มเช็กชื่อ</p><Link href="/teacher/classes" className="phase2-primary-button">สร้างชั้นเรียน</Link></div>}
        </div>
      </section>

      <section className="phase2-section-card">
        <div className="phase2-section-heading"><div><span className="phase-panel-kicker">RECENT SESSIONS</span><h2>คาบเช็กชื่อล่าสุด</h2><p>{sessions.length} รายการ</p></div></div>
        <div className="phase5-session-list">
          {sessions.map((session) => (
            <Link href={`/teacher/attendance/${session.id}`} key={session.id}>
              <span className="phase5-session-date"><strong>{new Intl.DateTimeFormat("th-TH", { day: "2-digit" }).format(new Date(`${session.session_date}T00:00:00`))}</strong><small>{new Intl.DateTimeFormat("th-TH", { month: "short" }).format(new Date(`${session.session_date}T00:00:00`))}</small></span>
              <div><small>{session.class_code} · {session.class_name}</small><strong>{session.title}</strong><em>{session.period_label ?? "ไม่ระบุคาบ"}</em></div>
              <div className="phase5-session-counts"><span>มา {session.present_count}</span><span>สาย {session.late_count}</span><span>ขาด {session.absent_count}</span></div>
              <AttendanceStatusBadge status={session.status} />
              <ArrowRight size={17} />
            </Link>
          ))}
          {!sessions.length && <div className="phase2-empty-state"><CalendarCheck2 size={38} /><h3>ยังไม่มีคาบเช็กชื่อ</h3><p>เลือกชั้นเรียนด้านบนเพื่อสร้างคาบแรก</p></div>}
        </div>
      </section>
    </DashboardShell>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <article className="phase2-metric-card"><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></article>;
}
