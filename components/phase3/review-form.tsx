"use client";

import { useActionState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { reviewSubmissionAction, type Phase3ActionState } from "@/app/phase3-actions";
import { Phase3ActionFeedback } from "@/components/phase3/action-feedback";
import type { SubmissionWithStudent } from "@/lib/types";

const initialState: Phase3ActionState = {};

export function ReviewForm({ assignmentId, maxScore, submission }: { assignmentId: string; maxScore: number; submission: SubmissionWithStudent }) {
  const [state, action, pending] = useActionState(reviewSubmissionAction, initialState);
  return (
    <form action={action} className="phase3-review-form">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="submissionId" value={submission.id} />
      <div className="phase2-inline-fields">
        <label><span>คะแนน / {maxScore}</span><input name="score" type="number" min="0" max={maxScore} step="0.01" defaultValue={submission.score ?? ""} /></label>
        <label><span>ผลการตรวจ</span><select name="reviewOutcome" defaultValue={["passed","failed","revision_required"].includes(submission.status) ? submission.status : "graded"}><option value="graded">ตรวจแล้ว</option><option value="passed">ผ่าน</option><option value="failed">ไม่ผ่าน</option><option value="revision_required">ขอให้แก้ไข</option></select></label>
      </div>
      <label><span>ความคิดเห็นจากครู</span><textarea name="teacherFeedback" rows={4} defaultValue={submission.teacher_feedback ?? ""} placeholder="ข้อเสนอแนะ จุดเด่น และสิ่งที่ควรแก้ไข" /></label>
      <Phase3ActionFeedback state={state} />
      <button type="submit" className="phase2-primary-button" disabled={pending}>{submission.status === "revision_required" ? <RotateCcw size={17} /> : <Save size={17} />} {pending ? "กำลังบันทึก..." : "บันทึกผลการตรวจ"}</button>
    </form>
  );
}
