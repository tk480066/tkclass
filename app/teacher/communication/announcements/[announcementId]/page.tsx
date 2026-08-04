import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download, ExternalLink, Eye, Link2, Paperclip, Trash2 } from "lucide-react";
import { addAnnouncementExternalAttachmentAction, deleteAnnouncementAttachmentAction, setAnnouncementStatusAction } from "@/app/phase6-actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { AnnouncementFileUpload } from "@/components/phase6/announcement-file-upload";
import { AnnouncementForm } from "@/components/phase6/announcement-form";
import { requireRole } from "@/lib/auth/require-role";
import { getTeacherClassSummaries } from "@/lib/data/phase2";
import { getAnnouncementDetail } from "@/lib/data/phase6";

export const metadata: Metadata = { title: "รายละเอียดประกาศ" };

export default async function TeacherAnnouncementDetailPage({ params }: { params: Promise<{ announcementId: string }> }) {
  const { announcementId } = await params;
  const user = await requireRole("teacher");
  const [detail, classes] = await Promise.all([getAnnouncementDetail(user.id, announcementId), getTeacherClassSummaries(user.id)]);
  const { announcement, attachments } = detail;
  return (
    <DashboardShell user={user} title={announcement.title} description={`${announcement.class_code} · ${announcement.subject_name} · อ่านแล้ว ${announcement.read_count}/${announcement.recipient_count} คน`}>
      <Link href="/teacher/communication/announcements" className="phase2-back-link"><ArrowLeft size={16} /> กลับหน้าประกาศ</Link>
      <div className="phase2-two-column-layout phase6-editor-layout">
        <section className="phase2-section-card"><AnnouncementForm classes={classes} announcement={announcement} /></section>
        <section className="phase2-section-card phase6-attachment-panel">
          <div className="phase2-section-heading compact"><div><span className="phase-panel-kicker">ATTACHMENTS & STATUS</span><h2>เอกสารและการเผยแพร่</h2></div></div>
          <div className="phase6-read-stat"><Eye size={20} /><div><strong>{announcement.read_count}/{announcement.recipient_count}</strong><span>นักเรียนอ่านประกาศแล้ว</span></div></div>
          <div className="phase6-status-actions"><form action={setAnnouncementStatusAction}><input type="hidden" name="announcementId" value={announcementId} /><select name="status" defaultValue={announcement.status}><option value="draft">ฉบับร่าง</option><option value="published">เผยแพร่</option><option value="archived">เก็บเข้าคลัง</option></select><button type="submit">เปลี่ยนสถานะ</button></form></div>
          <AnnouncementFileUpload userId={user.id} announcementId={announcementId} />
          <form action={async (formData: FormData) => { "use server"; await addAnnouncementExternalAttachmentAction({}, formData); }} className="phase6-external-link-form"><input type="hidden" name="announcementId" value={announcementId} /><label><span>ชื่อเอกสาร/ลิงก์</span><input name="fileName" required placeholder="เช่น คู่มือกิจกรรม" /></label><label><span>URL</span><input type="url" name="externalUrl" required placeholder="https://..." /></label><button type="submit"><Link2 size={16} /> เพิ่มลิงก์</button></form>
          <div className="phase6-attachment-list">
            {attachments.map((file) => <div key={file.id}><span><Paperclip size={17} /></span><div><strong>{file.file_name ?? "เอกสารประกอบ"}</strong><small>{file.mime_type ?? (file.external_url ? "External link" : "File")}</small></div><a href={file.signed_url ?? file.external_url ?? "#"} target="_blank" rel="noreferrer">{file.external_url ? <ExternalLink size={16} /> : <Download size={16} />}</a><form action={deleteAnnouncementAttachmentAction}><input type="hidden" name="attachmentId" value={file.id} /><input type="hidden" name="announcementId" value={announcementId} /><button type="submit"><Trash2 size={15} /></button></form></div>)}
            {!attachments.length && <p className="phase6-muted">ยังไม่มีเอกสารประกอบ</p>}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
