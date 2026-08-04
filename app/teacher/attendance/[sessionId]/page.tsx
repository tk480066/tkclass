import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, Copy, Download, LockKeyhole, Play, UsersRound, XCircle } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { AttendanceRosterForm } from "@/components/phase5/attendance-roster-form";
import { AttendanceStatusBadge } from "@/components/phase5/attendance-status-badge";
import { setAttendanceSessionStatusAction } from "@/app/phase5-actions";
import { getAttendanceSessionDetail } from "@/lib/data/phase5";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "บันทึกการเข้าเรียน" };

export default async function AttendanceSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const user = await requireRole("teacher");
  const { classRow, session, roster } = await getAttendanceSessionDetail(user.id, sessionId);
  const counts = {
    present: roster.filter((row) => ["present", "activity"].includes(row.record?.status ?? "")).length,
    late: roster.filter((row) => row.record?.status === "late").length,
    absent: roster.filter((row) => row.record?.status === "absent").length,
    unmarked: roster.filter((row) => !row.record || row.record.status === "unmarked").length,
  };
  return (
    <DashboardShell user={user} title={session.title} description={`${classRow.class_code} · ${classRow.class_name} · ${new Intl.DateTimeFormat("th-TH", { dateStyle: "long" }).format(new Date(`${session.session_date}T00:00:00`))}`}>
      <Link href={`/teacher/classes/${classRow.id}/attendance`} className="phase2-back-link"><ArrowLeft size={17} /> กลับประวัติเช็กชื่อ</Link>
      <div className="phase2-dashboard-grid">
        <Metric icon={<UsersRound />} label="มาเรียน" value={counts.present} />
        <Metric icon={<Clock3 />} label="มาสาย" value={counts.late} />
        <Metric icon={<XCircle />} label="ขาดเรียน" value={counts.absent} />
        <Metric icon={<CheckCircle2 />} label="ยังไม่เช็ก" value={counts.unmarked} />
      </div>

      <section className="phase5-session-control-card">
        <div><span className="phase-panel-kicker">SESSION CONTROL</span><h2>สถานะคาบและรหัสเช็กชื่อ</h2><p>{session.period_label ?? "ไม่ระบุคาบ"} · <AttendanceStatusBadge status={session.status} /></p></div>
        <div className="phase5-code-panel">
          <small>รหัสเช็กชื่อ 6 หลัก</small><strong>{session.check_in_code ?? "------"}</strong><span><Copy size={15} /> ให้นักเรียนกรอกในหน้าเช็กชื่อ</span>
        </div>
        <div className="phase5-control-actions"><Link href={`/teacher/attendance/${sessionId}/export`} className="phase2-secondary-button"><Download size={16} /> ส่งออก CSV</Link>
          {session.status !== "open" && <form action={setAttendanceSessionStatusAction}><input type="hidden" name="sessionId" value={sessionId} /><input type="hidden" name="status" value="open" /><button className="phase2-primary-button" type="submit"><Play size={16} /> เปิดเช็กชื่อ</button></form>}
          {session.status === "open" && <form action={setAttendanceSessionStatusAction}><input type="hidden" name="sessionId" value={sessionId} /><input type="hidden" name="status" value="closed" /><button className="phase2-primary-button" type="submit"><LockKeyhole size={16} /> ปิดและบันทึกขาด</button></form>}
          {session.status !== "cancelled" && <form action={setAttendanceSessionStatusAction}><input type="hidden" name="sessionId" value={sessionId} /><input type="hidden" name="status" value="cancelled" /><button className="phase2-secondary-button" type="submit">ยกเลิกคาบ</button></form>}
        </div>
      </section>

      <section className="phase2-section-card">
        <AttendanceRosterForm sessionId={sessionId} roster={roster} />
      </section>
    </DashboardShell>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <article className="phase2-metric-card"><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></article>;
}
