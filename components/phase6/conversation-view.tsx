import { Download, LockKeyhole, Paperclip, UsersRound } from "lucide-react";
import { markConversationReadAction, setConversationStatusAction } from "@/app/phase6-actions";
import { MessageAttachmentUpload } from "@/components/phase6/message-attachment-upload";
import { MessageComposer } from "@/components/phase6/message-composer";
import type { ConversationDetail } from "@/lib/types";

export function ConversationView({ detail, currentUserId, role }: { detail: ConversationDetail; currentUserId: string; role: "teacher" | "student" }) {
  const latestOwnMessage = [...detail.messages].reverse().find((row) => row.sender_id === currentUserId && !row.deleted_at);
  return (
    <div className="phase6-thread-layout">
      <section className="phase6-thread-panel">
        <div className="phase6-thread-header">
          <div><span className="phase-panel-kicker">{detail.conversation.class_code} · {detail.conversation.subject_name}</span><h2>{detail.conversation.subject}</h2><p><UsersRound size={15} /> {detail.participants.map((row) => row.display_name).join(" · ")}</p></div>
          <div className="phase6-thread-status"><span className={`is-${detail.conversation.status}`}>{statusLabel(detail.conversation.status)}</span>{role === "teacher" && <form action={setConversationStatusAction}><input type="hidden" name="conversationId" value={detail.conversation.id} /><select name="status" defaultValue={detail.conversation.status}><option value="active">เปิดสนทนา</option><option value="closed">ปิดสนทนา</option><option value="archived">เก็บเข้าคลัง</option></select><button type="submit">บันทึก</button></form>}</div>
        </div>
        <form action={markConversationReadAction} className="phase6-read-form"><input type="hidden" name="conversationId" value={detail.conversation.id} /><button type="submit">ทำเครื่องหมายว่าอ่านถึงข้อความล่าสุด</button></form>
        <div className="phase6-message-stream">
          {detail.messages.map((message) => {
            const mine = message.sender_id === currentUserId;
            return <article className={`phase6-message-bubble ${mine ? "is-mine" : ""}`} key={message.id}><div className="phase6-message-author"><strong>{mine ? "ฉัน" : message.sender_name}</strong><span>{formatDate(message.created_at)}</span></div><p>{message.body}</p>{message.attachments.length > 0 && <div className="phase6-message-files">{message.attachments.map((file) => <a href={file.signed_url ?? "#"} target="_blank" rel="noreferrer" key={file.id}><Paperclip size={14} /><span>{file.file_name}</span><Download size={14} /></a>)}</div>}</article>;
          })}
          {!detail.messages.length && <div className="phase2-empty-state small"><p>ยังไม่มีข้อความในหัวข้อนี้</p></div>}
        </div>
        <MessageComposer conversationId={detail.conversation.id} role={role} disabled={detail.conversation.status !== "active"} />
        {latestOwnMessage && detail.conversation.status === "active" && <MessageAttachmentUpload userId={currentUserId} conversationId={detail.conversation.id} messageId={latestOwnMessage.id} />}
        {detail.conversation.status !== "active" && <div className="phase6-thread-locked"><LockKeyhole size={17} /> การสนทนานี้ปิดหรือเก็บเข้าคลังแล้ว</div>}
      </section>
    </div>
  );
}

function statusLabel(status: string) { return status === "active" ? "กำลังสนทนา" : status === "closed" ? "ปิดแล้ว" : "เก็บเข้าคลัง"; }
function formatDate(value: string) { return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
