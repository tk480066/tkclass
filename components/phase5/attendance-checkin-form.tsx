"use client";

import { useActionState } from "react";
import { ScanLine } from "lucide-react";
import { studentAttendanceCheckInAction, type Phase5ActionState } from "@/app/phase5-actions";
import { Phase5ActionFeedback } from "@/components/phase5/action-feedback";

const initialState: Phase5ActionState = {};

export function AttendanceCheckInForm() {
  const [state, action, pending] = useActionState(studentAttendanceCheckInAction, initialState);
  return (
    <form action={action} className="phase5-checkin-card">
      <span className="phase5-checkin-icon"><ScanLine size={30} /></span>
      <div><span className="phase-panel-kicker">SELF CHECK-IN</span><h2>เช็กชื่อเข้าเรียน</h2><p>กรอกรหัสตัวเลข 6 หลักที่ครูแสดงหน้าชั้นเรียน</p></div>
      <input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required placeholder="000000" aria-label="รหัสเช็กชื่อ 6 หลัก" />
      <button className="phase2-primary-button" type="submit" disabled={pending}>{pending ? "กำลังตรวจสอบ..." : "ยืนยันเช็กชื่อ"}</button>
      <Phase5ActionFeedback state={state} />
    </form>
  );
}
