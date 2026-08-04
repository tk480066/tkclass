"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, Save } from "lucide-react";
import { saveQuizAction, type Phase4ActionState } from "@/app/phase4-actions";
import { Phase4ActionFeedback } from "@/components/phase4/action-feedback";
import type { ClassRow, LessonRow, QuizRow } from "@/lib/types";

const initialState: Phase4ActionState = {};

function localDateTime(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

export function QuizForm({ classRow, quiz, lessons = [] }: { classRow: ClassRow; quiz?: QuizRow | null; lessons?: LessonRow[] }) {
  const [state, action, pending] = useActionState(saveQuizAction, initialState);
  return (
    <form action={action} className="phase4-form">
      <input type="hidden" name="id" value={quiz?.id ?? ""} />
      <input type="hidden" name="classId" value={classRow.id} />
      <Phase4ActionFeedback state={state} />
      {!quiz && state.quizId && (
        <Link href={`/teacher/quizzes/${state.quizId}`} className="phase4-created-quiz-link">
          เพิ่มคำถามและจัดการแบบทดสอบ <ArrowRight size={17} />
        </Link>
      )}

      <div className="phase4-form-grid two">
        <label className="field-label full"><span>ชื่อแบบทดสอบ</span><input className="field-control" name="title" required minLength={3} defaultValue={quiz?.title ?? ""} placeholder="เช่น แบบทดสอบท้ายหน่วยที่ 1" /></label>
        <label className="field-label full"><span>คำชี้แจง</span><textarea className="field-control phase4-textarea" name="instructions" defaultValue={quiz?.instructions ?? ""} placeholder="อธิบายเงื่อนไขและวิธีทำแบบทดสอบ" /></label>
        <label className="field-label"><span>เชื่อมกับบทเรียน (ไม่บังคับ)</span><select className="field-control" name="lessonId" defaultValue={quiz?.lesson_id ?? ""}><option value="">ไม่เชื่อมบทเรียน</option>{lessons.map((lesson) => <option value={lesson.id} key={lesson.id}>{lesson.title}</option>)}</select></label>
        <label className="field-label"><span>สถานะ</span><select className="field-control" name="status" defaultValue={quiz?.status ?? "draft"}><option value="draft">ฉบับร่าง</option><option value="published">เผยแพร่และเปิดทำ</option><option value="closed">ปิดแบบทดสอบ</option></select></label>
        <label className="field-label"><span>วันเวลาเปิด</span><input className="field-control" type="datetime-local" name="openAt" defaultValue={localDateTime(quiz?.open_at)} /></label>
        <label className="field-label"><span>วันเวลาปิด</span><input className="field-control" type="datetime-local" name="closeAt" defaultValue={localDateTime(quiz?.close_at)} /></label>
        <label className="field-label"><span>เวลาทำ (นาที)</span><input className="field-control" type="number" name="timeLimitMinutes" min={1} max={600} defaultValue={quiz?.time_limit_minutes ?? ""} placeholder="ไม่จำกัดเวลา" /></label>
        <label className="field-label"><span>จำนวนครั้งที่ทำได้</span><input className="field-control" type="number" name="maxAttempts" min={1} max={20} defaultValue={quiz?.max_attempts ?? 1} required /></label>
        <label className="field-label"><span>เกณฑ์ผ่าน (%)</span><input className="field-control" type="number" name="passingPercent" min={0} max={100} step="0.01" defaultValue={quiz?.passing_percent ?? 50} required /></label>
      </div>

      <div className="phase4-settings-grid">
        <label><input type="checkbox" name="shuffleQuestions" defaultChecked={quiz?.shuffle_questions ?? true} /> <span><strong>สุ่มลำดับคำถาม</strong><small>นักเรียนแต่ละคนอาจได้รับลำดับต่างกัน</small></span></label>
        <label><input type="checkbox" name="shuffleOptions" defaultChecked={quiz?.shuffle_options ?? true} /> <span><strong>สุ่มตัวเลือก</strong><small>ลดการมองคำตอบจากเพื่อน</small></span></label>
        <label><input type="checkbox" name="showScoreAfterSubmit" defaultChecked={quiz?.show_score_after_submit ?? true} /> <span><strong>แสดงคะแนนหลังส่ง</strong><small>ซ่อนคะแนนได้จนกว่าครูจะตรวจ</small></span></label>
        <label><input type="checkbox" name="showCorrectAnswers" defaultChecked={quiz?.show_correct_answers ?? false} /> <span><strong>แสดงคำตอบที่ถูก</strong><small>เหมาะสำหรับการทบทวนหลังจบแบบทดสอบ</small></span></label>
      </div>

      <button className="phase2-primary-button phase4-submit-button" type="submit" disabled={pending}><Save size={17} /> {pending ? "กำลังบันทึก..." : quiz ? "บันทึกการแก้ไข" : "สร้างแบบทดสอบ"}</button>
    </form>
  );
}
