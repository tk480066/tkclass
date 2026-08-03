"use client";

import { useActionState } from "react";
import { BookOpenCheck, Save } from "lucide-react";
import { saveLessonAction, type Phase2ActionState } from "@/app/phase2-actions";
import { ActionFeedback } from "@/components/phase2/action-feedback";
import { CourseFileUpload } from "@/components/phase2/course-file-upload";
import type { LessonRow } from "@/lib/types";

const initialState: Phase2ActionState = {};

export function LessonForm({
  classId,
  unitId,
  teacherId,
  lesson,
  showCoverUpload = false,
}: {
  classId: string;
  unitId: string;
  teacherId: string;
  lesson?: LessonRow;
  showCoverUpload?: boolean;
}) {
  const [state, action, pending] = useActionState(saveLessonAction, initialState);
  return (
    <form action={action} className="phase2-form compact-phase2-form">
      <input type="hidden" name="id" value={lesson?.id ?? ""} />
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="unitId" value={unitId} />
      <div className="phase2-form-heading">
        <span><BookOpenCheck size={19} /></span>
        <div><strong>{lesson ? "แก้ไขบทเรียน" : "เพิ่มบทเรียน"}</strong><small>สร้างรายละเอียดบทเรียนและกำหนดเวลาเผยแพร่</small></div>
      </div>
      <label><span>ชื่อบทเรียน *</span><input name="title" required defaultValue={lesson?.title ?? ""} /></label>
      <label><span>บทสรุป</span><textarea name="summary" rows={3} defaultValue={lesson?.summary ?? ""} /></label>
      <label><span>จุดประสงค์การเรียนรู้</span><textarea name="objectives" rows={3} defaultValue={lesson?.objectives ?? ""} /></label>
      <div className="phase2-inline-fields">
        <label><span>ลำดับ</span><input name="orderNo" type="number" min="1" defaultValue={lesson?.order_no ?? 1} /></label>
        <label><span>เวลาโดยประมาณ (นาที)</span><input name="estimatedMinutes" type="number" min="1" max="600" defaultValue={lesson?.estimated_minutes ?? 20} /></label>
      </div>
      <div className="phase2-inline-fields">
        <label><span>สถานะ</span><select name="status" defaultValue={lesson?.status ?? "draft"}><option value="draft">ฉบับร่าง</option><option value="published">เผยแพร่</option><option value="archived">เก็บถาวร</option></select></label>
        <label><span>กำหนดเวลาเผยแพร่</span><input name="publishAt" type="datetime-local" defaultValue={lesson?.publish_at ? lesson.publish_at.slice(0, 16) : ""} /></label>
      </div>
      {showCoverUpload ? (
        <CourseFileUpload teacherId={teacherId} classId={classId} inputName="coverPath" defaultPath={lesson?.cover_path ?? ""} label="อัปโหลดภาพหน้าปกบทเรียน" />
      ) : <input type="hidden" name="coverPath" value={lesson?.cover_path ?? ""} />}
      <ActionFeedback state={state} />
      <button type="submit" className="phase2-primary-button" disabled={pending}><Save size={17} /> {pending ? "กำลังบันทึก..." : "บันทึกบทเรียน"}</button>
    </form>
  );
}
