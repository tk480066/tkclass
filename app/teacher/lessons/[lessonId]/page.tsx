import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Link2,
  PlaySquare,
  Text,
  Trash2,
} from "lucide-react";
import { deleteLessonBlockAction } from "@/app/phase2-actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { LessonBlockForm } from "@/components/phase2/lesson-block-form";
import { LessonForm } from "@/components/phase2/lesson-form";
import { getTeacherLessonEditor } from "@/lib/data/phase2";
import { requireRole } from "@/lib/auth/require-role";
import type { LessonBlockRow } from "@/lib/types";

export const metadata: Metadata = { title: "แก้ไขบทเรียน" };

export default async function TeacherLessonEditorPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const user = await requireRole("teacher");
  const data = await getTeacherLessonEditor(user.id, lessonId);

  return (
    <DashboardShell user={user} title={data.lesson.title} description={`${data.classRow.subject_name} · ${data.unit.title} · สร้างเนื้อหาแบบหลายบล็อก`}>
      <Link href={`/teacher/classes/${data.classRow.id}/curriculum`} className="phase2-back-link"><ArrowLeft size={16} /> กลับไปหลักสูตร</Link>
      <div className="lesson-editor-layout">
        <aside className="lesson-editor-sidebar">
          <section className="phase2-section-card sticky-form-card"><LessonForm classId={data.classRow.id} unitId={data.unit.id} teacherId={user.id} lesson={data.lesson} showCoverUpload /></section>
        </aside>
        <section className="lesson-editor-content">
          <section className="phase2-section-card">
            <div className="phase2-section-heading compact"><div><span className="phase-panel-kicker">LESSON BLOCKS</span><h2>เนื้อหาในบทเรียน</h2><p>{data.blocks.length} บล็อก เรียงตามลำดับที่กำหนด</p></div></div>
            <div className="lesson-block-list">
              {data.blocks.map((block) => <TeacherBlockCard block={block} classId={data.classRow.id} lessonId={lessonId} key={block.id} />)}
              {!data.blocks.length && <div className="phase2-empty-state small"><Text size={28} /><p>ยังไม่มีเนื้อหาในบทเรียน</p></div>}
            </div>
          </section>
          <section className="phase2-section-card"><LessonBlockForm teacherId={user.id} classId={data.classRow.id} lessonId={lessonId} /></section>
        </section>
      </div>
    </DashboardShell>
  );
}

function TeacherBlockCard({ block, classId, lessonId }: { block: LessonBlockRow; classId: string; lessonId: string }) {
  const meta = block.metadata ?? {};
  return (
    <article className="teacher-block-card">
      <span className="teacher-block-icon">{blockIcon(block.block_type)}</span>
      <div className="teacher-block-main">
        <div className="teacher-block-meta"><span>ลำดับ {block.order_no}</span><span>{blockTypeText(block.block_type)}</span>{block.is_required && <span>จำเป็น</span>}</div>
        <h3>{block.title || blockTypeText(block.block_type)}</h3>
        {block.body && <p>{block.body}</p>}
        {block.external_url && <a href={block.external_url} target="_blank" rel="noreferrer">{block.external_url}</a>}
        {block.storage_path && <code>{block.storage_path}</code>}
        {block.block_type === "activity" && <p><strong>คำถาม:</strong> {String(meta.question ?? "-")}</p>}
      </div>
      <form action={deleteLessonBlockAction}><input type="hidden" name="classId" value={classId} /><input type="hidden" name="lessonId" value={lessonId} /><input type="hidden" name="blockId" value={block.id} /><button className="icon-danger-button" type="submit" aria-label="ลบบล็อก"><Trash2 size={16} /></button></form>
    </article>
  );
}

function blockIcon(type: LessonBlockRow["block_type"]) {
  if (type === "image") return <ImageIcon size={19} />;
  if (type === "video") return <PlaySquare size={19} />;
  if (type === "file") return <FileText size={19} />;
  if (type === "link") return <Link2 size={19} />;
  if (type === "activity") return <Activity size={19} />;
  return <Text size={19} />;
}

function blockTypeText(type: LessonBlockRow["block_type"]) {
  return { text: "ข้อความ", image: "รูปภาพ", video: "วิดีโอ", file: "เอกสาร", link: "ลิงก์", activity: "กิจกรรม" }[type];
}
