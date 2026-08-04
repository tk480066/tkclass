import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ClipboardList, Clock3, UsersRound } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { AssignmentForm } from "@/components/phase3/assignment-form";
import { StatusBadge } from "@/components/phase3/status-badge";
import { getClassRoster, getTeacherClass } from "@/lib/data/phase2";
import { getTeacherAssignments } from "@/lib/data/phase3";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "จัดการงานในชั้นเรียน" };

export default async function ClassAssignmentsPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const user = await requireRole("teacher");
  const [classRow, roster, assignments] = await Promise.all([
    getTeacherClass(user.id, classId),
    getClassRoster(user.id, classId),
    getTeacherAssignments(user.id, classId),
  ]);
  return (
    <DashboardShell user={user} title={`งาน · ${classRow.subject_name}`} description={`${classRow.class_name} · สร้างงานเดี่ยวหรืองานกลุ่ม พร้อมเลือกนักเรียนและกำหนดส่ง`}>
      <Link href={`/teacher/classes/${classId}`} className="phase2-back-link"><ArrowLeft size={16} /> กลับหน้าชั้นเรียน</Link>
      <div className="phase2-two-column-layout phase3-assignment-layout">
        <section className="phase2-section-card sticky-form-card"><div className="phase2-section-heading compact"><div><span className="phase-panel-kicker">NEW ASSIGNMENT</span><h2>สร้างงานใหม่</h2></div></div><AssignmentForm classRow={classRow} roster={roster} /></section>
        <section className="phase2-section-card">
          <div className="phase2-section-heading compact"><div><span className="phase-panel-kicker">ASSIGNMENT LIST</span><h2>งานในชั้นเรียน</h2><p>{assignments.length} งาน · นักเรียน {roster.length} คน</p></div></div>
          <div className="phase3-class-assignment-stack">
            {assignments.map((assignment) => (
              <Link href={`/teacher/assignments/${assignment.id}`} key={assignment.id}>
                <div><StatusBadge status={assignment.status} /><small>{assignment.work_type === "group" ? "งานกลุ่ม" : "งานเดี่ยว"}</small></div>
                <strong>{assignment.title}</strong>
                <span><Clock3 size={14} /> {formatDate(assignment.due_at)}</span>
                <span><UsersRound size={14} /> ส่งแล้ว {assignment.submission_count} · รอตรวจ {assignment.pending_review_count}</span>
                <ArrowRight size={18} />
              </Link>
            ))}
            {!assignments.length && <div className="phase2-empty-state"><ClipboardList size={36} /><h3>ยังไม่มีงาน</h3><p>ใช้แบบฟอร์มด้านซ้ายเพื่อสร้างงานแรก</p></div>}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "ไม่กำหนดส่ง"; }
