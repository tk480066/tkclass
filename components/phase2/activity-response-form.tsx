"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { saveActivityResponseAction, type Phase2ActionState } from "@/app/phase2-actions";
import { ActionFeedback } from "@/components/phase2/action-feedback";

const initialState: Phase2ActionState = {};

export function ActivityResponseForm({
  lessonId,
  blockId,
  initialResponse,
  longText = true,
}: {
  lessonId: string;
  blockId: string;
  initialResponse?: string | null;
  longText?: boolean;
}) {
  const [state, action, pending] = useActionState(saveActivityResponseAction, initialState);
  return (
    <form action={action} className="activity-response-form">
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="blockId" value={blockId} />
      {longText ? (
        <textarea name="responseText" rows={5} required defaultValue={initialResponse ?? ""} placeholder="พิมพ์คำตอบของคุณ..." />
      ) : (
        <input name="responseText" required defaultValue={initialResponse ?? ""} placeholder="พิมพ์คำตอบ" />
      )}
      <ActionFeedback state={state} />
      <button type="submit" disabled={pending}><Send size={16} /> {pending ? "กำลังบันทึก..." : "บันทึกคำตอบ"}</button>
    </form>
  );
}
