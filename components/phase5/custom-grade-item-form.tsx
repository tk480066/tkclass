"use client";

import { useActionState } from "react";
import { CirclePlus, Save } from "lucide-react";
import { saveCustomGradeItemAction, type Phase5ActionState } from "@/app/phase5-actions";
import { Phase5ActionFeedback } from "@/components/phase5/action-feedback";
import type { GradeCategoryRow, GradeItemRow } from "@/lib/types";

const initialState: Phase5ActionState = {};

export function CustomGradeItemForm({ classId, categories, item }: { classId: string; categories: GradeCategoryRow[]; item?: GradeItemRow | null }) {
  const [state, action, pending] = useActionState(saveCustomGradeItemAction, initialState);
  return (
    <form action={action} className="phase5-mini-form">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <input type="hidden" name="classId" value={classId} />
      <div className="phase5-form-heading"><span><CirclePlus size={18} /></span><div><strong>{item ? "แก้ไขคะแนนเพิ่มเติม" : "เพิ่มคะแนนเพิ่มเติม"}</strong><small>เช่น คะแนนพฤติกรรม ชิ้นงาน หรือกิจกรรม</small></div></div>
      <div className="phase5-form-grid two-columns">
        <label><span>ชื่อรายการ</span><input name="title" required defaultValue={item?.title ?? ""} placeholder="เช่น คะแนนกิจกรรมในชั้นเรียน" /></label>
        <label><span>หมวดคะแนน</span><select name="categoryId" required defaultValue={item?.category_id ?? categories[0]?.id ?? ""}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label><span>คะแนนเต็ม</span><input name="maxScore" type="number" min="0.01" step="0.01" required defaultValue={item?.max_score ?? 10} /></label>
        <label><span>น้ำหนักภายในหมวด</span><input name="itemWeight" type="number" min="0.01" step="0.01" defaultValue={item?.item_weight ?? 1} /></label>
        <label><span>ลำดับ</span><input name="orderNo" type="number" min="1" defaultValue={item?.order_no ?? 1} /></label>
        <label><span>สถานะ</span><select name="status" defaultValue={item?.status ?? "draft"}><option value="draft">ฉบับร่าง</option><option value="published">เผยแพร่</option><option value="archived">เก็บเข้าคลัง</option></select></label>
      </div>
      <label><span>คำอธิบาย</span><textarea name="description" rows={2} defaultValue={item?.description ?? ""} /></label>
      <Phase5ActionFeedback state={state} />
      <button className="phase2-primary-button" type="submit" disabled={pending}>{item ? <Save size={16} /> : <CirclePlus size={16} />} {pending ? "กำลังบันทึก..." : item ? "บันทึกการแก้ไข" : "เพิ่มรายการคะแนน"}</button>
    </form>
  );
}
