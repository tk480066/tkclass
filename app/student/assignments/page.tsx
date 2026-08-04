import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardList, Clock3, RotateCcw, Send } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatusBadge } from "@/components/phase3/status-badge";
import { getStudentAssignments } from "@/lib/data/phase3";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "งานของฉัน" };

export default async function StudentAssignmentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const user = await requireRole("student");
  const assignments = await getStudentAssignments(user.id);
  const filtered = status ? assignments.filter((row) => row.display_status === status) : assignments;
  const now = Date.now();
  const metrics = {
    todo: assignments.filter((row) => ["not_started", "draft", "withdrawn", "revision_required"].includes(row.display_status)).length,
    dueSoon: assignments.filter((row) => row.due_at && new Date(row.due_at).getTime() > now && new Date(row.due_at).getTime() - now <= 3 * 86400000 && !["submitted","late","graded","passed","failed"].includes(row.display_status)).length,
    submitted: assignments.filter((row) => ["submitted","late"].includes(row.display_status)).length,
    graded: assignments.filter((row) => ["graded","passed","failed"].includes(row.display_status)).length,
  };
  return (
    <DashboardShell user={user} title="งานของฉัน" description="ดูงานตามสถานะ บันทึกฉบับร่าง อัปโหลดไฟล์ ส่งงาน และตรวจสอบความคิดเห็นจากครู">
      <div className="phase2-dashboard-grid student-metric-grid">
        <Metric icon={<ClipboardList />} label="งานที่ต้องทำ" value={metrics.todo} />
        <Metric icon={<Clock3 />} label="ใกล้ครบกำหนด" value={metrics.dueSoon} />
        <Metric icon={<Send />} label="ส่งแล้ว/รอตรวจ" value={metrics.submitted} />
        <Metric icon={<CheckCircle2 />} label="ได้รับผลตรวจ" value={metrics.graded} />
      </div>
      <section className="phase2-section-card">
        <div className="phase2-section-heading"><div><span className="phase-panel-kicker">MY ASSIGNMENTS</span><h2>รายการงาน</h2><p>{assignments.length} งาน · กำลังแสดง {filtered.length} รายการ</p></div><div className="phase3-filter-row"><Link href="/student/assignments">ทั้งหมด</Link><Link href="?status=not_started">ยังไม่เริ่ม</Link><Link href="?status=draft">กำลังทำ</Link><Link href="?status=submitted">ส่งแล้ว</Link><Link href="?status=revision_required">ต้องแก้ไข</Link><Link href="?status=passed">ผ่าน</Link></div></div>
        <div className="phase3-student-assignment-grid">
          {filtered.map((assignment) => (
            <Link href={`/student/assignments/${assignment.id}`} className="phase3-student-assignment-card" key={assignment.id}>
              <div className="phase3-assignment-card-top"><StatusBadge status={assignment.display_status} /><span>{assignment.work_type === "group" ? "งานกลุ่ม" : "งานเดี่ยว"}</span></div>
              <small>{assignment.class_code} · {assignment.class_name}</small><h3>{assignment.title}</h3><p>{assignment.instructions || "เปิดดูรายละเอียดและคำสั่งงาน"}</p>
              <div className="phase3-assignment-meta"><span><Clock3 size={14} /> {formatDate(assignment.due_at)}</span><span>คะแนนเต็ม {assignment.max_score}</span></div>
              {assignment.submission?.teacher_feedback && <div className="phase3-feedback-preview"><RotateCcw size={15} /> {assignment.submission.teacher_feedback}</div>}
              <span className="course-card-link">เปิดงาน <ArrowRight size={16} /></span>
            </Link>
          ))}
          {!filtered.length && <div className="phase2-empty-state full-span"><ClipboardList size={38} /><h3>ไม่มีงานในสถานะนี้</h3><p>ลองเลือกตัวกรองอื่น หรือตรวจสอบอีกครั้งภายหลัง</p></div>}
        </div>
      </section>
    </DashboardShell>
  );
}
function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <article className="phase2-metric-card"><span>{icon}</span><div><strong>{value}<em>งาน</em></strong><small>{label}</small></div></article>; }
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "ไม่กำหนดส่ง"; }
