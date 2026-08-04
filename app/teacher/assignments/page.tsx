import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck, ClipboardList, Clock3, Plus, School } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatusBadge } from "@/components/phase3/status-badge";
import { getTeacherAssignmentDashboard } from "@/lib/data/phase3";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "งานและการส่งงาน" };

export default async function TeacherAssignmentsPage() {
  const user = await requireRole("teacher");
  const { classes, assignments, metrics } = await getTeacherAssignmentDashboard(user.id);
  return (
    <DashboardShell user={user} title="งานและการส่งงาน" description="สร้างงาน กำหนดผู้ได้รับมอบหมาย ติดตามการส่ง ตรวจผลงาน ให้คะแนน และขอให้นักเรียนแก้ไข">
      <div className="phase2-dashboard-grid">
        <Metric icon={<ClipboardList />} label="งานทั้งหมด" value={metrics.assignment_count} />
        <Metric icon={<CheckCircle2 />} label="งานที่เผยแพร่" value={metrics.published_count} />
        <Metric icon={<Clock3 />} label="รอตรวจ" value={metrics.pending_review_count} />
        <Metric icon={<ClipboardCheck />} label="ผลงานที่ส่ง" value={metrics.submission_count} />
      </div>

      <section className="phase2-section-card">
        <div className="phase2-section-heading"><div><span className="phase-panel-kicker">CREATE BY CLASS</span><h2>เลือกชั้นเรียนเพื่อสร้างงาน</h2><p>งานทุกชิ้นต้องเชื่อมกับชั้นเรียนและรายชื่อนักเรียน</p></div></div>
        <div className="phase3-class-shortcuts">
          {classes.map((classRow) => (
            <Link href={`/teacher/classes/${classRow.id}/assignments`} key={classRow.id} style={{ "--course-color": classRow.course_color ?? "#0d5ba7" } as React.CSSProperties}>
              <span><School size={19} /></span><div><small>{classRow.class_code}</small><strong>{classRow.subject_name}</strong><em>{classRow.class_name}</em></div><Plus size={18} />
            </Link>
          ))}
          {!classes.length && <div className="phase2-empty-state small"><School size={30} /><p>กรุณาสร้างชั้นเรียนก่อนสร้างงาน</p><Link href="/teacher/classes" className="phase2-primary-button">สร้างชั้นเรียน</Link></div>}
        </div>
      </section>

      <section className="phase2-section-card">
        <div className="phase2-section-heading"><div><span className="phase-panel-kicker">RECENT ASSIGNMENTS</span><h2>รายการงานล่าสุด</h2><p>{assignments.length} งาน</p></div></div>
        <div className="phase3-assignment-list">
          {assignments.map((assignment) => (
            <Link href={`/teacher/assignments/${assignment.id}`} className="phase3-assignment-row" key={assignment.id}>
              <div className="phase3-assignment-main"><div><StatusBadge status={assignment.status} /><small>{assignment.class_code} · {assignment.class_name}</small></div><strong>{assignment.title}</strong><span>กำหนดส่ง {formatDate(assignment.due_at)} · คะแนนเต็ม {assignment.max_score}</span></div>
              <div className="phase3-row-metrics"><span><strong>{assignment.submission_count}</strong> ส่งแล้ว</span><span className={assignment.pending_review_count ? "attention" : ""}><strong>{assignment.pending_review_count}</strong> รอตรวจ</span></div>
              <ArrowRight size={18} />
            </Link>
          ))}
          {!assignments.length && <div className="phase2-empty-state"><ClipboardList size={36} /><h3>ยังไม่มีงาน</h3><p>เลือกชั้นเรียนด้านบนเพื่อสร้างงานแรก</p></div>}
        </div>
      </section>
    </DashboardShell>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <article className="phase2-metric-card"><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></article>;
}
function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "ไม่กำหนด";
}
