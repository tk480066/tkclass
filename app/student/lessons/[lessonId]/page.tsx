import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link2,
  PlaySquare,
} from "lucide-react";
import { updateLessonProgressAction } from "@/app/phase2-actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { ActivityResponseForm } from "@/components/phase2/activity-response-form";
import { getStudentLesson } from "@/lib/data/phase2";
import { requireRole } from "@/lib/auth/require-role";
import type { LessonBlockRow, LessonResponseRow } from "@/lib/types";

export const metadata: Metadata = { title: "เรียนบทเรียน" };

export default async function StudentLessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const user = await requireRole("student");
  const data = await getStudentLesson(user.id, lessonId);
  const completed = data.progress?.status === "completed";
  const responseMap = new Map(data.responses.map((response) => [response.lesson_block_id, response]));

  return (
    <DashboardShell user={user} title={data.lesson.title} description={`${data.course.subject_name} · ${data.unit.title} · ใช้เวลาประมาณ ${data.lesson.estimated_minutes} นาที`}>
      <Link href={`/student/courses/${data.course.id}`} className="phase2-back-link"><ArrowLeft size={16} /> กลับรายวิชา</Link>
      <div className="student-lesson-layout">
        <article className="lesson-reader">
          <header className="lesson-reader-header">
            <span className="phase-panel-kicker">LESSON {data.lesson.order_no}</span>
            <h1>{data.lesson.title}</h1>
            <p>{data.lesson.summary || ""}</p>
            <div className="lesson-reader-meta"><span><Clock3 size={15} /> {data.lesson.estimated_minutes} นาที</span><span className={`status-badge ${completed ? "published" : "draft"}`}>{completed ? "เรียนจบแล้ว" : data.progress ? "กำลังเรียน" : "ยังไม่เริ่ม"}</span></div>
          </header>

          {data.lesson.objectives && <section className="lesson-objectives"><strong>จุดประสงค์การเรียนรู้</strong><p>{data.lesson.objectives}</p></section>}

          <div className="student-block-stack">
            {data.blocks.map((block) => <StudentBlock key={block.id} block={block} lessonId={lessonId} response={responseMap.get(block.id)} />)}
            {!data.blocks.length && <div className="phase2-empty-state"><FileText size={34} /><h3>ยังไม่มีเนื้อหาในบทเรียน</h3></div>}
          </div>
        </article>

        <aside className="lesson-progress-panel">
          <div className="lesson-progress-card sticky-form-card">
            <span className="lesson-progress-icon"><CheckCircle2 size={24} /></span>
            <h2>{completed ? "เรียนบทนี้จบแล้ว" : "ติดตามความก้าวหน้า"}</h2>
            <p>{completed ? "คุณสามารถกลับมาอ่านบทเรียนซ้ำได้ทุกเมื่อ" : "กดเริ่มเรียน หรือทำเครื่องหมายว่าเรียนจบเมื่ออ่านและทำกิจกรรมครบแล้ว"}</p>
            <div className="course-progress-row big"><div><i style={{ width: `${data.progress?.progress_percent ?? 0}%` }} /></div><strong>{data.progress?.progress_percent ?? 0}%</strong></div>
            {!completed && (
              <div className="lesson-progress-actions">
                {!data.progress && <form action={updateLessonProgressAction}><input type="hidden" name="lessonId" value={lessonId} /><input type="hidden" name="status" value="in_progress" /><button type="submit" className="phase2-secondary-button"><PlaySquare size={17} /> เริ่มเรียน</button></form>}
                <form action={updateLessonProgressAction}><input type="hidden" name="lessonId" value={lessonId} /><input type="hidden" name="status" value="completed" /><button type="submit" className="phase2-primary-button"><CheckCircle2 size={17} /> ทำเครื่องหมายว่าเรียนจบ</button></form>
              </div>
            )}
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}

function StudentBlock({ block, lessonId, response }: { block: LessonBlockRow; lessonId: string; response?: LessonResponseRow }) {
  if (block.block_type === "text") return <section className="student-content-block text-block"><BlockHeading block={block} /><p>{block.body}</p></section>;
  if (block.block_type === "image") return <section className="student-content-block media-block"><BlockHeading block={block} />{block.signed_url || block.external_url ? <img src={block.signed_url || block.external_url || ""} alt={block.title || "ภาพประกอบบทเรียน"} /> : <p>ไม่พบไฟล์รูปภาพ</p>}{block.body && <p>{block.body}</p>}</section>;
  if (block.block_type === "video") {
    const source = block.signed_url || block.external_url;
    const embed = source ? youtubeEmbed(source) : null;
    return <section className="student-content-block media-block"><BlockHeading block={block} />{embed ? <iframe src={embed} title={block.title || "วิดีโอบทเรียน"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : source ? <video src={source} controls /> : <p>ไม่พบไฟล์วิดีโอ</p>}{block.body && <p>{block.body}</p>}</section>;
  }
  if (block.block_type === "file") return <section className="student-content-block file-block"><span><FileText size={24} /></span><div><BlockHeading block={block} /><p>{block.body || "ดาวน์โหลดเอกสารประกอบบทเรียน"}</p></div>{block.signed_url || block.external_url ? <a href={block.signed_url || block.external_url || ""} target="_blank" rel="noreferrer"><Download size={16} /> ดาวน์โหลด</a> : null}</section>;
  if (block.block_type === "link") return <section className="student-content-block file-block"><span><Link2 size={24} /></span><div><BlockHeading block={block} /><p>{block.body || "เปิดลิงก์ประกอบการเรียน"}</p></div>{block.external_url && <a href={block.external_url} target="_blank" rel="noreferrer"><ExternalLink size={16} /> เปิดลิงก์</a>}</section>;
  const metadata = block.metadata ?? {};
  return <section className="student-content-block activity-block"><span className="activity-label"><Activity size={18} /> กิจกรรมระหว่างบท</span><h2>{String(metadata.question ?? block.title ?? "ตอบคำถาม")}</h2>{block.body && <p>{block.body}</p>}<ActivityResponseForm lessonId={lessonId} blockId={block.id} initialResponse={response?.response_text} longText={String(metadata.responseType ?? "long_text") === "long_text"} /></section>;
}

function BlockHeading({ block }: { block: LessonBlockRow }) {
  return block.title ? <h2>{block.title}</h2> : null;
}

function youtubeEmbed(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (parsed.pathname.startsWith("/embed/")) return url;
    }
  } catch {
    return null;
  }
  return null;
}
