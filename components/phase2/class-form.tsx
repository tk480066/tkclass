"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { saveClassAction, type Phase2ActionState } from "@/app/phase2-actions";
import { ActionFeedback } from "@/components/phase2/action-feedback";
import type { ClassRow } from "@/lib/types";

const initialState: Phase2ActionState = {};

export function ClassForm({ classRow }: { classRow?: ClassRow }) {
  const [state, action, pending] = useActionState(saveClassAction, initialState);
  return (
    <form action={action} className="phase2-form class-form-grid">
      <input type="hidden" name="id" value={classRow?.id ?? ""} />
      <label>
        <span>รหัสวิชา/ชั้นเรียน *</span>
        <input name="classCode" required defaultValue={classRow?.class_code ?? ""} placeholder="CS-M2-01" />
      </label>
      <label>
        <span>ชื่อรายวิชา *</span>
        <input name="subjectName" required defaultValue={classRow?.subject_name ?? ""} placeholder="วิทยาการคำนวณ" />
      </label>
      <label>
        <span>ชื่อชั้นเรียน *</span>
        <input name="className" required defaultValue={classRow?.class_name ?? ""} placeholder="มัธยมศึกษาปีที่ 2/1" />
      </label>
      <label>
        <span>ระดับชั้น</span>
        <input name="level" defaultValue={classRow?.level ?? ""} placeholder="ม.2" />
      </label>
      <label>
        <span>ห้องเรียน</span>
        <input name="room" defaultValue={classRow?.room ?? ""} placeholder="2213" />
      </label>
      <label>
        <span>ภาคเรียน</span>
        <select name="semester" defaultValue={String(classRow?.semester ?? 1)}>
          <option value="1">ภาคเรียนที่ 1</option>
          <option value="2">ภาคเรียนที่ 2</option>
          <option value="3">ภาคฤดูร้อน</option>
        </select>
      </label>
      <label>
        <span>ปีการศึกษา</span>
        <input name="academicYear" type="number" min="2500" max="3000" defaultValue={classRow?.academic_year ?? 2569} />
      </label>
      <label>
        <span>สีประจำวิชา</span>
        <input name="courseColor" type="color" defaultValue={classRow?.course_color ?? "#0d5ba7"} />
      </label>
      <label className="span-2">
        <span>ลิงก์ห้องเรียนออนไลน์</span>
        <input name="onlineMeetingUrl" type="url" defaultValue={classRow?.online_meeting_url ?? ""} placeholder="https://meet.google.com/..." />
      </label>
      <label className="span-2">
        <span>รายละเอียดรายวิชา</span>
        <textarea name="description" rows={4} defaultValue={classRow?.description ?? ""} placeholder="คำอธิบายรายวิชาและข้อมูลสำคัญ" />
      </label>
      <label>
        <span>สถานะ</span>
        <select name="status" defaultValue={classRow?.status ?? "active"}>
          <option value="active">เปิดใช้งาน</option>
          <option value="inactive">ปิดชั่วคราว</option>
          <option value="archived">เก็บถาวร</option>
        </select>
      </label>
      <div className="phase2-form-actions span-2">
        <ActionFeedback state={state} />
        <button type="submit" className="phase2-primary-button" disabled={pending}>
          <Save size={17} /> {pending ? "กำลังบันทึก..." : classRow ? "บันทึกการแก้ไข" : "สร้างชั้นเรียน"}
        </button>
      </div>
    </form>
  );
}
