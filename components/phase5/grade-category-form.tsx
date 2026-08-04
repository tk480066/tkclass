"use client";

import { useActionState } from "react";
import { Layers3, Save } from "lucide-react";
import { saveGradeCategoryAction, type Phase5ActionState } from "@/app/phase5-actions";
import { Phase5ActionFeedback } from "@/components/phase5/action-feedback";
import type { GradeCategoryRow } from "@/lib/types";

const initialState: Phase5ActionState = {};

export function GradeCategoryForm({ classId, category }: { classId: string; category?: GradeCategoryRow | null }) {
  const [state, action, pending] = useActionState(saveGradeCategoryAction, initialState);
  return (
    <form action={action} className="phase5-mini-form">
      <input type="hidden" name="id" value={category?.id ?? ""} />
      <input type="hidden" name="classId" value={classId} />
      <div className="phase5-form-heading"><span><Layers3 size={18} /></span><div><strong>{category ? "แก้ไขหมวดคะแนน" : "เพิ่มหมวดคะแนน"}</strong><small>น้ำหนักรวมควรเท่ากับ 100%</small></div></div>
      <div className="phase5-form-grid compact-three">
        <label><span>ชื่อหมวด</span><input name="name" required defaultValue={category?.name ?? ""} placeholder="เช่น งานระหว่างเรียน" /></label>
        <label><span>น้ำหนัก</span><div className="phase5-input-suffix"><input name="weightPercent" type="number" step="0.01" min="0" max="100" required defaultValue={category?.weight_percent ?? 0} /><em>%</em></div></label>
        <label><span>ลำดับ</span><input name="orderNo" type="number" min="1" defaultValue={category?.order_no ?? 1} /></label>
      </div>
      <label className="phase5-checkbox-row"><input name="isActive" type="checkbox" defaultChecked={category?.is_active ?? true} /><span>ใช้งานหมวดคะแนนนี้</span></label>
      <Phase5ActionFeedback state={state} />
      <button className="phase2-secondary-button" type="submit" disabled={pending}><Save size={16} /> {pending ? "กำลังบันทึก..." : "บันทึกหมวด"}</button>
    </form>
  );
}
