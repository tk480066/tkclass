import type { Metadata } from "next";
import Link from "next/link";
import { Archive, ArrowRight, BookOpenCheck, ClipboardList, FileQuestion, Layers3, UsersRound } from "lucide-react";
import { archiveClassAction } from "@/app/phase2-actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { ClassForm } from "@/components/phase2/class-form";
import { getClassCurriculum, getClassRoster, getTeacherClass } from "@/lib/data/phase2";
import { getTeacherAssignments } from "@/lib/data/phase3";
import { getTeacherQuizzes } from "@/lib/data/phase4";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "รายละเอียดชั้นเรียน" };

export default async function TeacherClassPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const user = await requireRole("teacher");
  const [classRow, roster, curriculum, assignments, quizzes] = await Promise.all([
    getTeacherClass(user.id, classId),
    getClassRoster(user.id, classId),
    getClassCurriculum(user.id, classId),
    getTeacherAssignments(user.id, classId),
    getTeacherQuizzes(user.id, classId),
  ]);
  const lessonCount = curriculum.reduce((sum, unit) => sum + unit.lessons.length, 0);
  const pendingReviews = assignments.reduce((sum, row) => sum + row.pending_review_count, 0);

  return (
    <DashboardShell user={user} title={classRow.subject_name} description={`${classRow.class_name} · ${classRow.class_code} · ภาคเรียนที่ ${classRow.semester ?? "-"}/${classRow.academic_year ?? "-"}`}>
      <div className="class-overview-grid phase3-class-overview-grid">
        <Link href={`/teacher/classes/${classId}/students`} className="class-overview-card"><span><UsersRound /></span><strong>{roster.length}</strong><small>นักเรียน</small><em>จัดการรายชื่อ <ArrowRight size={15} /></em></Link>
        <Link href={`/teacher/classes/${classId}/curriculum`} className="class-overview-card"><span><Layers3 /></span><strong>{curriculum.length}</strong><small>หน่วยการเรียนรู้</small><em>จัดการหลักสูตร <ArrowRight size={15} /></em></Link>
        <Link href={`/teacher/classes/${classId}/curriculum`} className="class-overview-card"><span><BookOpenCheck /></span><strong>{lessonCount}</strong><small>บทเรียน</small><em>เปิดตัวแก้ไข <ArrowRight size={15} /></em></Link>
        <Link href={`/teacher/classes/${classId}/assignments`} className="class-overview-card"><span><ClipboardList /></span><strong>{assignments.length}</strong><small>งาน · รอตรวจ {pendingReviews}</small><em>จัดการงาน <ArrowRight size={15} /></em></Link>
        <Link href={`/teacher/classes/${classId}/quizzes`} className="class-overview-card"><span><FileQuestion /></span><strong>{quizzes.length}</strong><small>แบบทดสอบ</small><em>จัดการแบบทดสอบ <ArrowRight size={15} /></em></Link>
      </div>

      <div className="phase2-two-column-layout class-detail-layout">
        <section className="phase2-section-card">
          <div className="phase2-section-heading compact"><div><span className="phase-panel-kicker">CLASS SETTINGS</span><h2>แก้ไขข้อมูลชั้นเรียน</h2></div></div>
          <ClassForm classRow={classRow} />
        </section>
        <section className="phase2-section-card class-summary-panel">
          <span className="phase-panel-kicker">QUICK ACTIONS</span><h2>เครื่องมือชั้นเรียน</h2>
          <div className="quick-action-list">
            <Link href={`/teacher/classes/${classId}/students`}><UsersRound size={19} /><div><strong>จัดการนักเรียน</strong><small>เพิ่ม นำเข้า และถอนรายชื่อ</small></div><ArrowRight size={17} /></Link>
            <Link href={`/teacher/classes/${classId}/curriculum`}><Layers3 size={19} /><div><strong>หน่วยและบทเรียน</strong><small>สร้างหลักสูตรและเนื้อหา</small></div><ArrowRight size={17} /></Link>
            <Link href={`/teacher/classes/${classId}/assignments`}><ClipboardList size={19} /><div><strong>งานและการส่งงาน</strong><small>สร้างงาน ตรวจผลงาน และให้คะแนน</small></div><ArrowRight size={17} /></Link>
            <Link href={`/teacher/classes/${classId}/quizzes`}><FileQuestion size={19} /><div><strong>แบบทดสอบ</strong><small>สร้างคำถาม เปิดสอบ และดูผลคะแนน</small></div><ArrowRight size={17} /></Link>
            {classRow.online_meeting_url && <a href={classRow.online_meeting_url} target="_blank" rel="noreferrer"><BookOpenCheck size={19} /><div><strong>ห้องเรียนออนไลน์</strong><small>เปิดลิงก์ที่กำหนด</small></div><ArrowRight size={17} /></a>}
          </div>
          <form action={archiveClassAction} className="archive-class-form"><input type="hidden" name="classId" value={classId} /><button type="submit"><Archive size={17} /> เก็บชั้นเรียนเข้าคลัง</button></form>
        </section>
      </div>
    </DashboardShell>
  );
}
