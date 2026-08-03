"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { Blocks, Save } from "lucide-react";
import { saveLessonBlockAction, type Phase2ActionState } from "@/app/phase2-actions";
import { ActionFeedback } from "@/components/phase2/action-feedback";
import { CourseFileUpload } from "@/components/phase2/course-file-upload";
import type { LessonBlockRow, LessonBlockType } from "@/lib/types";

const initialState: Phase2ActionState = {};

export function LessonBlockForm({
  teacherId,
  classId,
  lessonId,
  block,
}: {
  teacherId: string;
  classId: string;
  lessonId: string;
  block?: LessonBlockRow;
}) {
  const [state, action, pending] = useActionState(saveLessonBlockAction, initialState);
  const [type, setType] = useState<LessonBlockType>(block?.block_type ?? "text");
  const metadata = block?.metadata ?? {};
  return (
    <form action={action} className="phase2-form compact-phase2-form block-form">
      <input type="hidden" name="id" value={block?.id ?? ""} />
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="lessonId" value={lessonId} />
      <div className="phase2-form-heading">
        <span><Blocks size={19} /></span>
        <div><strong>{block ? "แก้ไขบล็อกเนื้อหา" : "เพิ่มบล็อกเนื้อหา"}</strong><small>ข้อความ รูปภาพ วิดีโอ เอกสาร ลิงก์ หรือกิจกรรม</small></div>
      </div>
      <label>
        <span>ประเภทเนื้อหา</span>
        <select name="blockType" value={type} onChange={(event: ChangeEvent<HTMLSelectElement>) => setType(event.target.value as LessonBlockType)}>
          <option value="text">ข้อความ</option>
          <option value="image">รูปภาพ</option>
          <option value="video">วิดีโอ</option>
          <option value="file">เอกสาร/ไฟล์</option>
          <option value="link">ลิงก์ประกอบ</option>
          <option value="activity">กิจกรรมระหว่างบท</option>
        </select>
      </label>
      <label><span>หัวข้อ</span><input name="title" defaultValue={block?.title ?? ""} /></label>
      {(type === "text" || type === "activity") && (
        <label><span>{type === "activity" ? "คำอธิบายเพิ่มเติม" : "เนื้อหา"}</span><textarea name="body" rows={6} defaultValue={block?.body ?? ""} /></label>
      )}
      {(type === "image" || type === "video" || type === "file") && (
        <CourseFileUpload teacherId={teacherId} classId={classId} defaultPath={block?.storage_path ?? ""} label={`อัปโหลด${type === "image" ? "รูปภาพ" : type === "video" ? "วิดีโอ" : "เอกสาร"}`} />
      )}
      {(type === "image" || type === "video" || type === "file" || type === "link") && (
        <label><span>หรือลิงก์ภายนอก</span><input name="externalUrl" type="url" defaultValue={block?.external_url ?? ""} placeholder="https://..." /></label>
      )}
      {type === "activity" && (
        <>
          <label><span>คำถาม *</span><textarea name="question" rows={3} defaultValue={String(metadata.question ?? block?.title ?? "")} /></label>
          <label><span>รูปแบบคำตอบ</span><select name="responseType" defaultValue={String(metadata.responseType ?? "long_text")}><option value="text">คำตอบสั้น</option><option value="long_text">คำตอบแบบอธิบาย</option></select></label>
        </>
      )}
      {type !== "activity" && <input type="hidden" name="question" value="" />}
      <div className="phase2-inline-fields">
        <label><span>ลำดับ</span><input name="orderNo" type="number" min="1" defaultValue={block?.order_no ?? 1} /></label>
        <label className="phase2-check-label"><input name="isRequired" type="checkbox" defaultChecked={block?.is_required ?? true} /><span>เป็นเนื้อหาที่จำเป็น</span></label>
      </div>
      <ActionFeedback state={state} />
      <button type="submit" className="phase2-primary-button" disabled={pending}><Save size={17} /> {pending ? "กำลังบันทึก..." : "บันทึกบล็อก"}</button>
    </form>
  );
}
