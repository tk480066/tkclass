import type { AttendanceSessionStatus, AttendanceStatus } from "@/lib/types";

const LABELS: Record<string, string> = {
  draft: "ฉบับร่าง",
  open: "กำลังเปิด",
  closed: "ปิดแล้ว",
  cancelled: "ยกเลิก",
  unmarked: "ยังไม่เช็ก",
  present: "มาเรียน",
  late: "มาสาย",
  absent: "ขาดเรียน",
  leave: "ลากิจ",
  sick: "ลาป่วย",
  activity: "ร่วมกิจกรรม",
};

export function AttendanceStatusBadge({ status }: { status: AttendanceSessionStatus | AttendanceStatus }) {
  return <span className={`phase5-status-badge status-${status}`}>{LABELS[status] ?? status}</span>;
}
