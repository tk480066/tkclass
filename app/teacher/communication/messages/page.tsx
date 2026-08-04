import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard-shell";
import { ConversationList } from "@/components/phase6/conversation-list";
import { ConversationStartForm } from "@/components/phase6/conversation-start-form";
import { requireRole } from "@/lib/auth/require-role";
import { getConversations, getTeacherCommunicationContacts } from "@/lib/data/phase6";

export const metadata: Metadata = { title: "ข้อความ" };

export default async function TeacherMessagesPage() {
  const user = await requireRole("teacher");
  const [conversations, groups] = await Promise.all([getConversations(user.id), getTeacherCommunicationContacts(user.id)]);
  const options = groups.flatMap(({ classRow, students }) => students.map((student) => ({ value: `${classRow.id}|${student.user_id}`, label: `${student.student_code} · ${student.display_name}`, group: `${classRow.class_code} · ${classRow.subject_name}` })));
  return (
    <DashboardShell user={user} title="ข้อความและการสนทนา" description="เริ่มการสนทนากับนักเรียน ตอบคำถาม และติดตามข้อความที่ยังไม่ได้อ่าน">
      <div className="phase2-two-column-layout phase6-message-layout">
        <section className="phase2-section-card"><ConversationStartForm options={options} role="teacher" /></section>
        <section className="phase2-section-card"><div className="phase2-section-heading"><div><span className="phase-panel-kicker">INBOX</span><h2>การสนทนาทั้งหมด</h2><p>{conversations.reduce((sum, row) => sum + row.unread_count, 0)} ข้อความยังไม่อ่าน</p></div></div><ConversationList conversations={conversations} role="teacher" /></section>
      </div>
    </DashboardShell>
  );
}
