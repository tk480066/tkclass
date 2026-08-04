"use client";
import { useActionState } from "react";
import { Save } from "lucide-react";
import { gradeQuizAnswerAction, type Phase4ActionState } from "@/app/phase4-actions";
import { Phase4ActionFeedback } from "@/components/phase4/action-feedback";
const initialState: Phase4ActionState = {};
export function ManualGradeForm({ quizId, attemptId, answerId, points, currentScore, feedback }: { quizId: string; attemptId: string; answerId: string; points: number; currentScore: number | null; feedback: string | null }) {
  const [state, action, pending] = useActionState(gradeQuizAnswerAction, initialState);
  return <form action={action} className="phase4-manual-grade-form"><input type="hidden" name="quizId" value={quizId} /><input type="hidden" name="attemptId" value={attemptId} /><input type="hidden" name="answerId" value={answerId} /><input type="hidden" name="questionPoints" value={points} /><Phase4ActionFeedback state={state} /><div><label className="field-label"><span>คะแนนที่ให้ / {points}</span><input className="field-control" type="number" name="awardedScore" min={0} max={points} step="0.01" defaultValue={currentScore ?? 0} required /></label><label className="field-label"><span>ความคิดเห็น</span><textarea className="field-control phase4-textarea small" name="teacherFeedback" defaultValue={feedback ?? ""} /></label></div><button className="phase2-primary-button" type="submit" disabled={pending}><Save size={16} /> {pending ? "กำลังบันทึก" : "บันทึกคะแนน"}</button></form>;
}
