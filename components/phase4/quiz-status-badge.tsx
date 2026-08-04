import type { QuizAttemptStatus, QuizStatus } from "@/lib/types";

const LABELS: Record<string, string> = {
  draft: "ฉบับร่าง", published: "เปิดทำ", closed: "ปิดแล้ว", archived: "เก็บเข้าคลัง",
  in_progress: "กำลังทำ", submitted: "รอตรวจ", graded: "ตรวจแล้ว", expired: "หมดเวลา",
  upcoming: "ยังไม่เปิด", open: "เปิดอยู่",
};

export function QuizStatusBadge({ status }: { status: QuizStatus | QuizAttemptStatus | "upcoming" | "open" }) {
  return <span className={`phase4-status-badge status-${status}`}>{LABELS[status] ?? status}</span>;
}
