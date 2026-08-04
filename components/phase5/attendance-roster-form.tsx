"use client";

import { useActionState } from "react";
import { CheckCheck, Save } from "lucide-react";
import { saveAttendanceRosterAction, type Phase5ActionState } from "@/app/phase5-actions";
import { Phase5ActionFeedback } from "@/components/phase5/action-feedback";
import type { AttendanceRosterRow } from "@/lib/types";

const initialState: Phase5ActionState = {};

export function AttendanceRosterForm({ sessionId, roster }: { sessionId: string; roster: AttendanceRosterRow[] }) {
  const [state, action, pending] = useActionState(saveAttendanceRosterAction, initialState);
  return (
    <form action={action} className="phase5-roster-form">
      <input type="hidden" name="sessionId" value={sessionId} />
      <div className="phase5-roster-toolbar">
        <div><strong>รายชื่อนักเรียน {roster.length} คน</strong><small>เลือกสถานะและเพิ่มหมายเหตุรายคน</small></div>
        <div>
          <button className="phase2-secondary-button" type="submit" name="intent" value="all_present" disabled={pending}><CheckCheck size={17} /> มาเรียนทั้งหมด</button>
          <button className="phase2-primary-button" type="submit" name="intent" value="save" disabled={pending}><Save size={17} /> {pending ? "กำลังบันทึก..." : "บันทึกผล"}</button>
        </div>
      </div>
      <Phase5ActionFeedback state={state} />
      <div className="phase5-table-wrap">
        <table className="phase5-attendance-table">
          <thead><tr><th>เลขที่</th><th>รหัส</th><th>ชื่อ–นามสกุล</th><th>สถานะ</th><th>เวลาเช็กชื่อ</th><th>หมายเหตุ</th></tr></thead>
          <tbody>
            {roster.map((student) => (
              <tr key={student.user_id}>
                <td>{student.enrollment_number ?? "-"}</td>
                <td><code>{student.student_code}</code></td>
                <td><strong>{student.display_name}</strong>{student.nickname && <small> ({student.nickname})</small>}</td>
                <td>
                  <select name={`status_${student.user_id}`} defaultValue={student.record?.status ?? "unmarked"}>
                    <option value="unmarked">ยังไม่เช็ก</option><option value="present">มาเรียน</option><option value="late">มาสาย</option><option value="absent">ขาดเรียน</option><option value="leave">ลากิจ</option><option value="sick">ลาป่วย</option><option value="activity">ร่วมกิจกรรม</option>
                  </select>
                </td>
                <td>{student.record?.checked_in_at ? new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit" }).format(new Date(student.record.checked_in_at)) : "-"}</td>
                <td><input name={`note_${student.user_id}`} placeholder="หมายเหตุ" defaultValue={student.record?.note ?? ""} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </form>
  );
}
