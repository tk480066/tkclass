import type { Phase3ActionState } from "@/app/phase3-actions";

export function Phase3ActionFeedback({ state }: { state: Phase3ActionState }) {
  if (!state.message && !state.error) return null;
  return (
    <div className={`phase3-feedback ${state.error ? "is-error" : "is-success"}`} role="status">
      {state.message && <strong>{state.message}</strong>}
      {state.error && <span>{state.error}</span>}
      {state.assignmentId && <a href={`/teacher/assignments/${state.assignmentId}`}>เปิดรายละเอียดงาน</a>}
    </div>
  );
}
