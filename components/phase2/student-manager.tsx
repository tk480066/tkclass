"use client";

import { useActionState } from "react";
import { FileSpreadsheet, UserPlus } from "lucide-react";
import {
  enrollExistingStudentAction,
  importStudentsAction,
  type Phase2ActionState,
} from "@/app/phase2-actions";
import { ActionFeedback } from "@/components/phase2/action-feedback";

const initialState: Phase2ActionState = {};

export function EnrollStudentForm({ classId }: { classId: string }) {
  const [state, action, pending] = useActionState(enrollExistingStudentAction, initialState);
  return (
    <form action={action} className="phase2-form compact-phase2-form">
      <input type="hidden" name="classId" value={classId} />
      <div className="phase2-form-heading"><span><UserPlus size={19} /></span><div><strong>เพิ่มนักเรียนที่มีบัญชีแล้ว</strong><small>ค้นหาด้วยรหัสนักเรียน 5 หลัก</small></div></div>
      <label><span>รหัสนักเรียน *</span><input name="studentCode" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} required placeholder="10001" /></label>
      <div className="phase2-inline-fields">
        <label><span>เลขที่</span><input name="studentNumber" type="number" min="1" /></label>
        <label><span>กลุ่ม</span><input name="groupName" placeholder="กลุ่ม A" /></label>
      </div>
      <ActionFeedback state={state} />
      <button className="phase2-primary-button" type="submit" disabled={pending}><UserPlus size={17} /> {pending ? "กำลังเพิ่ม..." : "เพิ่มเข้าชั้นเรียน"}</button>
    </form>
  );
}

export function ImportStudentsForm({ classId }: { classId: string }) {
  const [state, action, pending] = useActionState(importStudentsAction, initialState);
  return (
    <form action={action} className="phase2-form compact-phase2-form">
      <input type="hidden" name="classId" value={classId} />
      <div className="phase2-form-heading"><span><FileSpreadsheet size={19} /></span><div><strong>นำเข้ารายชื่อนักเรียน</strong><small>รองรับ CSV ครั้งละไม่เกิน 100 คน</small></div></div>
      <label>
        <span>ข้อมูล CSV</span>
        <textarea
          name="csvText"
          rows={9}
          placeholder={'student_code,title,first_name,last_name,nickname,level,room,student_number,pin,group_name\n10002,เด็กหญิง,พิมพ์ชนก,เรียนดี,พิม,ม.2,1,2,123456,กลุ่ม A'}
          required
        />
      </label>
      <p className="phase2-help">หากไม่ระบุ PIN ระบบจะใช้ค่าเริ่มต้น <code>123456</code> ควรให้นักเรียนเปลี่ยน PIN ภายหลัง</p>
      <ActionFeedback state={state} />
      <button className="phase2-secondary-button" type="submit" disabled={pending}><FileSpreadsheet size={17} /> {pending ? "กำลังนำเข้า..." : "นำเข้ารายชื่อ"}</button>
    </form>
  );
}
