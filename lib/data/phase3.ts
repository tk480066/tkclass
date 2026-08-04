import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatStudentName, getClassRoster, getTeacherClass, getTeacherClassSummaries } from "@/lib/data/phase2";
import type {
  AssignmentAttachmentRow,
  AssignmentRow,
  AssignmentTargetRow,
  ClassRow,
  RosterStudent,
  StudentAssignmentSummary,
  StudentProfile,
  SubmissionFileRow,
  SubmissionMemberRow,
  SubmissionRow,
  SubmissionWithStudent,
  TeacherAssignmentSummary,
} from "@/lib/types";

const ASSIGNMENT_SELECT = "id, class_id, title, instructions, work_type, max_score, passing_score, publish_at, due_at, allow_late, allow_resubmit, target_mode, target_group_name, allowed_submission_types, status, rubric_json, created_at, updated_at";
const SUBMISSION_SELECT = "id, assignment_id, submitted_by, group_name, answer_text, link_url, status, submitted_at, withdrawn_at, revision_count, score, teacher_feedback, rubric_scores, reviewed_at, reviewed_by, created_at, updated_at";
const ATTACHMENT_SELECT = "id, assignment_id, storage_path, external_url, file_name, mime_type, file_size, created_at";
const FILE_SELECT = "id, submission_id, uploaded_by, storage_path, file_name, mime_type, file_size, created_at";

function isOpenForStudent(row: AssignmentRow) {
  if (!(["published", "closed"] as string[]).includes(row.status)) return false;
  return !row.publish_at || new Date(row.publish_at).getTime() <= Date.now();
}

export function getAssignmentDisplayStatus(submission: SubmissionRow | null) {
  return submission?.status ?? "not_started";
}

export async function getTeacherAssignmentDashboard(teacherId: string) {
  const [classes, assignments] = await Promise.all([
    getTeacherClassSummaries(teacherId),
    getTeacherAssignments(teacherId),
  ]);
  return {
    classes,
    assignments,
    metrics: {
      assignment_count: assignments.length,
      published_count: assignments.filter((row) => row.status === "published").length,
      pending_review_count: assignments.reduce((sum, row) => sum + row.pending_review_count, 0),
      submission_count: assignments.reduce((sum, row) => sum + row.submission_count, 0),
    },
  };
}

