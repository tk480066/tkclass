import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarCheck2, CheckCircle2, Clock3, UsersRound } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { AttendanceSessionForm } from "@/components/phase5/attendance-session-form";
import { AttendanceStatusBadge } from "@/components/phase5/attendance-status-badge";
import { getClassAttendanceOverview } from "@/lib/data/phase5";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "เช็กชื่อชั้นเรียน" };

export default async function ClassAttendancePage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const user = await requireRole("teacher");
  const { classRow, roster, sessions } = await getClassAttendanceOverview(user.id, classId);
  const closed = sessions.filter((row) => row.status === "closed");
  const totalPresent = closed.reduce((sum, row) => sum + row.present_count + row.late_count, 0);
  const denominator = closed.length * Math.max(roster.filter((row) => row.enrollment_status === "active").length, 1);
  const average = denominator ? Math.round((totalPresent / denominator) * 1000) / 10 : null;
  return (
    <DashboardShell user={user} title={`เช็กชื่อ · ${classRow.subject_name}`} description={`${classRow.class_code} · ${classRow.class_name} · จัดการคาบเช็กชื่อและประวัติการเข้าเรียน`}>
      <Link href={`/teacher/classes/${classId}`} className="phase2-back-link"><ArrowLeft size={17} /> กลับหน้าชั้นเรียน</Link>
      <div className="phase2-dashboard-grid">
        <Metric icon={<UsersRound />} label="นักเรียน" value={roster.filter((row) => row.enrollment_status === "active").length} suffix="คน" />
        <Metric icon={<CalendarCheck2 />} label="คาบทั้งหมด" value={sessions.length} suffix="คาบ" />
        <Metric icon={<CheckCircle2 />} label="ปิดผลแล้ว" value={closed.length} suffix="คาบ" />
        <Metric icon={<Clock3 />} label="อัตราเข้าเรียนเฉลี่ย" value={average ?? 0} suffix={average === null ? "-" : "%"} />
      </div>

      <div className="phase5-two-column-layout">
        <AttendanceSessionForm classId={classId} />
        <section className="phase2-section-card">
          <div className="phase2-section-heading compact"><div><span className="phase-panel-kicker">ATTENDANCE HISTORY</span><h2>ประวัติคาบเช็กชื่อ</h2><p>{sessions.length} รายการ</p></div></div>
          <div className="phase5-session-list compact-list">
            {sessions.map((session) => (
              <Link href={`/teacher/attendance/${session.id}`} key={session.id}>
                <span className="phase5-session-date"><strong>{new Intl.DateTimeFormat("th-TH", { day: "2-digit" }).format(new Date(`${session.session_date}T00:00:00`))}</strong><small>{new Intl.DateTimeFormat("th-TH", { month: "short" }).format(new Date(`${session.session_date}T00:00:00`))}</small></span>
                <div><strong>{session.title}</strong><small>{session.period_label ?? "ไม่ระบุคาบ"}</small><em>มา {session.present_count} · สาย {session.late_count} · ขาด {session.absent_count}</em></div>
                <AttendanceStatusBadge status={session.status} /><ArrowRight size={16} />
              </Link>
            ))}
            {!sessions.length && <div className="phase2-empty-state small"><CalendarCheck2 size={30} /><p>ยังไม่มีประวัติเช็กชื่อ</p></div>}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

function Metric({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: number; suffix: string }) {
  return <article className="phase2-metric-card"><span>{icon}</span><div><strong>{value}<em>{suffix}</em></strong><small>{label}</small></div></article>;
}
