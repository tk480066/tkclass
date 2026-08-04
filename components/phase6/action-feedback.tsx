import Link from "next/link";
import type { Phase6ActionState } from "@/app/phase6-actions";

export function Phase6ActionFeedback({ state, role = "teacher" }: { state: Phase6ActionState; role?: "teacher" | "student" }) {
  if (!state.message && !state.error) return null;
  return (
    <div className={`phase6-feedback ${state.error ? "is-error" : "is-success"}`} role="status">
      {state.message && <strong>{state.message}</strong>}
      {state.error && <span>{state.error}</span>}
      {state.announcementId && role === "teacher" && (
        <Link href={`/teacher/communication/announcements/${state.announcementId}`}>เปิดรายละเอียดประกาศ</Link>
      )}
      {state.conversationId && (
        <Link href={`/${role}/communication/messages/${state.conversationId}`}>เปิดการสนทนา</Link>
      )}
    </div>
  );
}
