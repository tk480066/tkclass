"use client";

import { useActionState } from "react";
import { MessageSquarePlus, Send } from "lucide-react";
import { createConversationAction, type Phase6ActionState } from "@/app/phase6-actions";
import { Phase6ActionFeedback } from "@/components/phase6/action-feedback";

const initialState: Phase6ActionState = {};

type ContactOption = { value: string; label: string; group: string };

export function ConversationStartForm({ options, role }: { options: ContactOption[]; role: "teacher" | "student" }) {
  const [state, action, pending] = useActionState(createConversationAction, initialState);
  const grouped = new Map<string, ContactOption[]>();
  for (const option of options) grouped.set(option.group, [...(grouped.get(option.group) ?? []), option]);
  return (
    <form action={action} className="phase6-form compact">
      <div className="phase6-form-heading"><span><MessageSquarePlus size={20} /></span><div><strong>เริ่มการสนทนา</strong><small>{role === "teacher" ? "เลือกนักเรียนจากชั้นเรียนของคุณ" : "เลือกวิชาที่ต้องการติดต่อครู"}</small></div></div>
      <label className="phase6-field"><span>{role === "teacher" ? "ผู้รับ" : "รายวิชา"}</span><select name="contactValue" required defaultValue=""><option value="" disabled>เลือก...</option>{[...grouped.entries()].map(([group, items]) => <optgroup label={group} key={group}>{items.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</optgroup>)}</select></label>
      <label className="phase6-field"><span>หัวข้อ</span><input name="subject" required maxLength={180} placeholder="เช่น ขอคำปรึกษาเรื่องงาน" /></label>
      <label className="phase6-field"><span>ข้อความเริ่มต้น</span><textarea name="initialBody" rows={4} required placeholder="พิมพ์ข้อความ..." /></label>
      <Phase6ActionFeedback state={state} role={role} />
      <button className="phase2-primary-button" type="submit" disabled={pending}><Send size={17} /> {pending ? "กำลังเปิดการสนทนา..." : "เริ่มการสนทนา"}</button>
    </form>
  );
}
