import type { Metadata } from "next";
import Link from "next/link";
import { Archive, ArrowLeft, Download, ExternalLink, FileText, Link2, Paperclip, Trash2, UsersRound } from "lucide-react";
import { archiveAssignmentAction, removeAssignmentAttachmentAction } from "@/app/phase3-actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { AssignmentForm } from "@/components/phase3/assignment-form";
import { AssignmentFileUpload } from "@/components/phase3/assignment-file-upload";
import { ExternalAttachmentForm } from "@/components/phase3/external-attachment-form";
import { ReviewForm } from "@/components/phase3/review-form";
import { StatusBadge } from "@/components/phase3/status-badge";
import { getTeacherAssignmentEditor } from "@/lib/data/phase3";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "รายละเอียดงานและการตรวจงาน" };

export default async function AssignmentDetailPage({ params, searchParams }: { params: Promise<{ assignmentId: string }>; searchParams: Promise<{ status?: string }> }) {
  const { assignmentId } = await params;
  const { status } = await searchParams;
  const user = await requireRole("teacher");
  const data = await getTeacherAssignmentEditor(user.id, assignmentId);
  const selectedTargets = data.targets;
  const filtered = status ? data.submissions.filter((row) => row.status === status) : data.submissions;
  return (
    <DashboardShell user={user} title={data.assignment.title} description={`${data.classRow.subject_name} · ${data.classRow.class_name} · คะแนนเต็ม ${data.assignment.max_score}`}>
      <Link href={`/teacher/classes/${data.classRow.id}/assignments`} className="phase2-back-link"><ArrowLeft size={16} /> กลับรายการงาน</Link>

      <div className="phase2-two-column-layout phase3-editor-layout">
        <section className="phase2-section-card"><div className="phase2-section-heading compact"><div><span className="phase-panel-kicker">ASSIGNMENT SETTINGS</span><h2>รายละเอียดงาน</h2></div><StatusBadge status={data.assignment.status} /></div><AssignmentForm classRow={data.classRow} roster={data.roster} assignment={data.assignment} targets={selectedTargets} /></section>
        <aside className="phase3-attachment-column">
          <section className="phase2-section-card"><AssignmentFileUpload teacherId={user.id} classId={data.classRow.id} assignmentId={assignmentId} /></section>
          <section className="phase2-section-card"><ExternalAttachmentForm assignmentId={assignmentId} /></section>
          <section className="phase2-section-card">
            <div className="phase2-section-heading compact"><div><span className="phase-panel-kicker">ATTACHMENTS</span><h2>เอกสารประกอบ</h2><p>{data.attachments.length} รายการ</p></div></div>
            <div className="phase3-attachment-list">
              {data.attachments.map((item) => (
                <div key={item.id}><span>{item.storage_path ? <FileText size={18} /> : <Link2 size={18} />}</span><div><strong>{item.file_name || "เอกสารประกอบ"}</strong><small>{item.mime_type || (item.external_url ? "External link" : "File")}</small></div><a href={item.signed_url || item.external_url || "#"} target="_blank" rel="noreferrer" title="เปิดไฟล์">{item.storage_path ? <Download size={17} /> : <ExternalLink size={17} />}</a><form action={removeAssignmentAttachmentAction}><input type="hidden" name="assignmentId" value={assignmentId} /><input type="hidden" name="attachmentId" value={item.id} /><button type="submit" title="ลบ"><Trash2 size={16} /></button></form></div>
              ))}
              {!data.attachments.length && <p className="phase3-muted"><Paperclip size={17} /> ยังไม่มีเอกสารประกอบ</p>}
            </div>
          </section>
          <form action={archiveAssignmentAction} className="phase3-archive-form"><input type="hidden" name="assignmentId" value={assignmentId} /><button type="submit"><Archive size={17} /> เก็บงานเข้าคลัง</button></form>
        </aside>
      </div>

      <section className="phase2-section-card phase3-review-section">
        <div className="phase2-section-heading"><div><span className="phase-panel-kicker">SUBMISSIONS</span><h2>ตรวจผลงานนักเรียน</h2><p>{data.submissions.length} ผลงาน · กำลังแสดง {filtered.length} รายการ</p></div><div className="phase3-filter-row"><Link href={`/teacher/assignments/${assignmentId}`}>ทั้งหมด</Link><Link href={`?status=submitted`}>รอตรวจ</Link><Link href={`?status=late`}>ล่าช้า</Link><Link href={`?status=revision_required`}>ต้องแก้ไข</Link><Link href={`?status=passed`}>ผ่าน</Link></div></div>
        <div className="phase3-submission-stack">
          {filtered.map((submission) => (
            <article className="phase3-submission-card" key={submission.id}>
              <header><div className="phase3-student-avatar"><UsersRound size={20} /></div><div><strong>{submission.student_name}</strong><small>{submission.student_code}{submission.group_name ? ` · ${submission.group_name}` : ""}</small></div><StatusBadge status={submission.status} /></header>
              {submission.members.length > 1 && <div className="phase3-member-row"><strong>สมาชิก:</strong>{submission.members.map((member) => <span key={member.student_id}>{member.student_name}</span>)}</div>}
              <div className="phase3-submission-content"><div><small>คำตอบ</small><p>{submission.answer_text || "ไม่ได้พิมพ์คำตอบ"}</p>{submission.link_url && <a href={submission.link_url} target="_blank" rel="noreferrer"><ExternalLink size={15} /> เปิดลิงก์ผลงาน</a>}</div><div><small>ไฟล์แนบ</small><div className="phase3-file-links">{submission.files.map((file) => <a key={file.id} href={file.signed_url || "#"} target="_blank" rel="noreferrer"><Download size={15} /> {file.file_name}</a>)}{!submission.files.length && <span>ไม่มีไฟล์</span>}</div></div></div>
              <ReviewForm assignmentId={assignmentId} maxScore={Number(data.assignment.max_score)} submission={submission} />
            </article>
          ))}
          {!filtered.length && <div className="phase2-empty-state"><UsersRound size={36} /><h3>ยังไม่มีผลงานในสถานะนี้</h3><p>ผลงานที่นักเรียนส่งจะปรากฏในส่วนนี้</p></div>}
        </div>
      </section>
    </DashboardShell>
  );
}
