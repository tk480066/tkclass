"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { saveCustomGradeScoresAction, type Phase5ActionState } from "@/app/phase5-actions";
import { Phase5ActionFeedback } from "@/components/phase5/action-feedback";
import type { GradebookItem, GradebookStudentRow, GradeEntryRow } from "@/lib/types";

const initialState: Phase5ActionState = {};

export function GradebookGrid({ classId, items, students, entries }: { classId: string; items: GradebookItem[]; students: GradebookStudentRow[]; entries: GradeEntryRow[] }) {
  const [state, action, pending] = useActionState(saveCustomGradeScoresAction, initialState);
  const entryMap = new Map(entries.map((entry) => [`${entry.grade_item_id}:${entry.student_id}`, entry]));
  const customItems = items.filter((item) => item.source_type === "custom");
  return (
    <form action={action} className="phase5-gradebook-form">
      <input type="hidden" name="classId" value={classId} />
      <div className="phase5-gradebook-toolbar">
        <div><strong>ตารางสมุดคะแนน</strong><small>คะแนนงานและแบบทดสอบดึงจากระบบอัตโนมัติ ส่วนคะแนนเพิ่มเติมแก้ไขได้ในตาราง</small></div>
        <button className="phase2-primary-button" type="submit" disabled={pending || !customItems.length}><Save size={17} /> {pending ? "กำลังบันทึก..." : "บันทึกคะแนนเพิ่มเติม"}</button>
      </div>
      <Phase5ActionFeedback state={state} />
      <div className="phase5-table-wrap wide">
        <table className="phase5-gradebook-table">
          <thead>
            <tr><th className="sticky-col">นักเรียน</th><th>เวลาเรียน</th>{items.map((item) => <th key={item.id}><span>{item.category_name}</span><strong>{item.title}</strong><small>{item.max_score} คะแนน</small></th>)}<th>คะแนนรวม</th><th>ระดับ</th></tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.student_id}>
                <td className="sticky-col"><small>{student.student_number ?? "-"} · {student.student_code}</small><strong>{student.student_name}</strong></td>
                <td><span className={student.attendance_percent !== null && student.attendance_percent < 80 ? "phase5-score-low" : ""}>{student.attendance_percent === null ? "-" : `${student.attendance_percent}%`}</span></td>
                {items.map((item) => {
                  const score = student.scores[item.id];
                  const entry = entryMap.get(`${item.id}:${student.student_id}`);
                  return (
                    <td key={item.id}>
                      {item.source_type === "custom" ? (
                        <div className="phase5-score-editor">
                          <input name={`score_${item.id}_${student.student_id}`} type="number" min="0" max={item.max_score} step="0.01" defaultValue={score ?? ""} placeholder="-" />
                          <label title="ยกเว้นคะแนน"><input name={`excused_${item.id}_${student.student_id}`} type="checkbox" defaultChecked={entry?.is_excused ?? false} /><span>ยกเว้น</span></label>
                          <input name={`feedback_${item.id}_${student.student_id}`} defaultValue={entry?.feedback ?? ""} placeholder="ความเห็น" />
                        </div>
                      ) : <strong>{score === null ? "-" : score}</strong>}
                    </td>
                  );
                })}
                <td><strong>{student.total_percent === null ? "-" : `${student.total_percent}%`}</strong></td>
                <td><span className="phase5-grade-pill">{student.letter_grade ?? "-"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </form>
  );
}
