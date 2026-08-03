import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Trash2, UserRound, UsersRound } from "lucide-react";
import { removeEnrollmentAction } from "@/app/phase2-actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { EnrollStudentForm, ImportStudentsForm } from "@/components/phase2/student-manager";
import { getClassRoster, getTeacherClass } from "@/lib/data/phase2";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "รายชื่อนักเรียน" };

export default async function ClassStudentsPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const user = await requireRole("teacher");
  const [classRow, roster] = await Promise.all([getTeacherClass(user.id, classId), getClassRoster(user.id, classId)]);
  return (
    <DashboardShell user={user} title="จัดการรายชื่อนักเรียน" description={`${classRow.subject_name} · ${classRow.class_name} · นักเรียน ${roster.length} คน`}>
      <Link href={`/teacher/classes/${classId}`} className="phase2-back-link"><ArrowLeft size={16} /> กลับหน้าชั้นเรียน</Link>
      <div className="phase2-two-column-layout roster-layout">
        <div className="student-tools-stack"><section className="phase2-section-card"><EnrollStudentForm classId={classId} /></section><section className="phase2-section-card"><ImportStudentsForm classId={classId} /></section></div>
        <section className="phase2-section-card">
          <div className="phase2-section-heading compact"><div><span className="phase-panel-kicker">CLASS ROSTER</span><h2>รายชื่อนักเรียน</h2></div><span className="phase2-count-pill"><UsersRound size={15} /> {roster.length} คน</span></div>
          <div className="roster-table-wrap">
            <table className="phase2-table">
              <thead><tr><th>เลขที่</th><th>นักเรียน</th><th>รหัส</th><th>กลุ่ม</th><th>สถานะ</th><th /></tr></thead>
              <tbody>
                {roster.map((student) => (
                  <tr key={student.enrollment_id}>
                    <td>{student.enrollment_number ?? student.student_number ?? "-"}</td>
                    <td><div className="student-table-name"><span><UserRound size={16} /></span><div><strong>{student.display_name}</strong><small>{student.nickname ? `ชื่อเล่น ${student.nickname}` : `${student.level ?? ""}/${student.room ?? ""}`}</small></div></div></td>
                    <td><code>{student.student_code}</code></td><td>{student.group_name || "-"}</td><td><span className="status-badge published">ใช้งาน</span></td>
                    <td><form action={removeEnrollmentAction}><input type="hidden" name="classId" value={classId} /><input type="hidden" name="enrollmentId" value={student.enrollment_id} /><button className="icon-danger-button" type="submit" aria-label="ถอนนักเรียน"><Trash2 size={16} /></button></form></td>
                  </tr>
                ))}
                {!roster.length && <tr><td colSpan={6}><div className="phase2-empty-state small"><UsersRound size={28} /><p>ยังไม่มีนักเรียนในชั้นเรียน</p></div></td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
