import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BellRing, Megaphone, MessageCircleMore, UsersRound } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { AnnouncementList } from "@/components/phase6/announcement-list";
import { ConversationList } from "@/components/phase6/conversation-list";
import { requireRole } from "@/lib/auth/require-role";
import { getCommunicationCounts, getConversations, getTeacherAnnouncements, getTeacherCommunicationContacts } from "@/lib/data/phase6";

export const metadata: Metadata = { title: "การสื่อสาร" };

export default async function TeacherCommunicationPage() {
  const user = await requireRole("teacher");
  const [announcements, conversations, contacts, counts] = await Promise.all([
    getTeacherAnnouncements(user.id),
    getConversations(user.id),
    getTeacherCommunicationContacts(user.id),
    getCommunicationCounts(user.id, user.profile.role),
  ]);
  const contactCount = contacts.reduce((sum, group) => sum + group.students.length, 0);
  const published = announcements.filter((row) => row.status === "published").length;
  const draft = announcements.filter((row) => row.status === "draft").length;

  return (
    <DashboardShell user={user} title="การสื่อสารกับผู้เรียน" description="สร้างประกาศ ส่งข้อความ ติดตามการอ่าน และสื่อสารรายบุคคลกับนักเรียนในชั้นเรียนของคุณ">
      <div className="phase6-metric-grid">
        <Metric icon={<Megaphone />} label="ประกาศทั้งหมด" value={announcements.length} suffix={`เผยแพร่ ${published}`} />
        <Metric icon={<BellRing />} label="ประกาศฉบับร่าง" value={draft} suffix="รอตรวจสอบ" />
        <Metric icon={<MessageCircleMore />} label="การสนทนา" value={conversations.length} suffix={`ยังไม่อ่าน ${counts.unreadMessages}`} />
        <Metric icon={<UsersRound />} label="ผู้ติดต่อในชั้นเรียน" value={contactCount} suffix="นักเรียน" />
      </div>

      <div className="phase6-shortcuts">
        <Link href="/teacher/communication/announcements"><Megaphone size={25} /><div><span className="phase-panel-kicker">ANNOUNCEMENTS</span><strong>จัดการประกาศ</strong><p>สร้าง เผยแพร่ ปักหมุด และดูสถิติการอ่าน</p></div><ArrowRight size={18} /></Link>
        <Link href="/teacher/communication/messages"><MessageCircleMore size={25} /><div><span className="phase-panel-kicker">MESSAGES</span><strong>ข้อความและการสนทนา</strong><p>ติดต่อผู้เรียนรายบุคคลและแนบไฟล์ประกอบ</p></div><em>{counts.unreadMessages} ยังไม่อ่าน</em><ArrowRight size={18} /></Link>
      </div>

      <div className="phase2-two-column-layout phase6-overview-columns">
        <section className="phase2-section-card">
          <div className="phase2-section-heading"><div><span className="phase-panel-kicker">RECENT ANNOUNCEMENTS</span><h2>ประกาศล่าสุด</h2><p>แสดงประกาศจากทุกชั้นเรียน</p></div><Link href="/teacher/communication/announcements" className="phase2-secondary-button">ดูทั้งหมด <ArrowRight size={16} /></Link></div>
          <AnnouncementList announcements={announcements} role="teacher" limit={5} />
        </section>
        <section className="phase2-section-card">
          <div className="phase2-section-heading"><div><span className="phase-panel-kicker">RECENT MESSAGES</span><h2>การสนทนาล่าสุด</h2><p>ติดตามคำถามและข้อความจากนักเรียน</p></div><Link href="/teacher/communication/messages" className="phase2-secondary-button">ดูทั้งหมด <ArrowRight size={16} /></Link></div>
          <ConversationList conversations={conversations} role="teacher" limit={5} />
        </section>
      </div>
    </DashboardShell>
  );
}

function Metric({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: number; suffix: string }) {
  return <article className="phase2-metric-card"><span>{icon}</span><div><strong>{value}</strong><small>{label}</small><em>{suffix}</em></div></article>;
}
