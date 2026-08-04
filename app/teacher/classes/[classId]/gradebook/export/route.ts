import { getCurrentUser } from "@/lib/auth/require-role";
import { getTeacherGradebook } from "@/lib/data/phase5";

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ classId: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.profile.role !== "teacher") return new Response("Unauthorized", { status: 401 });
  const { classId } = await params;
  const data = await getTeacherGradebook(user.id, classId);
  const headers = ["เลขที่", "รหัสนักเรียน", "ชื่อ-นามสกุล", "เวลาเรียน (%)", ...data.items.map((item) => `${item.title} (${item.max_score})`), "คะแนนรวม (%)", "ระดับผลการเรียน"];
  const rows = data.students.map((student) => [
    student.student_number ?? "",
    student.student_code,
    student.student_name,
    student.attendance_percent ?? "",
    ...data.items.map((item) => student.scores[item.id] ?? ""),
    student.total_percent ?? "",
    student.letter_grade ?? "",
  ]);
  const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  const filename = `gradebook-${data.classRow.class_code}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
