"use client";

import { useActionState, useMemo, useState, type ChangeEvent } from "react";
import { ClipboardPlus, Save } from "lucide-react";
import { saveAssignmentAction, type Phase3ActionState } from "@/app/phase3-actions";
import { Phase3ActionFeedback } from "@/components/phase3/action-feedback";
import type { AssignmentRow, AssignmentTargetRow, ClassRow, RosterStudent } from "@/lib/types";

const initialState: Phase3ActionState = {};

export function AssignmentForm({
  classRow,
  roster,
  assignment,
  targets = [],
}: {
  classRow: ClassRow;
  roster: RosterStudent[];
  assignment?: AssignmentRow;
  targets?: AssignmentTargetRow[];
}) {
  const [state, action, pending] = useActionState(saveAssignmentAction, initialState);
  const [targetMode, setTargetMode] = useState(assignment?.target_mode ?? "class");
  const [workType, setWorkType] = useState(assignment?.work_type ?? "individual");
  const groups = useMemo(() => [...new Set(roster.map((row) => row.group_name).filter((row): row is string => Boolean(row)))], [roster]);
  const selectedStudents = new Set(targets.map((row) => row.student_id).filter(Boolean));
  const allowed = new Set(assignment?.allowed_submission_types ?? ["text", "file", "link"]);

  return (
    <form action={action} className="phase2-form phase3-assignment-form">
      <input type="hidden" name="id" value={assignment?.id ?? ""} />
      <input type="hidden" name="classId" value={classRow.id} />
      <div className="phase2-form-heading">
        <span><ClipboardPlus size={19} /></span>
        <div>
          <strong>{assignment ? "แก้ไขงานที่มอบหมาย" : "สร้างงานใหม่"}</strong>
          <small>{classRow.subject_name} · {classRow.class_name}</small>
        </div>
      </div>

      <label><span>ชื่องาน *</span><input name="title" required defaultValue={assignment?.title ?? ""} placeholder="เช่น ใบงาน Flowchart" /></label>
      <label><span>คำสั่งและรายละเอียด</span><textarea name="instructions" rows={6} defaultValue={assignment?.instructions ?? ""} placeholder="อธิบายขั้นตอน เงื่อนไข และสิ่งที่นักเรียนต้องส่ง" /></label>

      <div className="phase2-inline-fields">
        <label><span>รูปแบบงาน</span><select name="workType" value={workType} onChange={(event: ChangeEvent<HTMLSelectElement>) => setWorkType(event.target.value as "individual" | "group")}><option value="individual">งานเดี่ยว</option><option value="group">งานกลุ่ม</option></select></label>
        <label><span>คะแนนเต็ม</span><input name="maxScore" type="number" min="0.01" step="0.01" defaultValue={assignment?.max_score ?? 10} /></label>
      </div>
      <div className="phase2-inline-fields">
        <label><span>คะแนนผ่าน</span><input name="passingScore" type="number" min="0" step="0.01" defaultValue={assignment?.passing_score ?? ""} placeholder="เว้นว่างได้" /></label>
        <label><span>สถานะ</span><select name="status" defaultValue={assignment?.status ?? "draft"}><option value="draft">ฉบับร่าง</option><option value="published">เผยแพร่</option><option value="closed">ปิดรับงาน</option><option value="archived">เก็บถาวร</option></select></label>
      </div>
      <div className="phase2-inline-fields">
        <label><span>วันและเวลาเผยแพร่</span><input name="publishAt" type="datetime-local" defaultValue={assignment?.publish_at?.slice(0,16) ?? ""} /></label>
        <label><span>กำหนดส่ง</span><input name="dueAt" type="datetime-local" defaultValue={assignment?.due_at?.slice(0,16) ?? ""} /></label>
      </div>

      <div className="phase3-checkbox-row">
        <label><input name="allowLate" type="checkbox" defaultChecked={assignment?.allow_late ?? true} /> อนุญาตให้ส่งล่าช้า</label>
        <label><input name="allowResubmit" type="checkbox" defaultChecked={assignment?.allow_resubmit ?? true} /> อนุญาตให้ยกเลิกและส่งใหม่</label>
      </div>

      <fieldset className="phase3-fieldset">
        <legend>รูปแบบการส่งงาน</legend>
        <div className="phase3-checkbox-grid">
          <label><input type="checkbox" name="submission_text" defaultChecked={allowed.has("text")} /> พิมพ์ข้อความ</label>
          <label><input type="checkbox" name="submission_file" defaultChecked={allowed.has("file")} /> เอกสาร</label>
          <label><input type="checkbox" name="submission_image" defaultChecked={allowed.has("image")} /> รูปภาพ</label>
          <label><input type="checkbox" name="submission_video" defaultChecked={allowed.has("video")} /> วิดีโอ</label>
          <label><input type="checkbox" name="submission_link" defaultChecked={allowed.has("link")} /> แนบลิงก์</label>
        </div>
      </fieldset>

      <fieldset className="phase3-fieldset">
        <legend>ผู้ได้รับมอบหมาย</legend>
        <div className="phase3-target-tabs">
          <label><input type="radio" name="targetMode" value="class" checked={targetMode === "class"} onChange={() => setTargetMode("class")} /> นักเรียนทั้งห้อง</label>
          <label><input type="radio" name="targetMode" value="students" checked={targetMode === "students"} onChange={() => setTargetMode("students")} /> เลือกรายบุคคล</label>
          <label><input type="radio" name="targetMode" value="group" checked={targetMode === "group"} onChange={() => setTargetMode("group")} /> เลือกกลุ่ม</label>
        </div>
        {targetMode === "students" && (
          <div className="phase3-roster-picker">
            {roster.map((student) => (
              <label key={student.user_id}>
                <input name="targetStudentIds" type="checkbox" value={student.user_id} defaultChecked={selectedStudents.has(student.user_id)} />
                <span><strong>{student.student_code} · {student.display_name}</strong><small>เลขที่ {student.enrollment_number ?? "-"} · {student.group_name || "ยังไม่มีกลุ่ม"}</small></span>
              </label>
            ))}
            {!roster.length && <p>ยังไม่มีนักเรียนในชั้นเรียน</p>}
          </div>
        )}
        {targetMode === "group" && (
          <label className="phase3-group-select"><span>กลุ่มที่ได้รับงาน</span><select name="targetGroupName" defaultValue={assignment?.target_group_name ?? ""} required><option value="">เลือกกลุ่ม</option>{groups.map((group) => <option value={group} key={group}>{group}</option>)}</select>{!groups.length && <small>กรุณากำหนดกลุ่มนักเรียนในหน้ารายชื่อก่อน</small>}</label>
        )}
      </fieldset>

      <Phase3ActionFeedback state={state} />
      <button type="submit" className="phase2-primary-button" disabled={pending}><Save size={17} /> {pending ? "กำลังบันทึก..." : assignment ? "บันทึกการแก้ไข" : "สร้างงาน"}</button>
    </form>
  );
}
