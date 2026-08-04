import { getCurrentUser } from "@/lib/auth/require-role";
import { getAttendanceSessionDetail } from "@/lib/data/phase5";

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

const STATUS_LABELS: Record<string, string> = {
  unmarked: "ยังไม่เช็ก",
  present: "มาเรียน",
  late: "มาสาย",
  absent: "ขาดเรียน",
  leave: "ลากิจ",
  sick: "ลาป่วย",
  activity: "ร่วมกิจกรรม",
};

export async function GET(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.profile.role !== "teacher") return new Response("Unauthorized", { status: 401 });
  const { sessionId } = await params;
  const { classRow, session, roster } = await getAttendanceSessionDetail(user.id, sessionId);
  const headers = ["เลขที่", "รหัสนักเรียน", "ชื่อ-นามสกุล", "สถานะ", "เวลาเช็กชื่อ", "วิธีเช็กชื่อ", "หมายเหตุ"];
  const rows = roster.map((student) => [
    student.enrollment_number ?? "",
    student.student_code,
    student.display_name,
    STATUS_LABELS[student.record?.status ?? "unmarked"],
    student.record?.checked_in_at ? new Date(student.record.checked_in_at).toLocaleString("th-TH") : "",
    student.record?.check_in_method ?? "",
    student.record?.note ?? "",
  ]);
  const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  const filename = `attendance-${classRow.class_code}-${session.session_date}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
