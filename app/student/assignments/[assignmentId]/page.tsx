import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock3, Download, ExternalLink, FileText, MessageSquareText, Paperclip, Trash2 } from "lucide-react";
import { removeSubmissionFileAction } from "@/app/phase3-actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatusBadge } from "@/components/phase3/status-badge";
import { SubmissionFileUpload } from "@/components/phase3/submission-file-upload";
import { SubmissionForm } from "@/components/phase3/submission-form";
import { getStudentAssignment } from "@/lib/data/phase3";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "รายละเอียดงาน" };

export default async function StudentAssignmentPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const user = await requireRole("student");
  const data = await getStudentAssignment(user.id, assignmentId);
  const isOwner = !data.submission || data.submission.submitted_by === user.id;
  const allowsFiles = data.assignment.allowed_submission_types.some((type) => ["file", "image", "video"].includes(type));
  const editable = isOwner && (!data.submission || ["draft", "withdrawn", "revision_required"].includes(data.submission.status));
  return (
    <DashboardShell user={user} title={data.assignment.title} description={`${data.assignment.subject_name} · ${data.assignment.class_name} · ครูผู้สอน ${data.assignment.teacher_name}`}>
      <Link href="/student/assignments" className="phase2-back-link"><ArrowLeft size={16} /> กลับไปงานของฉัน</Link>
      <div className="phase2-two-column-layout student-assignment-layout">
        <main className="phase3-assignment-reader">
          <header><div><StatusBadge status={data.assignment.display_status} /><small>{data.assignment.work_type === "group" ? `งานกลุ่ม · ${data.assignment.target_group_name || ""}` : "งานเดี่ยว"}</small></div><h1>{data.assignment.title}</h1><div className="phase3-deadline-row"><span><Clock3 size={16} /> กำหนดส่ง {formatDate(data.assignment.due_at)}</span><span>คะแนนเต็ม {data.assignment.max_score}</span></div></header>
          <section className="phase3-instructions"><h2>คำสั่งและรายละเอียด</h2><p>{data.assignment.instructions || "ไม่มีรายละเอียดเพิ่มเติม"}</p></section>
          <section className="phase3-materials"><h2><Paperclip size={19} /> เอกสารประกอบ</h2><div>{data.attachments.map((item) => <a href={item.signed_url || item.external_url || "#"} target="_blank" rel="noreferrer" key={item.id}><span>{item.storage_path ? <FileText size={18} /> : <ExternalLink size={18} />}</span><div><strong>{item.file_name || "เอกสารประกอบ"}</strong><small>{item.mime_type || "เปิดลิงก์"}</small></div><Download size={17} /></a>)}{!data.attachments.length && <p>ไม่มีเอกสารประกอบ</p>}</div></section>
          {data.submission?.teacher_feedback && <section className="phase3-teacher-feedback"><span><MessageSquareText size={20} /></span><div><strong>ความคิดเห็นจากครู</strong><p>{data.submission.teacher_feedback}</p>{data.submission.score !== null && <em>คะแนน {data.submission.score} / {data.assignment.max_score}</em>}</div></section>}
          <section className="phase3-workspace"><h2>พื้นที่ส่งงาน</h2><SubmissionForm assignment={data.assignment} submission={data.submission} groupMembers={data.groupMembers} currentStudentId={user.id} /></section>
        </main>
        <aside className="phase3-submission-sidebar">
          <section className="phase2-section-card"><div className="phase2-section-heading compact"><div><span className="phase-panel-kicker">SUBMISSION FILES</span><h2>ไฟล์ผลงาน</h2></div></div>{allowsFiles ? <SubmissionFileUpload studentId={user.id} assignmentId={assignmentId} submissionId={data.submission?.id ?? ""} allowedTypes={data.assignment.allowed_submission_types} disabled={!data.submission || !editable} /> : <p className="phase3-muted">งานนี้กำหนดให้ส่งด้วยข้อความหรือลิงก์ ไม่ต้องอัปโหลดไฟล์</p>}<div className="phase3-student-file-list">{data.files.map((file) => <div key={file.id}><a href={file.signed_url || "#"} target="_blank" rel="noreferrer"><Download size={16} /><span><strong>{file.file_name}</strong><small>{formatBytes(file.file_size)}</small></span></a>{editable && <form action={removeSubmissionFileAction}><input type="hidden" name="assignmentId" value={assignmentId} /><input type="hidden" name="submissionId" value={data.submission!.id} /><input type="hidden" name="fileId" value={file.id} /><button type="submit"><Trash2 size={15} /></button></form>}</div>)}{!data.files.length && <p>ยังไม่มีไฟล์ผลงาน</p>}</div></section>
          <section className="phase2-section-card phase3-status-summary"><span className="phase-panel-kicker">CURRENT STATUS</span><StatusBadge status={data.assignment.display_status} /><dl><div><dt>กำหนดส่ง</dt><dd>{formatDate(data.assignment.due_at)}</dd></div><div><dt>ส่งล่าสุด</dt><dd>{formatDate(data.submission?.submitted_at ?? null)}</dd></div><div><dt>ส่งใหม่แล้ว</dt><dd>{data.submission?.revision_count ?? 0} ครั้ง</dd></div></dl></section>
        </aside>
      </div>
    </DashboardShell>
  );
}
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "ยังไม่มีข้อมูล"; }
function formatBytes(value: number | null) { if (!value) return ""; if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`; return `${(value / 1024 / 1024).toFixed(1)} MB`; }
