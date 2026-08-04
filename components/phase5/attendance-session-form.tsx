"use client";

import { useActionState } from "react";
import { CalendarCheck2, Save } from "lucide-react";
import { saveAttendanceSessionAction, type Phase5ActionState } from "@/app/phase5-actions";
import { Phase5ActionFeedback } from "@/components/phase5/action-feedback";
import type { AttendanceSessionRow } from "@/lib/types";

const initialState: Phase5ActionState = {};

function localDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function AttendanceSessionForm({ classId, session }: { classId: string; session?: AttendanceSessionRow | null }) {
  const [state, action, pending] = useActionState(saveAttendanceSessionAction, initialState);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={action} className="phase5-form-card">
      <input type="hidden" name="id" value={session?.id ?? ""} />
      <input type="hidden" name="classId" value={classId} />
      <div className="phase5-form-heading">
        <span><CalendarCheck2 size={20} /></span>
        <div><strong>{session ? "แก้ไขคาบเช็กชื่อ" : "สร้างคาบเช็กชื่อ"}</strong><small>กำหนดวัน เวลา และรูปแบบการเช็กชื่อ</small></div>
      </div>
      <div className="phase5-form-grid two-columns">
        <label><span>ชื่อคาบ</span><input name="title" required defaultValue={session?.title ?? "เช็กชื่อเข้าเรียน"} /></label>
        <label><span>วันที่</span><input name="sessionDate" type="date" required defaultValue={session?.session_date ?? today} /></label>
        <label><span>คาบ/ช่วงเวลา</span><input name="periodLabel" placeholder="เช่น คาบ 2 เวลา 09.20–10.10" defaultValue={session?.period_label ?? ""} /></label>
        <label><span>มาสายหลังจาก</span><div className="phase5-input-suffix"><input name="lateAfterMinutes" type="number" min="0" max="240" defaultValue={session?.late_after_minutes ?? 15} /><em>นาที</em></div></label>
        <label><span>เปิดเช็กชื่อ</span><input name="opensAt" type="datetime-local" defaultValue={localDateTime(session?.opens_at ?? null)} /></label>
        <label><span>ปิดเช็กชื่อ</span><input name="closesAt" type="datetime-local" defaultValue={localDateTime(session?.closes_at ?? null)} /></label>
        <label><span>สถานะเริ่มต้น</span><select name="status" defaultValue={session?.status ?? "draft"}><option value="draft">ฉบับร่าง</option><option value="open">เปิดเช็กชื่อ</option><option value="closed">ปิดแล้ว</option><option value="cancelled">ยกเลิก</option></select></label>
        <label><span>รหัสเช็กชื่อเดิม</span><input name="checkInCode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="ระบบสร้างให้เมื่อเปิด" defaultValue={session?.check_in_code ?? ""} /></label>
      </div>
      <label className="phase5-checkbox-row"><input name="allowSelfCheckin" type="checkbox" defaultChecked={session?.allow_self_checkin ?? true} /><span>อนุญาตให้นักเรียนเช็กชื่อด้วยรหัส 6 หลัก</span></label>
      <label><span>หมายเหตุ</span><textarea name="note" rows={3} placeholder="หัวข้อที่สอน ห้องเรียน หรือหมายเหตุเพิ่มเติม" defaultValue={session?.note ?? ""} /></label>
      <Phase5ActionFeedback state={state} />
      <button className="phase2-primary-button" type="submit" disabled={pending}><Save size={17} /> {pending ? "กำลังบันทึก..." : session ? "บันทึกการแก้ไข" : "สร้างคาบเช็กชื่อ"}</button>
    </form>
  );
}
