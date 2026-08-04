import type { AssignmentStatus, SubmissionStatus } from "@/lib/types";

const labels: Record<string, string> = {
  not_started: "ยังไม่เริ่ม",
  draft: "กำลังทำ",
  submitted: "ส่งแล้ว",
  late: "ส่งล่าช้า",
  revision_required: "ต้องแก้ไข",
  graded: "ครูตรวจแล้ว",
  passed: "ผ่าน",
  failed: "ไม่ผ่าน",
  withdrawn: "ยกเลิกการส่ง",
  published: "เผยแพร่",
  closed: "ปิดรับงาน",
  archived: "เก็บถาวร",
};

export function StatusBadge({ status }: { status: SubmissionStatus | AssignmentStatus | "not_started" }) {
  return <span className={`phase3-status status-${status}`}>{labels[status] ?? status}</span>;
}
