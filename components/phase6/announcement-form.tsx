"use client";

import { useActionState } from "react";
import { Megaphone, Pin } from "lucide-react";
import { saveAnnouncementAction, type Phase6ActionState } from "@/app/phase6-actions";
import { Phase6ActionFeedback } from "@/components/phase6/action-feedback";
import type { AnnouncementSummary, ClassSummary } from "@/lib/types";

const initialState: Phase6ActionState = {};

function dateTimeLocal(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function AnnouncementForm({ classes, announcement }: { classes: ClassSummary[]; announcement?: AnnouncementSummary | null }) {
  const [state, action, pending] = useActionState(saveAnnouncementAction, initialState);
  return (
    <form action={action} className="phase6-form">
      <input type="hidden" name="id" value={announcement?.id ?? ""} />
      <div className="phase6-form-heading">
        <span><Megaphone size={20} /></span>
        <div><strong>{announcement ? "แก้ไขประกาศ" : "สร้างประกาศใหม่"}</strong><small>สื่อสารข้อมูลสำคัญให้ผู้เรียนในชั้นเรียน</small></div>
      </div>
      <div className="phase6-form-grid">
        <label className="phase6-field full"><span>ชั้นเรียน</span><select name="classId" defaultValue={announcement?.class_id ?? classes[0]?.id ?? ""} required>{classes.map((row) => <option value={row.id} key={row.id}>{row.class_code} · {row.subject_name} · {row.class_name}</option>)}</select></label>
        <label className="phase6-field full"><span>หัวข้อประกาศ</span><input name="title" defaultValue={announcement?.title ?? ""} maxLength={200} required placeholder="เช่น แจ้งกำหนดส่งโครงงาน" /></label>
        <label className="phase6-field full"><span>รายละเอียด</span><textarea name="body" defaultValue={announcement?.body ?? ""} rows={8} required placeholder="กรอกรายละเอียดประกาศ..." /></label>
        <label className="phase6-field"><span>ระดับความสำคัญ</span><select name="priority" defaultValue={announcement?.priority ?? "normal"}><option value="normal">ทั่วไป</option><option value="important">สำคัญ</option><option value="urgent">เร่งด่วน</option></select></label>
        <label className="phase6-field"><span>สถานะ</span><select name="status" defaultValue={announcement?.status ?? "draft"}><option value="draft">ฉบับร่าง</option><option value="published">เผยแพร่</option><option value="archived">เก็บเข้าคลัง</option></select></label>
        <label className="phase6-field"><span>เวลาเผยแพร่</span><input type="datetime-local" name="publishAt" defaultValue={dateTimeLocal(announcement?.publish_at)} /></label>
        <label className="phase6-field"><span>เวลาสิ้นสุด</span><input type="datetime-local" name="expiresAt" defaultValue={dateTimeLocal(announcement?.expires_at)} /></label>
      </div>
      <label className="phase6-check-field"><input type="checkbox" name="isPinned" defaultChecked={announcement?.is_pinned ?? false} /><Pin size={16} /><span>ปักหมุดประกาศนี้ไว้ด้านบน</span></label>
      <Phase6ActionFeedback state={state} />
      <button className="phase2-primary-button" type="submit" disabled={pending}><Megaphone size={17} /> {pending ? "กำลังบันทึก..." : announcement ? "บันทึกการแก้ไข" : "สร้างประกาศ"}</button>
    </form>
  );
}
