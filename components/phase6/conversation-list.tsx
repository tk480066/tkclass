import Link from "next/link";
import { ArrowRight, MessageCircleMore, UserRound } from "lucide-react";
import type { ConversationSummary } from "@/lib/types";

export function ConversationList({ conversations, role, limit }: { conversations: ConversationSummary[]; role: "teacher" | "student"; limit?: number }) {
  const rows = typeof limit === "number" ? conversations.slice(0, limit) : conversations;
  return (
    <div className="phase6-conversation-list">
      {rows.map((row) => (
        <Link href={`/${role}/communication/messages/${row.id}`} key={row.id} className={`phase6-conversation-card ${row.unread_count ? "is-unread" : ""}`}>
          <span className="phase6-conversation-avatar"><UserRound size={20} /></span>
          <div><small>{row.class_code} · {row.subject_name}</small><strong>{row.participant_names.join(", ") || "การสนทนา"}</strong><p><b>{row.subject}</b> · {row.latest_message ?? "ยังไม่มีข้อความ"}</p><em>{formatDate(row.last_message_at)}</em></div>
          {row.unread_count > 0 && <span className="phase6-unread-count">{row.unread_count}</span>}
          <ArrowRight size={17} />
        </Link>
      ))}
      {!rows.length && <div className="phase2-empty-state small"><MessageCircleMore size={32} /><h3>ยังไม่มีการสนทนา</h3><p>เริ่มต้นการสนทนาใหม่จากแบบฟอร์มด้านข้าง</p></div>}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
