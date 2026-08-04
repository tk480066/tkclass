"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { PlusCircle, Save } from "lucide-react";
import { saveQuizQuestionAction, type Phase4ActionState } from "@/app/phase4-actions";
import { Phase4ActionFeedback } from "@/components/phase4/action-feedback";
import type { QuizQuestionType, QuizQuestionWithOptions } from "@/lib/types";

const initialState: Phase4ActionState = {};
const TYPES: Array<{ value: QuizQuestionType; label: string }> = [
  { value: "single_choice", label: "เลือกคำตอบเดียว" },
  { value: "multiple_choice", label: "เลือกได้หลายคำตอบ" },
  { value: "true_false", label: "จริง / เท็จ" },
  { value: "short_answer", label: "คำตอบสั้น" },
  { value: "essay", label: "คำตอบอธิบาย" },
];

export function QuestionForm({ quizId, nextOrder, question }: { quizId: string; nextOrder: number; question?: QuizQuestionWithOptions | null }) {
  const [state, action, pending] = useActionState(saveQuizQuestionAction, initialState);
  const [type, setType] = useState<QuizQuestionType>(question?.question_type ?? "single_choice");
  const existing = Array.from({ length: 6 }, (_, index) => question?.options[index]);
  return (
    <form action={action} className="phase4-form question-editor-form">
      <input type="hidden" name="id" value={question?.id ?? ""} />
      <input type="hidden" name="quizId" value={quizId} />
      <Phase4ActionFeedback state={state} />
      <div className="phase4-form-grid two">
        <label className="field-label"><span>ประเภทคำถาม</span><select className="field-control" name="questionType" value={type} onChange={(event: ChangeEvent<HTMLSelectElement>) => setType(event.target.value as QuizQuestionType)}>{TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="field-label"><span>ลำดับ</span><input className="field-control" type="number" name="orderNo" min={1} defaultValue={question?.order_no ?? nextOrder} required /></label>
        <label className="field-label full"><span>คำถาม</span><textarea className="field-control phase4-textarea" name="prompt" required defaultValue={question?.prompt ?? ""} placeholder="พิมพ์คำถามที่ต้องการ" /></label>
        <label className="field-label"><span>คะแนน</span><input className="field-control" type="number" name="points" min={0.01} step="0.01" defaultValue={question?.points ?? 1} required /></label>
        <label className="phase4-inline-check"><input type="checkbox" name="isRequired" defaultChecked={question?.is_required ?? true} /> บังคับตอบคำถามนี้</label>
      </div>

      {(type === "single_choice" || type === "multiple_choice") && (
        <div className="phase4-option-editor"><strong>ตัวเลือกและคำตอบที่ถูกต้อง</strong>{existing.map((option, index) => <label key={index}><input type="checkbox" name={`correctOption${index}`} defaultChecked={option?.is_correct ?? false} /><input className="field-control" name={`optionText${index}`} defaultValue={option?.option_text ?? ""} placeholder={`ตัวเลือกที่ ${index + 1}`} /></label>)}</div>
      )}
      {type === "true_false" && (
        <div className="phase4-option-editor true-false"><strong>เลือกคำตอบที่ถูกต้องเพียงข้อเดียว</strong><label><input type="checkbox" name="correctOption0" defaultChecked={question?.options[0]?.is_correct ?? true} /> จริง</label><label><input type="checkbox" name="correctOption1" defaultChecked={question?.options[1]?.is_correct ?? false} /> เท็จ</label></div>
      )}
      {type === "short_answer" && (
        <div className="phase4-form-grid two"><label className="field-label full"><span>คำตอบที่ยอมรับ</span><textarea className="field-control phase4-textarea" name="acceptedAnswers" defaultValue={question?.accepted_answers.join("\n") ?? ""} placeholder="ใส่คำตอบหลายแบบ โดยขึ้นบรรทัดใหม่หรือคั่นด้วยจุลภาค" /></label><label className="phase4-inline-check"><input type="checkbox" name="caseSensitive" defaultChecked={question?.case_sensitive ?? false} /> แยกตัวพิมพ์ใหญ่–เล็ก</label></div>
      )}
      <label className="field-label"><span>คำอธิบายเฉลยสำหรับครู</span><textarea className="field-control phase4-textarea small" name="explanation" defaultValue={question?.explanation ?? ""} /></label>
      <button className="phase2-primary-button" type="submit" disabled={pending}>{question ? <Save size={17} /> : <PlusCircle size={17} />} {pending ? "กำลังบันทึก..." : question ? "บันทึกคำถาม" : "เพิ่มคำถาม"}</button>
    </form>
  );
}
