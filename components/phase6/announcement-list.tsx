import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Eye, Megaphone, Paperclip, Pin } from "lucide-react";
import { PriorityBadge } from "@/components/phase6/priority-badge";
import type { AnnouncementSummary } from "@/lib/types";

export function AnnouncementList({ announcements, role, limit }: { announcements: AnnouncementSummary[]; role: "teacher" | "student"; limit?: number }) {
  const rows = typeof limit === "number" ? announcements.slice(0, limit) : announcements;
  return (
    <div className="phase6-announcement-list">
      {rows.map((row) => (
        <Link href={`/${role}/communication/announcements/${row.id}`} key={row.id} className={`phase6-announcement-card ${!row.is_read && role === "student" ? "is-unread" : ""}`}>
          <span className="phase6-announcement-icon"><Megaphone size={19} /></span>
          <div className="phase6-announcement-main">
            <div className="phase6-announcement-meta"><PriorityBadge priority={row.priority} />{row.is_pinned && <span><Pin size={13} /> ปักหมุด</span>}<span>{row.class_code}</span></div>
            <strong>{row.title}</strong>
            <p>{row.body}</p>
            <div className="phase6-announcement-foot"><span><Clock3 size={14} /> {formatDate(row.publish_at ?? row.created_at)}</span>{row.attachment_count > 0 && <span><Paperclip size={14} /> {row.attachment_count} ไฟล์</span>}{role === "teacher" ? <span><Eye size={14} /> อ่าน {row.read_count}/{row.recipient_count}</span> : row.is_read ? <span><CheckCircle2 size={14} /> อ่านแล้ว</span> : <span className="unread-label">ใหม่</span>}</div>
          </div>
          <ArrowRight size={18} />
        </Link>
      ))}
      {!rows.length && <div className="phase2-empty-state small"><Megaphone size={32} /><h3>ยังไม่มีประกาศ</h3><p>{role === "teacher" ? "สร้างประกาศเพื่อแจ้งข้อมูลแก่นักเรียน" : "ประกาศจากครูจะแสดงที่นี่"}</p></div>}
    </div>
  );
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "ไม่กำหนดเวลา";
}