export async function getTeacherAssignments(teacherId: string, classId?: string): Promise<TeacherAssignmentSummary[]> {
  const supabase = await createClient();
  let classQuery = supabase
    .from("classes")
    .select("id, class_code, subject_name, class_name")
    .eq("teacher_id", teacherId);
  if (classId) classQuery = classQuery.eq("id", classId);
  const { data: classes, error: classError } = await classQuery;
  if (classError) throw new Error(classError.message);
  const classRows = (classes ?? []) as Array<{ id: string; class_code: string; subject_name: string; class_name: string }>;
  const classIds = classRows.map((row) => row.id);
  if (!classIds.length) return [];

  const { data: assignments, error } = await supabase
    .from("assignments")
    .select(ASSIGNMENT_SELECT)
    .in("class_id", classIds)
    .neq("status", "archived")
    .order("due_at", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  const assignmentRows = (assignments ?? []) as unknown as AssignmentRow[];
  const assignmentIds = assignmentRows.map((row) => row.id);

  const { data: submissions } = assignmentIds.length
    ? await supabase.from("submissions").select("assignment_id, status").in("assignment_id", assignmentIds)
    : { data: [] as Array<{ assignment_id: string; status: string }> };
  const submissionRows = (submissions ?? []) as Array<{ assignment_id: string; status: string }>;
  const classMap = new Map(classRows.map((row) => [row.id, row]));

  return assignmentRows.map((assignment) => {
    const classRow = classMap.get(assignment.class_id)!;
    const related = submissionRows.filter((row) => row.assignment_id === assignment.id);
    return {
      ...assignment,
      class_code: classRow.class_code,
      subject_name: classRow.subject_name,
      class_name: classRow.class_name,
      submission_count: related.filter((row) => row.status !== "draft" && row.status !== "withdrawn").length,
      pending_review_count: related.filter((row) => row.status === "submitted" || row.status === "late").length,
      graded_count: related.filter((row) => ["graded", "passed", "failed"].includes(row.status)).length,
    };
  });
}

export async function getTeacherAssignmentEditor(teacherId: string, assignmentId: string) {
  const supabase = await createClient();
  const { data: assignment, error } = await supabase
    .from("assignments")
    .select(ASSIGNMENT_SELECT)
    .eq("id", assignmentId)
    .single();
  if (error || !assignment) notFound();
  const assignmentRow = assignment as unknown as AssignmentRow;
  const classRow = await getTeacherClass(teacherId, assignmentRow.class_id);
  const roster = await getClassRoster(teacherId, assignmentRow.class_id);

  const [{ data: targets }, { data: attachments }, { data: submissions }] = await Promise.all([
    supabase.from("assignment_targets").select("id, assignment_id, student_id, group_name, created_at").eq("assignment_id", assignmentId),
    supabase.from("assignment_attachments").select(ATTACHMENT_SELECT).eq("assignment_id", assignmentId).order("created_at"),
    supabase.from("submissions").select(SUBMISSION_SELECT).eq("assignment_id", assignmentId).order("updated_at", { ascending: false }),
  ]);

  const attachmentRows = (attachments ?? []) as unknown as AssignmentAttachmentRow[];
  const signedAttachments = await Promise.all(attachmentRows.map(async (item) => {
    if (!item.storage_path) return item;
    const { data } = await supabase.storage.from("assignment-files").createSignedUrl(item.storage_path, 3600);
    return { ...item, signed_url: data?.signedUrl ?? null };
  }));

  const submissionRows = (submissions ?? []) as unknown as SubmissionRow[];
  const submissionIds = submissionRows.map((row) => row.id);
  const studentIds = [...new Set(submissionRows.map((row) => row.submitted_by))];
  const [{ data: students }, { data: members }, { data: files }] = await Promise.all([
    studentIds.length
      ? supabase.from("student_profiles").select("user_id, student_code, title, first_name, last_name").in("user_id", studentIds)
      : Promise.resolve({ data: [] }),
    submissionIds.length
      ? supabase.from("submission_members").select("id, submission_id, student_id, member_role, created_at").in("submission_id", submissionIds)
      : Promise.resolve({ data: [] }),
    submissionIds.length
      ? supabase.from("submission_files").select(FILE_SELECT).in("submission_id", submissionIds)
      : Promise.resolve({ data: [] }),
  ]);

  const memberRows = (members ?? []) as unknown as SubmissionMemberRow[];
  const allMemberIds = [...new Set(memberRows.map((row) => row.student_id))];
  const missingMemberIds = allMemberIds.filter((id) => !studentIds.includes(id));
  const { data: additionalStudents } = missingMemberIds.length
    ? await supabase.from("student_profiles").select("user_id, student_code, title, first_name, last_name").in("user_id", missingMemberIds)
    : { data: [] };
  const studentRows = [...(students ?? []), ...(additionalStudents ?? [])] as Array<Pick<StudentProfile, "user_id" | "student_code" | "title" | "first_name" | "last_name">>;
  const studentMap = new Map(studentRows.map((student) => [student.user_id, student]));
  const fileRows = (files ?? []) as unknown as SubmissionFileRow[];
  const signedFiles = await Promise.all(fileRows.map(async (item) => {
    const { data } = await supabase.storage.from("submission-files").createSignedUrl(item.storage_path, 3600);
    return { ...item, signed_url: data?.signedUrl ?? null };
  }));

  const detailedSubmissions: SubmissionWithStudent[] = submissionRows.map((submission) => {
    const student = studentMap.get(submission.submitted_by);
    return {
      ...submission,
      student_code: student?.student_code ?? "-",
      student_name: student ? formatStudentName(student) : "ไม่พบรายชื่อนักเรียน",
      members: memberRows
        .filter((member) => member.submission_id === submission.id)
        .map((member) => {
          const memberStudent = studentMap.get(member.student_id);
          return {
            student_id: member.student_id,
            student_code: memberStudent?.student_code ?? "-",
            student_name: memberStudent ? formatStudentName(memberStudent) : "ไม่พบรายชื่อ",
            member_role: member.member_role,
          };
        }),
      files: signedFiles.filter((file) => file.submission_id === submission.id),
    };
  });

  return {
    classRow,
    assignment: assignmentRow,
    roster,
    targets: (targets ?? []) as unknown as AssignmentTargetRow[],
    attachments: signedAttachments,
    submissions: detailedSubmissions,
  };
}

export async function getStudentAssignments(studentId: string): Promise<StudentAssignmentSummary[]> {
  const supabase = await createClient();
  const { data: assignments, error } = await supabase
    .from("assignments")
    .select(ASSIGNMENT_SELECT)
    .in("status", ["published", "closed"])
    .order("due_at", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  const assignmentRows = ((assignments ?? []) as unknown as AssignmentRow[]).filter(isOpenForStudent);
  if (!assignmentRows.length) return [];

  const assignmentIds = assignmentRows.map((row) => row.id);
  const classIds = [...new Set(assignmentRows.map((row) => row.class_id))];
  const [{ data: classes }, { data: submissions }] = await Promise.all([
    supabase.from("classes").select("id, teacher_id, class_code, subject_name, class_name").in("id", classIds),
    supabase.from("submissions").select(SUBMISSION_SELECT).in("assignment_id", assignmentIds),
  ]);
  const classRows = (classes ?? []) as Array<{ id: string; teacher_id: string; class_code: string; subject_name: string; class_name: string }>;
  const teacherIds = [...new Set(classRows.map((row) => row.teacher_id))];
  const { data: teachers } = teacherIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", teacherIds)
    : { data: [] };
  const classMap = new Map(classRows.map((row) => [row.id, row]));
  const teacherMap = new Map(((teachers ?? []) as Array<{ id: string; display_name: string }>).map((row) => [row.id, row.display_name]));
  const submissionRows = (submissions ?? []) as unknown as SubmissionRow[];

  return assignmentRows.map((assignment) => {
    const classRow = classMap.get(assignment.class_id)!;
    const submission = submissionRows.find((row) => row.assignment_id === assignment.id) ?? null;
    return {
      ...assignment,
      class_code: classRow?.class_code ?? "-",
      subject_name: classRow?.subject_name ?? "รายวิชา",
      class_name: classRow?.class_name ?? "ชั้นเรียน",
      teacher_name: teacherMap.get(classRow?.teacher_id) ?? "ครูผู้สอน",
      submission,
      display_status: getAssignmentDisplayStatus(submission),
    };
  });
}

export async function getStudentAssignment(studentId: string, assignmentId: string) {
  const assignments = await getStudentAssignments(studentId);
  const assignment = assignments.find((row) => row.id === assignmentId);
  if (!assignment) notFound();
  const supabase = await createClient();

  const [{ data: attachments }, { data: submission }] = await Promise.all([
    supabase.from("assignment_attachments").select(ATTACHMENT_SELECT).eq("assignment_id", assignmentId).order("created_at"),
    supabase.from("submissions").select(SUBMISSION_SELECT).eq("assignment_id", assignmentId).maybeSingle(),
  ]);
  const attachmentRows = (attachments ?? []) as unknown as AssignmentAttachmentRow[];
  const signedAttachments = await Promise.all(attachmentRows.map(async (item) => {
    if (!item.storage_path) return item;
    const { data } = await supabase.storage.from("assignment-files").createSignedUrl(item.storage_path, 3600);
    return { ...item, signed_url: data?.signedUrl ?? null };
  }));

  const submissionRow = (submission ?? null) as unknown as SubmissionRow | null;
  let members: SubmissionMemberRow[] = [];
  let files: SubmissionFileRow[] = [];
  if (submissionRow) {
    const [{ data: memberData }, { data: fileData }] = await Promise.all([
      supabase.from("submission_members").select("id, submission_id, student_id, member_role, created_at").eq("submission_id", submissionRow.id),
      supabase.from("submission_files").select(FILE_SELECT).eq("submission_id", submissionRow.id).order("created_at"),
    ]);
    members = (memberData ?? []) as unknown as SubmissionMemberRow[];
    const rawFiles = (fileData ?? []) as unknown as SubmissionFileRow[];
    files = await Promise.all(rawFiles.map(async (item) => {
      const { data } = await supabase.storage.from("submission-files").createSignedUrl(item.storage_path, 3600);
      return { ...item, signed_url: data?.signedUrl ?? null };
    }));
  }

  let groupMembers: RosterStudent[] = [];
  if (assignment.work_type === "group") {
    groupMembers = await getStudentClassRosterForAssignment(studentId, assignment.class_id);
  }

  return { assignment, attachments: signedAttachments, submission: submissionRow, members, files, groupMembers };
}

async function getStudentClassRosterForAssignment(studentId: string, classId: string): Promise<RosterStudent[]> {
  const supabase = await createClient();
  const { data: ownEnrollment } = await supabase
    .from("enrollments")
    .select("group_name")
    .eq("class_id", classId)
    .eq("student_id", studentId)
    .eq("status", "active")
    .single();
  if (!ownEnrollment?.group_name) return [];
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, class_id, student_id, student_number, group_name, status, enrolled_at, updated_at")
    .eq("class_id", classId)
    .eq("group_name", ownEnrollment.group_name)
    .eq("status", "active");
  const rows = (enrollments ?? []) as unknown as import("@/lib/types").EnrollmentRow[];
  const ids = rows.map((row) => row.student_id);
  if (!ids.length) return [];
  const { data: students } = await supabase
    .from("student_profiles")
    .select("user_id, student_code, title, first_name, last_name, nickname, level, room, student_number, created_at, updated_at")
    .in("user_id", ids);
  const map = new Map(((students ?? []) as unknown as StudentProfile[]).map((row) => [row.user_id, row]));
  return rows.map((enrollment) => {
    const student = map.get(enrollment.student_id)!;
    return {
      ...student,
      enrollment_id: enrollment.id,
      enrollment_number: enrollment.student_number,
      group_name: enrollment.group_name,
      enrollment_status: enrollment.status,
      display_name: formatStudentName(student),
    };
  });
}

export async function getAssignmentClass(teacherId: string, classId: string): Promise<ClassRow> {
  return getTeacherClass(teacherId, classId);
}
