import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BellRing, Megaphone, MessageCircleMore } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { AnnouncementList } from "@/components/phase6/announcement-list";
import { ConversationList } from "@/components/phase6/conversation-list";
import { ConversationStartForm } from "@/components/phase6/conversation-start-form";
import { requireRole } from "@/lib/auth/require-role";
import { getCommunicationCounts, getConversations, getStudentAnnouncements, getStudentCommunicationClasses } from "@/lib/data/phase6";

export const metadata: Metadata = { title: "ประกาศและข้อความ" };

export default async function StudentCommunicationPage() {
  const user = await requireRole("student");
  const [announcements, conversations, classes, counts] = await Promise.all([
    getStudentAnnouncements(user.id), getConversations(user.id), getStudentCommunicationClasses(user.id), getCommunicationCounts(user.id, user.profile.role),
  ]);
  const options = classes.map((row) => ({ value: `${row.id}|${user.id}`, label: `${row.class_code} · ${row.subject_name}`, group: "รายวิชาของฉัน" }));
  return (
    <DashboardShell user={user} title="ประกาศและข้อความ" description="ติดตามประกาศจากครู อ่านข้อมูลสำคัญ และส่งข้อความสอบถามครูผู้สอนในแต่ละรายวิชา">
      <div className="phase6-metric-grid student">
        <Metric icon={<BellRing />} label="แจ้งเตือนที่ยังไม่อ่าน" value={counts.totalUnread} />
        <Metric icon={<Megaphone />} label="ประกาศใหม่" value={counts.unreadAnnouncements} />
        <Metric icon={<MessageCircleMore />} label="ข้อความใหม่" value={counts.unreadMessages} />
      </div>
      <div className="phase6-student-layout">
        <section className="phase2-section-card phase6-student-main"><div className="phase2-section-heading"><div><span className="phase-panel-kicker">ANNOUNCEMENTS</span><h2>ประกาศจากครู</h2><p>เรียงประกาศปักหมุดและประกาศล่าสุด</p></div></div><AnnouncementList announcements={announcements} role="student" /></section>
        <aside className="phase6-student-side"><section className="phase2-section-card"><ConversationStartForm options={options} role="student" /></section><section className="phase2-section-card"><div className="phase2-section-heading compact"><div><span className="phase-panel-kicker">MESSAGES</span><h2>ข้อความล่าสุด</h2></div><Link href="/student/communication/messages" className="phase2-secondary-button">ทั้งหมด <ArrowRight size={15} /></Link></div><ConversationList conversations={conversations} role="student" limit={5} /></section></aside>
      </div>
    </DashboardShell>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <article className="phase2-metric-card"><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></article>; }
