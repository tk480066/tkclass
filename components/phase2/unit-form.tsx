"use client";

import { useActionState } from "react";
import { Layers3, Save } from "lucide-react";
import { saveUnitAction, type Phase2ActionState } from "@/app/phase2-actions";
import { ActionFeedback } from "@/components/phase2/action-feedback";
import type { UnitRow } from "@/lib/types";

const initialState: Phase2ActionState = {};

export function UnitForm({ classId, unit }: { classId: string; unit?: UnitRow }) {
  const [state, action, pending] = useActionState(saveUnitAction, initialState);
  return (
    <form action={action} className="phase2-form compact-phase2-form">
      <input type="hidden" name="id" value={unit?.id ?? ""} />
      <input type="hidden" name="classId" value={classId} />
      <div className="phase2-form-heading">
        <span><Layers3 size={19} /></span>
        <div><strong>{unit ? "แก้ไขหน่วยการเรียนรู้" : "เพิ่มหน่วยการเรียนรู้"}</strong><small>กำหนดชื่อ จุดประสงค์ ลำดับ และสถานะเผยแพร่</small></div>
      </div>
      <label>
        <span>ชื่อหน่วย *</span>
        <input name="title" required defaultValue={unit?.title ?? ""} placeholder="หน่วยที่ 1 แนวคิดเชิงคำนวณ" />
      </label>
      <label>
        <span>คำอธิบาย</span>
        <textarea name="description" rows={3} defaultValue={unit?.description ?? ""} />
      </label>
      <label>
        <span>จุดประสงค์การเรียนรู้</span>
        <textarea name="objectives" rows={3} defaultValue={unit?.objectives ?? ""} placeholder="แยกแต่ละข้อด้วยการขึ้นบรรทัดใหม่" />
      </label>
      <div className="phase2-inline-fields">
        <label><span>ลำดับ</span><input name="orderNo" type="number" min="1" defaultValue={unit?.order_no ?? 1} /></label>
        <label><span>สถานะ</span><select name="status" defaultValue={unit?.status ?? "draft"}><option value="draft">ฉบับร่าง</option><option value="published">เผยแพร่</option><option value="archived">เก็บถาวร</option></select></label>
      </div>
      <label>
        <span>กำหนดเวลาเผยแพร่</span>
        <input name="publishAt" type="datetime-local" defaultValue={unit?.publish_at ? unit.publish_at.slice(0, 16) : ""} />
      </label>
      <ActionFeedback state={state} />
      <button type="submit" className="phase2-primary-button" disabled={pending}><Save size={17} /> {pending ? "กำลังบันทึก..." : "บันทึกหน่วย"}</button>
    </form>
  );
}
