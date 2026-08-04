import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Download, ExternalLink, Megaphone, Paperclip } from "lucide-react";
import { markAnnouncementReadAction } from "@/app/phase6-actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { PriorityBadge } from "@/components/phase6/priority-badge";
import { requireRole } from "@/lib/auth/require-role";
import { getAnnouncementDetail } from "@/lib/data/phase6";

export const metadata: Metadata = { title: "อ่านประกาศ" };

export default async function StudentAnnouncementDetailPage({ params }: { params: Promise<{ announcementId: string }> }) {
  const { announcementId } = await params;
  const user = await requireRole("student");
  const { announcement, attachments } = await getAnnouncementDetail(user.id, announcementId);
  return (
    <DashboardShell user={user} title={announcement.title} description={`${announcement.class_code} · ${announcement.subject_name} · ครู ${announcement.author_name}`}>
      <Link href="/student/communication" className="phase2-back-link"><ArrowLeft size={16} /> กลับหน้าประกาศ</Link>
      <article className="phase2-section-card phase6-reader-card">
        <div className="phase6-reader-heading"><span className="phase6-reader-icon"><Megaphone size={24} /></span><div><PriorityBadge priority={announcement.priority} /><h2>{announcement.title}</h2><p>เผยแพร่ {formatDate(announcement.publish_at ?? announcement.created_at)}</p></div></div>
        <div className="phase6-reader-body">{announcement.body.split("\n").map((line, index) => <p key={`${index}-${line}`}>{line || <br />}</p>)}</div>
        {attachments.length > 0 && <div className="phase6-reader-files"><h3><Paperclip size={18} /> เอกสารประกอบ</h3>{attachments.map((file) => <a href={file.signed_url ?? file.external_url ?? "#"} target="_blank" rel="noreferrer" key={file.id}><span>{file.file_name ?? "เอกสารประกอบ"}</span>{file.external_url ? <ExternalLink size={16} /> : <Download size={16} />}</a>)}</div>}
        <form action={markAnnouncementReadAction} className="phase6-mark-read"><input type="hidden" name="announcementId" value={announcementId} /><button type="submit"><CheckCircle2 size={17} /> {announcement.is_read ? "อ่านประกาศนี้แล้ว" : "ทำเครื่องหมายว่าอ่านแล้ว"}</button></form>
      </article>
    </DashboardShell>
  );
}
function formatDate(value: string) { return new Intl.DateTimeFormat("th-TH", { dateStyle: "long", timeStyle: "short" }).format(new Date(value)); }
