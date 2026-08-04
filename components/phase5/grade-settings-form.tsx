"use client";

import { useActionState } from "react";
import { Settings2, Save } from "lucide-react";
import { saveGradeSettingsAction, type Phase5ActionState } from "@/app/phase5-actions";
import { Phase5ActionFeedback } from "@/components/phase5/action-feedback";
import type { GradeSettingsRow } from "@/lib/types";

const initialState: Phase5ActionState = {};

export function GradeSettingsForm({ classId, settings }: { classId: string; settings: GradeSettingsRow }) {
  const [state, action, pending] = useActionState(saveGradeSettingsAction, initialState);
  return (
    <form action={action} className="phase5-mini-form">
      <input type="hidden" name="classId" value={classId} />
      <div className="phase5-form-heading"><span><Settings2 size={18} /></span><div><strong>การคำนวณผลการเรียน</strong><small>กำหนดวิธีคำนวณและการเปิดเผยผลรวม</small></div></div>
      <div className="phase5-form-grid two-columns">
        <label><span>วิธีคำนวณ</span><select name="calculationMethod" defaultValue={settings.calculation_method}><option value="weighted_categories">ถ่วงน้ำหนักตามหมวด</option><option value="total_points">รวมคะแนนทั้งหมด</option></select></label>
        <label><span>เกณฑ์เวลาเรียนขั้นต่ำ</span><div className="phase5-input-suffix"><input name="minimumAttendancePercent" type="number" min="0" max="100" step="0.01" defaultValue={settings.minimum_attendance_percent} /><em>%</em></div></label>
      </div>
      <label className="phase5-checkbox-row"><input name="publishFinalGrade" type="checkbox" defaultChecked={settings.publish_final_grade} /><span>เผยแพร่คะแนนรวมและระดับผลการเรียนให้นักเรียน</span></label>
      <Phase5ActionFeedback state={state} />
      <button className="phase2-secondary-button" type="submit" disabled={pending}><Save size={16} /> {pending ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}</button>
    </form>
  );
}
