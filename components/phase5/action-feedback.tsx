export function Phase5ActionFeedback({ state }: { state: { error?: string; message?: string; success?: boolean } }) {
  if (state.error) return <div className="phase5-feedback error" role="alert">{state.error}</div>;
  if (state.message) return <div className="phase5-feedback success" role="status">{state.message}</div>;
  return null;
}
