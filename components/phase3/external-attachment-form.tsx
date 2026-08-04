"use client";

import { useActionState } from "react";
import { Link2, Plus } from "lucide-react";
import { addExternalAssignmentAttachmentAction, type Phase3ActionState } from "@/app/phase3-actions";
import { Phase3ActionFeedback } from "@/components/phase3/action-feedback";

const initialState: Phase3ActionState = {};

export function ExternalAttachmentForm({ assignmentId }: { assignmentId: string }) {
  const [state, action, pending] = useActionState(addExternalAssignmentAttachmentAction, initialState);
  return (
    <form action={action} className="phase3-external-form">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <div className="phase2-form-heading"><span><Link2 size={18} /></span><div><strong>แนบลิงก์ประกอบ</strong><small>Google Drive, YouTube หรือเว็บไซต์อื่น</small></div></div>
      <label><span>ชื่อเอกสาร/ลิงก์</span><input name="fileName" placeholder="เช่น ตัวอย่างชิ้นงาน" /></label>
      <label><span>URL *</span><input name="externalUrl" type="url" required placeholder="https://..." /></label>
      <Phase3ActionFeedback state={state} />
      <button type="submit" className="phase2-secondary-button" disabled={pending}><Plus size={16} /> {pending ? "กำลังเพิ่ม..." : "เพิ่มลิงก์"}</button>
    </form>
  );
}
