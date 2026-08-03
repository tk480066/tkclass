import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpenCheck, ChevronRight, Clock3, Layers3, Trash2 } from "lucide-react";
import { deleteLessonAction, deleteUnitAction } from "@/app/phase2-actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { LessonForm } from "@/components/phase2/lesson-form";
import { UnitForm } from "@/components/phase2/unit-form";
import { getClassCurriculum, getTeacherClass } from "@/lib/data/phase2";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "หน่วยและบทเรียน" };

export default async function ClassCurriculumPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const user = await requireRole("teacher");
  const [classRow, curriculum] = await Promise.all([
    getTeacherClass(user.id, classId),
    getClassCurriculum(user.id, classId),
  ]);

  return (
    <DashboardShell user={user} title="หน่วยการเรียนรู้และบทเรียน" description={`${classRow.subject_name} · ${classRow.class_name} · จัดลำดับและเผยแพร่เนื้อหาให้ผู้เรียน`}>
      <Link href={`/teacher/classes/${classId}`} className="phase2-back-link"><ArrowLeft size={16} /> กลับหน้าชั้นเรียน</Link>
      <div className="curriculum-layout">
        <aside className="curriculum-sidebar">
          <section className="phase2-section-card sticky-form-card"><UnitForm classId={classId} /></section>
        </aside>
        <section className="curriculum-content">
          {curriculum.map((unit) => (
            <article className="unit-card" key={unit.id}>
              <header className="unit-card-header">
                <div className="unit-order-badge">{unit.order_no}</div>
                <div className="unit-card-title"><span className={`status-badge ${unit.status}`}>{statusText(unit.status)}</span><h2>{unit.title}</h2><p>{unit.description || "ยังไม่มีคำอธิบายหน่วย"}</p></div>
                <form action={deleteUnitAction}><input type="hidden" name="classId" value={classId} /><input type="hidden" name="unitId" value={unit.id} /><button className="icon-danger-button" type="submit" aria-label="ลบหน่วย"><Trash2 size={17} /></button></form>
              </header>
              <div className="unit-objectives"><strong>จุดประสงค์การเรียนรู้</strong><p>{unit.objectives || "ยังไม่ได้กำหนด"}</p></div>
              <div className="lesson-list">
                {unit.lessons.map((lesson) => (
                  <div className="lesson-list-row" key={lesson.id}>
                    <span className="lesson-list-icon"><BookOpenCheck size={18} /></span>
                    <div className="lesson-list-main"><small>บทที่ {lesson.order_no}</small><strong>{lesson.title}</strong><span><Clock3 size={14} /> {lesson.estimated_minutes} นาที · <em className={`status-text ${lesson.status}`}>{statusText(lesson.status)}</em></span></div>
                    <Link href={`/teacher/lessons/${lesson.id}`} className="lesson-edit-link">แก้ไขเนื้อหา <ChevronRight size={17} /></Link>
                    <form action={deleteLessonAction}><input type="hidden" name="classId" value={classId} /><input type="hidden" name="lessonId" value={lesson.id} /><button className="icon-danger-button" type="submit" aria-label="ลบบทเรียน"><Trash2 size={16} /></button></form>
                  </div>
                ))}
                {!unit.lessons.length && <div className="phase2-empty-state small"><BookOpenCheck size={26} /><p>ยังไม่มีบทเรียนในหน่วยนี้</p></div>}
              </div>
              <details className="lesson-create-details">
                <summary><BookOpenCheck size={17} /> เพิ่มบทเรียนในหน่วยนี้</summary>
                <div className="details-form-wrap"><LessonForm classId={classId} unitId={unit.id} teacherId={user.id} /></div>
              </details>
            </article>
          ))}
          {!curriculum.length && <div className="phase2-section-card phase2-empty-state"><Layers3 size={38} /><h3>ยังไม่มีหน่วยการเรียนรู้</h3><p>ใช้แบบฟอร์มด้านซ้ายเพื่อสร้างหน่วยแรก</p></div>}
        </section>
      </div>
    </DashboardShell>
  );
}

function statusText(status: string) {
  if (status === "published") return "เผยแพร่";
  if (status === "archived") return "เก็บถาวร";
  return "ฉบับร่าง";
}
