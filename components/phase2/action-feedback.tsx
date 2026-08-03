import type { Phase2ActionState } from "@/app/phase2-actions";

export function ActionFeedback({ state }: { state: Phase2ActionState }) {
  if (!state.message && !state.error) return null;
  return (
    <div className={`phase2-feedback ${state.error ? "is-error" : "is-success"}`} role="status">
      {state.message && <strong>{state.message}</strong>}
      {state.error && <span>{state.error}</span>}
    </div>
  );
}
