"use client";

import { useActionState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { sendMessageAction, type Phase6ActionState } from "@/app/phase6-actions";
import { Phase6ActionFeedback } from "@/components/phase6/action-feedback";

const initialState: Phase6ActionState = {};

export function MessageComposer({ conversationId, role, disabled = false }: { conversationId: string; role: "teacher" | "student"; disabled?: boolean }) {
  const [state, action, pending] = useActionState(sendMessageAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.success) formRef.current?.reset(); }, [state.success, state.messageId]);
  return (
    <form action={action} ref={formRef} className="phase6-message-composer">
      <input type="hidden" name="conversationId" value={conversationId} />
      <textarea name="body" rows={3} required disabled={disabled || pending} placeholder={disabled ? "การสนทนานี้ปิดแล้ว" : "พิมพ์ข้อความถึงคู่สนทนา..."} />
      <div className="phase6-composer-actions">
        <Phase6ActionFeedback state={state} role={role} />
        <button className="phase2-primary-button" type="submit" disabled={disabled || pending}><Send size={17} /> {pending ? "กำลังส่ง..." : "ส่งข้อความ"}</button>
      </div>
    </form>
  );
}
