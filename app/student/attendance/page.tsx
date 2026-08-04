import type { Metadata } from "next";
import { CalendarCheck2, CheckCircle2, Clock3, Percent, XCircle } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { AttendanceCheckInForm } from "@/components/phase5/attendance-checkin-form";
import { AttendanceStatusBadge } from "@/components/phase5/attendance-status-badge";
import { getStudentAttendance } from "@/lib/data/phase5";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "การเข้าเรียนของฉัน" };

export default async function StudentAttendancePage() {
  const user = await requireRole("student");
  const { items, overallPercent, totalSessions, attendedSessions } = await getStudentAttendance(user.id);
  const lateCount = items.filter((item) => item.record?.status === "late").length;
  const absentCount = items.filter((item) => item.record?.status === "absent").length;
  return (
    <DashboardShell user={user} title="การเข้าเรียนของฉัน" description="เช็กชื่อด้วยรหัสจากครูและตรวจสอบประวัติการมาเรียน มาสาย ขาด และลาในแต่ละรายวิชา">
      <div className="phase2-dashboard-grid student-metric-grid">
        <Metric icon={<Percent />} label="อัตราเข้าเรียน" value={overallPercent ?? 0} suffix={overallPercent === null ? "-" : "%"} />
        <Metric icon={<CheckCircle2 />} label="เข้าเรียนแล้ว" value={attendedSessions} suffix={`/${totalSessions} คาบ`} />
        <Metric icon={<Clock3 />} label="มาสาย" value={lateCount} suffix="ครั้ง" />
        <Metric icon={<XCircle />} label="ขาดเรียน" value={absentCount} suffix="ครั้ง" />
      </div>

      <AttendanceCheckInForm />

      <section className="phase2-section-card">
        <div className="phase2-section-heading"><div><span className="phase-panel-kicker">ATTENDANCE HISTORY</span><h2>ประวัติการเข้าเรียน</h2><p>แสดงคาบที่ครูเปิดเผยและผลเช็กชื่อของบัญชีคุณ</p></div></div>
        <div className="phase5-student-attendance-list">
          {items.map((item) => (
            <article key={item.id}>
              <span className="phase5-session-date"><strong>{new Intl.DateTimeFormat("th-TH", { day: "2-digit" }).format(new Date(`${item.session_date}T00:00:00`))}</strong><small>{new Intl.DateTimeFormat("th-TH", { month: "short" }).format(new Date(`${item.session_date}T00:00:00`))}</small></span>
              <div><small>{item.class_code} · {item.class_name}</small><strong>{item.title}</strong><em>{item.subject_name} · ครู {item.teacher_name}</em></div>
              <div className="phase5-student-attendance-meta"><span>{item.period_label ?? "ไม่ระบุคาบ"}</span>{item.record?.checked_in_at && <span>เช็ก {new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit" }).format(new Date(item.record.checked_in_at))}</span>}</div>
              <AttendanceStatusBadge status={item.record?.status ?? "unmarked"} />
            </article>
          ))}
          {!items.length && <div className="phase2-empty-state"><CalendarCheck2 size={38} /><h3>ยังไม่มีประวัติเช็กชื่อ</h3><p>เมื่อครูเปิดคาบเช็กชื่อ รายการจะแสดงที่นี่</p></div>}
        </div>
      </section>
    </DashboardShell>
  );
}

function Metric({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: number; suffix: string }) {
  return <article className="phase2-metric-card"><span>{icon}</span><div><strong>{value}<em>{suffix}</em></strong><small>{label}</small></div></article>;
}
