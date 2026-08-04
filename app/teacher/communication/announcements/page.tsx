import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard-shell";
import { AnnouncementForm } from "@/components/phase6/announcement-form";
import { AnnouncementList } from "@/components/phase6/announcement-list";
import { requireRole } from "@/lib/auth/require-role";
import { getTeacherClassSummaries } from "@/lib/data/phase2";
import { getTeacherAnnouncements } from "@/lib/data/phase6";

export const metadata: Metadata = { title: "ประกาศ" };

export default async function TeacherAnnouncementsPage() {
  const user = await requireRole("teacher");
  const [classes, announcements] = await Promise.all([getTeacherClassSummaries(user.id), getTeacherAnnouncements(user.id)]);
  return (
    <DashboardShell user={user} title="ประกาศถึงนักเรียน" description="สร้างประกาศสำหรับแต่ละชั้นเรียน กำหนดเวลาเผยแพร่ ระดับความสำคัญ และเอกสารประกอบ">
      <div className="phase2-two-column-layout phase6-editor-layout">
        <section className="phase2-section-card"><AnnouncementForm classes={classes} /></section>
        <section className="phase2-section-card"><div className="phase2-section-heading"><div><span className="phase-panel-kicker">ALL ANNOUNCEMENTS</span><h2>ประกาศทั้งหมด</h2><p>{announcements.length} รายการจาก {classes.length} ชั้นเรียน</p></div></div><AnnouncementList announcements={announcements} role="teacher" /></section>
      </div>
    </DashboardShell>
  );
}
