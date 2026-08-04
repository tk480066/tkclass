"use client";

import { useActionState } from "react";
import { Link2, Save, Send, Undo2 } from "lucide-react";
import { saveSubmissionDraftAction, submitAssignmentAction, withdrawSubmissionAction, type Phase3ActionState } from "@/app/phase3-actions";
import { Phase3ActionFeedback } from "@/components/phase3/action-feedback";
import type { AssignmentRow, RosterStudent, SubmissionRow } from "@/lib/types";

const initialState: Phase3ActionState = {};

export function SubmissionForm({ assignment, submission, groupMembers, currentStudentId }: { assignment: AssignmentRow; submission: SubmissionRow | null; groupMembers: RosterStudent[]; currentStudentId: string }) {
  const [state, action, pending] = useActionState(saveSubmissionDraftAction, initialState);
  const isOwner = !submission || submission.submitted_by === currentStudentId;
  const editable = isOwner && (!submission || ["draft", "withdrawn", "revision_required"].includes(submission.status) || (assignment.allow_resubmit && ["submitted", "late"].includes(submission.status)));
  const canSubmit = Boolean(isOwner && submission && ["draft", "withdrawn", "revision_required"].includes(submission.status));
  const canWithdraw = Boolean(isOwner && submission && assignment.allow_resubmit && ["submitted", "late"].includes(submission.status));
  const types = new Set(assignment.allowed_submission_types);

  return (
    <div className="phase3-submission-editor">
      <form action={action} className="phase2-form">
        <input type="hidden" name="assignmentId" value={assignment.id} />
        <input type="hidden" name="submissionId" value={submission?.id ?? state.submissionId ?? ""} />
        {!isOwner && submission && <div className="phase3-readonly-note">สมาชิกกลุ่มคนอื่นเป็นผู้ส่งงานนี้ คุณสามารถดูผลงานและผลตรวจได้ แต่ไม่สามารถแก้ไขแทนผู้ส่ง</div>}
        {assignment.work_type === "group" && (
          <div className="phase3-group-members"><strong>สมาชิกกลุ่ม {assignment.target_group_name || submission?.group_name || ""}</strong><div>{groupMembers.map((member) => <span key={member.user_id}>{member.display_name}</span>)}</div></div>
        )}
        {types.has("text") && <label><span>คำตอบหรือรายละเอียดผลงาน</span><textarea name="answerText" rows={9} defaultValue={submission?.answer_text ?? ""} disabled={!editable} placeholder="พิมพ์คำตอบหรืออธิบายผลงานของคุณ" /></label>}
        {types.has("link") && <label><span><Link2 size={15} /> ลิงก์ผลงาน</span><input name="linkUrl" type="url" defaultValue={submission?.link_url ?? ""} disabled={!editable} placeholder="https://drive.google.com/..." /></label>}
        <Phase3ActionFeedback state={state} />
        {editable && <button type="submit" className="phase2-secondary-button" disabled={pending}><Save size={17} /> {pending ? "กำลังบันทึก..." : "บันทึกฉบับร่าง"}</button>}
      </form>

      <div className="phase3-submit-actions">
        {canSubmit && <form action={submitAssignmentAction}><input type="hidden" name="assignmentId" value={assignment.id} /><input type="hidden" name="submissionId" value={submission!.id} /><button type="submit" className="phase2-primary-button"><Send size={17} /> ส่งงาน</button></form>}
        {canWithdraw && <form action={withdrawSubmissionAction}><input type="hidden" name="assignmentId" value={assignment.id} /><input type="hidden" name="submissionId" value={submission!.id} /><button type="submit" className="phase3-danger-outline"><Undo2 size={17} /> ยกเลิกการส่ง</button></form>}
      </div>
    </div>
  );
}
