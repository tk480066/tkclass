import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard-shell";
import { ConversationList } from "@/components/phase6/conversation-list";
import { ConversationStartForm } from "@/components/phase6/conversation-start-form";
import { requireRole } from "@/lib/auth/require-role";
import { getConversations, getStudentCommunicationClasses } from "@/lib/data/phase6";

export const metadata: Metadata = { title: "ข้อความของฉัน" };

export default async function StudentMessagesPage() {
  const user = await requireRole("student");
  const [conversations, classes] = await Promise.all([getConversations(user.id), getStudentCommunicationClasses(user.id)]);
  const options = classes.map((row) => ({ value: `${row.id}|${user.id}`, label: `${row.class_code} · ${row.subject_name}`, group: "รายวิชาของฉัน" }));
  return <DashboardShell user={user} title="ข้อความของฉัน" description="ส่งคำถามถึงครูผู้สอนและกลับมาอ่านคำตอบได้จากทุกอุปกรณ์"><div className="phase2-two-column-layout phase6-message-layout"><section className="phase2-section-card"><ConversationStartForm options={options} role="student" /></section><section className="phase2-section-card"><div className="phase2-section-heading"><div><span className="phase-panel-kicker">MY CONVERSATIONS</span><h2>การสนทนาทั้งหมด</h2><p>{conversations.reduce((sum, row) => sum + row.unread_count, 0)} ข้อความยังไม่อ่าน</p></div></div><ConversationList conversations={conversations} role="student" /></section></div></DashboardShell>;
}
