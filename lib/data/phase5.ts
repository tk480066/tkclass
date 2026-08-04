import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClassRoster, getStudentCourses, getTeacherClass, getTeacherClassSummaries } from "@/lib/data/phase2";
import type {
  AttendanceRecordRow,
  AttendanceRosterRow,
  AttendanceSessionRow,
  AttendanceSessionSummary,
  ClassRow,
  GradeCategoryRow,
  GradeEntryRow,
  GradeItemRow,
  GradeSettingsRow,
  GradebookItem,
  GradebookStudentRow,
  StudentAttendanceItem,
  StudentCourseGrade,
  TeacherGradebookPayload,
} from "@/lib/types";

const ATTENDANCE_SESSION_SELECT = "id, class_id, title, session_date, period_label, opens_at, closes_at, late_after_minutes, allow_self_checkin, check_in_code, status, note, created_by, created_at, updated_at";
const ATTENDANCE_RECORD_SELECT = "id, session_id, student_id, status, checked_in_at, check_in_method, note, marked_by, created_at, updated_at";
const GRADE_CATEGORY_SELECT = "id, class_id, name, weight_percent, order_no, is_active, created_at, updated_at";
const GRADE_SETTINGS_SELECT = "class_id, calculation_method, publish_final_grade, minimum_attendance_percent, grade_scale, created_at, updated_at";
const GRADE_ITEM_SELECT = "id, class_id, category_id, source_type, source_id, title, description, max_score, item_weight, status, due_at, order_no, created_at, updated_at";
const GRADE_ENTRY_SELECT = "id, grade_item_id, student_id, score, is_excused, feedback, graded_by, graded_at, created_at, updated_at";

const DEFAULT_GRADE_SCALE = [
  { grade: "4", min: 80 },
  { grade: "3.5", min: 75 },
  { grade: "3", min: 70 },
  { grade: "2.5", min: 65 },
  { grade: "2", min: 60 },
  { grade: "1.5", min: 55 },
  { grade: "1", min: 50 },
  { grade: "0", min: 0 },
];

function asNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function defaultSettings(classId: string): GradeSettingsRow {
  return {
    class_id: classId,
    calculation_method: "weighted_categories",
    publish_final_grade: false,
    minimum_attendance_percent: 80,
    grade_scale: DEFAULT_GRADE_SCALE,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  };
}

function normalizeSettings(row: GradeSettingsRow | null | undefined, classId: string): GradeSettingsRow {
  if (!row) return defaultSettings(classId);
  const scale = Array.isArray(row.grade_scale) && row.grade_scale.length
    ? row.grade_scale.map((item) => ({ grade: String(item.grade), min: asNumber(item.min) })).sort((a, b) => b.min - a.min)
    : DEFAULT_GRADE_SCALE;
  return {
    ...row,
    minimum_attendance_percent: asNumber(row.minimum_attendance_percent, 80),
    grade_scale: scale,
  };
}

function gradeFromPercent(percent: number | null, scale: Array<{ grade: string; min: number }>) {
  if (percent === null) return null;
  const sorted = [...scale].sort((a, b) => b.min - a.min);
  return sorted.find((item) => percent >= item.min)?.grade ?? sorted.at(-1)?.grade ?? "0";
}

function summarizeAttendance(records: AttendanceRecordRow[], sessionIds: string[]) {
  const relevant = records.filter((record) => sessionIds.includes(record.session_id));
  const attended = relevant.filter((record) => ["present", "late", "activity"].includes(record.status)).length;
  return sessionIds.length ? round((attended / sessionIds.length) * 100, 1) : null;
}

function countAttendance(records: AttendanceRecordRow[]) {
  const counts = { present: 0, late: 0, absent: 0, leave: 0, unmarked: 0 };
  for (const record of records) {
    if (record.status === "present" || record.status === "activity") counts.present += 1;
    else if (record.status === "late") counts.late += 1;
    else if (record.status === "absent") counts.absent += 1;
    else if (record.status === "leave" || record.status === "sick") counts.leave += 1;
    else counts.unmarked += 1;
  }
  return counts;
}

export async function getTeacherAttendanceDashboard(teacherId: string) {
  const classes = await getTeacherClassSummaries(teacherId);
  const classIds = classes.map((row) => row.id);
  if (!classIds.length) {
    return { classes, sessions: [] as AttendanceSessionSummary[], metrics: { today: 0, open: 0, closed: 0, unmarked: 0 } };
  }

  const supabase = await createClient();
  const { data: sessions, error } = await supabase
    .from("attendance_sessions")
    .select(ATTENDANCE_SESSION_SELECT)
    .in("class_id", classIds)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(80);
  if (error) throw new Error(error.message);

  const sessionRows = (sessions ?? []) as unknown as AttendanceSessionRow[];
  const sessionIds = sessionRows.map((row) => row.id);
  const { data: records, error: recordError } = sessionIds.length
    ? await supabase.from("attendance_records").select(ATTENDANCE_RECORD_SELECT).in("session_id", sessionIds)
    : { data: [] as AttendanceRecordRow[], error: null };
  if (recordError) throw new Error(recordError.message);

  const recordRows = (records ?? []) as unknown as AttendanceRecordRow[];
  const classMap = new Map(classes.map((row) => [row.id, row]));
  const sessionsWithSummary = sessionRows.map((session) => {
    const classRow = classMap.get(session.class_id);
    const sessionRecords = recordRows.filter((record) => record.session_id === session.id);
    const counts = countAttendance(sessionRecords);
    return {
      ...session,
      class_code: classRow?.class_code ?? "-",
      subject_name: classRow?.subject_name ?? "-",
      class_name: classRow?.class_name ?? "-",
      student_count: classRow?.student_count ?? sessionRecords.length,
      present_count: counts.present,
      late_count: counts.late,
      absent_count: counts.absent,
      leave_count: counts.leave,
      unmarked_count: counts.unmarked,
    } satisfies AttendanceSessionSummary;
  });

  const today = new Date().toISOString().slice(0, 10);
  return {
    classes,
    sessions: sessionsWithSummary,
    metrics: {
      today: sessionsWithSummary.filter((row) => row.session_date === today).length,
      open: sessionsWithSummary.filter((row) => row.status === "open").length,
      closed: sessionsWithSummary.filter((row) => row.status === "closed").length,
      unmarked: sessionsWithSummary.reduce((sum, row) => sum + row.unmarked_count, 0),
    },
  };
}

export async function getClassAttendanceOverview(teacherId: string, classId: string) {
  const [classRow, roster] = await Promise.all([getTeacherClass(teacherId, classId), getClassRoster(teacherId, classId)]);
  const supabase = await createClient();
  const { data: sessions, error } = await supabase
    .from("attendance_sessions")
    .select(ATTENDANCE_SESSION_SELECT)
    .eq("class_id", classId)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const sessionRows = (sessions ?? []) as unknown as AttendanceSessionRow[];
  const sessionIds = sessionRows.map((row) => row.id);
  const { data: records, error: recordError } = sessionIds.length
    ? await supabase.from("attendance_records").select(ATTENDANCE_RECORD_SELECT).in("session_id", sessionIds)
    : { data: [] as AttendanceRecordRow[], error: null };
  if (recordError) throw new Error(recordError.message);
  const recordRows = (records ?? []) as unknown as AttendanceRecordRow[];

  const summaries = sessionRows.map((session) => {
    const counts = countAttendance(recordRows.filter((record) => record.session_id === session.id));
    return {
      ...session,
      class_code: classRow.class_code,
      subject_name: classRow.subject_name,
      class_name: classRow.class_name,
      student_count: roster.filter((student) => student.enrollment_status === "active").length,
      present_count: counts.present,
      late_count: counts.late,
      absent_count: counts.absent,
      leave_count: counts.leave,
      unmarked_count: counts.unmarked,
    } satisfies AttendanceSessionSummary;
  });

  return { classRow, roster, sessions: summaries };
}

export async function getAttendanceSessionDetail(teacherId: string, sessionId: string) {
  const supabase = await createClient();
  const { data: session, error } = await supabase
    .from("attendance_sessions")
    .select(ATTENDANCE_SESSION_SELECT)
    .eq("id", sessionId)
    .single();
  if (error || !session) notFound();
  const sessionRow = session as unknown as AttendanceSessionRow;
  const classRow = await getTeacherClass(teacherId, sessionRow.class_id);
  await supabase.rpc("ensure_attendance_records", { target_session_id: sessionId });
  const roster = await getClassRoster(teacherId, sessionRow.class_id);
  const { data: records, error: recordError } = await supabase
    .from("attendance_records")
    .select(ATTENDANCE_RECORD_SELECT)
    .eq("session_id", sessionId);
  if (recordError) throw new Error(recordError.message);
  const recordMap = new Map(((records ?? []) as unknown as AttendanceRecordRow[]).map((row) => [row.student_id, row]));
  const rosterRows: AttendanceRosterRow[] = roster
    .filter((student) => student.enrollment_status === "active")
    .map((student) => ({ ...student, record: recordMap.get(student.user_id) ?? null }));
  return { classRow, session: sessionRow, roster: rosterRows };
}

export async function getStudentAttendance(studentId: string) {
  const courses = await getStudentCourses(studentId);
  const classIds = courses.map((row) => row.id);
  if (!classIds.length) return { items: [] as StudentAttendanceItem[], overallPercent: null as number | null, totalSessions: 0, attendedSessions: 0 };

  const supabase = await createClient();
  const { data: sessions, error } = await supabase
    .from("attendance_sessions")
    .select(ATTENDANCE_SESSION_SELECT)
    .in("class_id", classIds)
    .in("status", ["open", "closed", "cancelled"])
    .order("session_date", { ascending: false });
  if (error) throw new Error(error.message);
  const sessionRows = (sessions ?? []) as unknown as AttendanceSessionRow[];
  const sessionIds = sessionRows.map((row) => row.id);
  const { data: records, error: recordError } = sessionIds.length
    ? await supabase
        .from("attendance_records")
        .select(ATTENDANCE_RECORD_SELECT)
        .eq("student_id", studentId)
        .in("session_id", sessionIds)
    : { data: [] as AttendanceRecordRow[], error: null };
  if (recordError) throw new Error(recordError.message);
  const recordRows = (records ?? []) as unknown as AttendanceRecordRow[];
  const recordMap = new Map(recordRows.map((row) => [row.session_id, row]));
  const courseMap = new Map(courses.map((row) => [row.id, row]));

  const items = sessionRows.map((session) => {
    const course = courseMap.get(session.class_id);
    return {
      ...session,
      class_code: course?.class_code ?? "-",
      subject_name: course?.subject_name ?? "-",
      class_name: course?.class_name ?? "-",
      teacher_name: course?.teacher_name ?? "-",
      record: recordMap.get(session.id) ?? null,
    } satisfies StudentAttendanceItem;
  });
  const closedIds = sessionRows.filter((row) => row.status === "closed").map((row) => row.id);
  const attendedSessions = recordRows.filter((record) => closedIds.includes(record.session_id) && ["present", "late", "activity"].includes(record.status)).length;
  return {
    items,
    overallPercent: closedIds.length ? round((attendedSessions / closedIds.length) * 100, 1) : null,
    totalSessions: closedIds.length,
    attendedSessions,
  };
}

function scoreKey(itemId: string, studentId: string) {
  return `${itemId}:${studentId}`;
}

async function loadSourceScores(
  classId: string,
  items: GradeItemRow[],
  studentIds: string[],
) {
  const supabase = await createClient();
  const scores = new Map<string, number | null>();
  if (!studentIds.length) return { scores, entries: [] as GradeEntryRow[] };

  const assignmentItems = items.filter((item) => item.source_type === "assignment" && item.source_id);
  const assignmentIds = assignmentItems.map((item) => item.source_id as string);
  if (assignmentIds.length) {
    const { data: submissions, error } = await supabase
      .from("submissions")
      .select("id, assignment_id, submitted_by, score, status")
      .in("assignment_id", assignmentIds)
      .not("score", "is", null);
    if (error) throw new Error(error.message);
    const submissionRows = (submissions ?? []) as Array<{ id: string; assignment_id: string; submitted_by: string; score: number | string | null; status: string }>;
    const submissionIds = submissionRows.map((row) => row.id);
    const { data: members, error: memberError } = submissionIds.length
      ? await supabase.from("submission_members").select("submission_id, student_id").in("submission_id", submissionIds)
      : { data: [] as Array<{ submission_id: string; student_id: string }>, error: null };
    if (memberError) throw new Error(memberError.message);
    const membersBySubmission = new Map<string, string[]>();
    for (const member of members ?? []) {
      const list = membersBySubmission.get(member.submission_id) ?? [];
      list.push(member.student_id);
      membersBySubmission.set(member.submission_id, list);
    }
    const itemBySource = new Map(assignmentItems.map((item) => [item.source_id as string, item]));
    for (const submission of submissionRows) {
      const item = itemBySource.get(submission.assignment_id);
      if (!item || submission.score === null) continue;
      const targets = new Set([submission.submitted_by, ...(membersBySubmission.get(submission.id) ?? [])]);
      for (const studentId of targets) {
        if (!studentIds.includes(studentId)) continue;
        scores.set(scoreKey(item.id, studentId), asNumber(submission.score));
      }
    }
  }

  const quizItems = items.filter((item) => item.source_type === "quiz" && item.source_id);
  const quizIds = quizItems.map((item) => item.source_id as string);
  if (quizIds.length) {
    const { data: attempts, error } = await supabase
      .from("quiz_attempts")
      .select("quiz_id, student_id, score, status")
      .in("quiz_id", quizIds)
      .in("student_id", studentIds)
      .not("score", "is", null);
    if (error) throw new Error(error.message);
    const itemBySource = new Map(quizItems.map((item) => [item.source_id as string, item]));
    for (const attempt of attempts ?? []) {
      const item = itemBySource.get(attempt.quiz_id);
      if (!item || attempt.score === null) continue;
      const key = scoreKey(item.id, attempt.student_id);
      const nextScore = asNumber(attempt.score);
      const current = scores.get(key);
      if (current === undefined || current === null || nextScore > current) scores.set(key, nextScore);
    }
  }

  const itemIds = items.map((item) => item.id);
  const { data: entries, error: entryError } = itemIds.length
    ? await supabase
        .from("grade_entries")
        .select(GRADE_ENTRY_SELECT)
        .in("grade_item_id", itemIds)
        .in("student_id", studentIds)
    : { data: [] as GradeEntryRow[], error: null };
  if (entryError) throw new Error(entryError.message);
  const entryRows = (entries ?? []) as unknown as GradeEntryRow[];
  for (const entry of entryRows) {
    if (entry.is_excused) scores.set(scoreKey(entry.grade_item_id, entry.student_id), null);
    else if (entry.score !== null) scores.set(scoreKey(entry.grade_item_id, entry.student_id), asNumber(entry.score));
  }

  return { scores, entries: entryRows };
}

function calculateStudentGrade(
  studentId: string,
  categories: GradeCategoryRow[],
  items: GradebookItem[],
  scoreMap: Map<string, number | null>,
  settings: GradeSettingsRow,
) {
  const scores: Record<string, number | null> = {};
  for (const item of items) scores[item.id] = scoreMap.get(scoreKey(item.id, studentId)) ?? null;

  const categoryPercentages: Record<string, number | null> = {};
  for (const category of categories) {
    const categoryItems = items.filter((item) => item.category_id === category.id && item.status !== "archived");
    let weightedEarned = 0;
    let totalWeight = 0;
    for (const item of categoryItems) {
      const score = scores[item.id];
      if (score === null || score === undefined) continue;
      weightedEarned += (score / asNumber(item.max_score, 1)) * asNumber(item.item_weight, 1);
      totalWeight += asNumber(item.item_weight, 1);
    }
    categoryPercentages[category.id] = totalWeight ? round((weightedEarned / totalWeight) * 100) : null;
  }

  let totalPercent: number | null = null;
  if (settings.calculation_method === "total_points") {
    let earned = 0;
    let possible = 0;
    for (const item of items) {
      const score = scores[item.id];
      if (score === null || score === undefined) continue;
      earned += score;
      possible += asNumber(item.max_score, 1);
    }
    totalPercent = possible ? round((earned / possible) * 100) : null;
  } else {
    let weightedTotal = 0;
    let activeWeight = 0;
    for (const category of categories.filter((row) => row.is_active)) {
      const percent = categoryPercentages[category.id];
      if (percent === null || percent === undefined) continue;
      weightedTotal += percent * asNumber(category.weight_percent);
      activeWeight += asNumber(category.weight_percent);
    }
    totalPercent = activeWeight ? round(weightedTotal / activeWeight) : null;
  }

  return {
    scores,
    categoryPercentages,
    totalPercent,
    letterGrade: gradeFromPercent(totalPercent, settings.grade_scale),
  };
}

async function attendancePercentByStudent(classId: string, studentIds: string[]) {
  if (!studentIds.length) return new Map<string, number | null>();
  const supabase = await createClient();
  const { data: sessions, error } = await supabase
    .from("attendance_sessions")
    .select("id")
    .eq("class_id", classId)
    .eq("status", "closed");
  if (error) throw new Error(error.message);
  const sessionIds = (sessions ?? []).map((row) => row.id);
  if (!sessionIds.length) return new Map(studentIds.map((id) => [id, null as number | null]));
  const { data: records, error: recordError } = await supabase
    .from("attendance_records")
    .select(ATTENDANCE_RECORD_SELECT)
    .in("session_id", sessionIds)
    .in("student_id", studentIds);
  if (recordError) throw new Error(recordError.message);
  const recordRows = (records ?? []) as unknown as AttendanceRecordRow[];
  return new Map(studentIds.map((id) => [id, summarizeAttendance(recordRows.filter((row) => row.student_id === id), sessionIds)]));
}

export async function getTeacherGradebook(teacherId: string, classId: string): Promise<TeacherGradebookPayload> {
  const [classRow, roster] = await Promise.all([getTeacherClass(teacherId, classId), getClassRoster(teacherId, classId)]);
  const supabase = await createClient();
  const { error: syncError } = await supabase.rpc("sync_gradebook_sources", { target_class_id: classId });
  if (syncError) throw new Error(syncError.message);

  const [{ data: categories, error: categoryError }, { data: settings, error: settingsError }, { data: items, error: itemError }] = await Promise.all([
    supabase.from("grade_categories").select(GRADE_CATEGORY_SELECT).eq("class_id", classId).order("order_no"),
    supabase.from("grade_settings").select(GRADE_SETTINGS_SELECT).eq("class_id", classId).maybeSingle(),
    supabase.from("grade_items").select(GRADE_ITEM_SELECT).eq("class_id", classId).neq("status", "archived").order("order_no"),
  ]);
  if (categoryError) throw new Error(categoryError.message);
  if (settingsError) throw new Error(settingsError.message);
  if (itemError) throw new Error(itemError.message);

  const categoryRows = ((categories ?? []) as unknown as GradeCategoryRow[]).map((row) => ({ ...row, weight_percent: asNumber(row.weight_percent) }));
  const settingsRow = normalizeSettings(settings as unknown as GradeSettingsRow | null, classId);
  const itemRows = ((items ?? []) as unknown as GradeItemRow[]).map((row) => ({ ...row, max_score: asNumber(row.max_score), item_weight: asNumber(row.item_weight, 1) }));
  const categoryMap = new Map(categoryRows.map((row) => [row.id, row.name]));
  const gradebookItems: GradebookItem[] = itemRows.map((item) => ({ ...item, category_name: item.category_id ? categoryMap.get(item.category_id) ?? "ไม่ระบุหมวด" : "ไม่ระบุหมวด" }));
  const activeRoster = roster.filter((student) => student.enrollment_status === "active");
  const studentIds = activeRoster.map((student) => student.user_id);
  const [{ scores, entries }, attendanceMap] = await Promise.all([
    loadSourceScores(classId, itemRows, studentIds),
    attendancePercentByStudent(classId, studentIds),
  ]);

  const students: GradebookStudentRow[] = activeRoster.map((student) => {
    const calculated = calculateStudentGrade(student.user_id, categoryRows, gradebookItems, scores, settingsRow);
    return {
      student_id: student.user_id,
      student_code: student.student_code,
      student_name: student.display_name,
      student_number: student.enrollment_number,
      scores: calculated.scores,
      category_percentages: calculated.categoryPercentages,
      total_percent: calculated.totalPercent,
      letter_grade: calculated.letterGrade,
      attendance_percent: attendanceMap.get(student.user_id) ?? null,
    };
  });

  return { classRow, categories: categoryRows, settings: settingsRow, items: gradebookItems, students, gradeEntries: entries };
}

export async function getTeacherGradebookDashboard(teacherId: string) {
  const classes = await getTeacherClassSummaries(teacherId);
  const supabase = await createClient();
  const classIds = classes.map((row) => row.id);
  const { data: settings } = classIds.length
    ? await supabase.from("grade_settings").select("class_id, publish_final_grade").in("class_id", classIds)
    : { data: [] as Array<{ class_id: string; publish_final_grade: boolean }> };
  const publishedMap = new Map((settings ?? []).map((row) => [row.class_id, row.publish_final_grade]));
  return {
    classes: classes.map((row) => ({ ...row, final_grade_published: publishedMap.get(row.id) ?? false })),
  };
}

export async function getStudentGrades(studentId: string): Promise<StudentCourseGrade[]> {
  const courses = await getStudentCourses(studentId);
  if (!courses.length) return [];
  const supabase = await createClient();
  const classIds = courses.map((row) => row.id);
  const [{ data: categories, error: categoryError }, { data: settings, error: settingsError }, { data: items, error: itemError }] = await Promise.all([
    supabase.from("grade_categories").select(GRADE_CATEGORY_SELECT).in("class_id", classIds).eq("is_active", true).order("order_no"),
    supabase.from("grade_settings").select(GRADE_SETTINGS_SELECT).in("class_id", classIds),
    supabase.from("grade_items").select(GRADE_ITEM_SELECT).in("class_id", classIds).eq("status", "published").order("order_no"),
  ]);
  if (categoryError) throw new Error(categoryError.message);
  if (settingsError) throw new Error(settingsError.message);
  if (itemError) throw new Error(itemError.message);

  const categoryRows = ((categories ?? []) as unknown as GradeCategoryRow[]).map((row) => ({ ...row, weight_percent: asNumber(row.weight_percent) }));
  const settingRows = (settings ?? []) as unknown as GradeSettingsRow[];
  const itemRows = ((items ?? []) as unknown as GradeItemRow[]).map((row) => ({ ...row, max_score: asNumber(row.max_score), item_weight: asNumber(row.item_weight, 1) }));
  const { scores, entries } = await loadSourceScores("", itemRows, [studentId]);
  const entryMap = new Map(entries.map((entry) => [entry.grade_item_id, entry]));
  const attendanceMaps = await Promise.all(classIds.map(async (classId) => [classId, await attendancePercentByStudent(classId, [studentId])] as const));
  const attendanceByClass = new Map(attendanceMaps.map(([classId, map]) => [classId, map.get(studentId) ?? null]));

  return courses.map((course) => {
    const courseCategories = categoryRows.filter((row) => row.class_id === course.id);
    const settingsRow = normalizeSettings(settingRows.find((row) => row.class_id === course.id), course.id);
    const courseItems: GradebookItem[] = itemRows
      .filter((row) => row.class_id === course.id)
      .map((item) => ({ ...item, category_name: courseCategories.find((category) => category.id === item.category_id)?.name ?? "ไม่ระบุหมวด" }));
    const calculated = calculateStudentGrade(studentId, courseCategories, courseItems, scores, settingsRow);
    return {
      class_id: course.id,
      class_code: course.class_code,
      subject_name: course.subject_name,
      class_name: course.class_name,
      teacher_name: course.teacher_name,
      calculation_method: settingsRow.calculation_method,
      publish_final_grade: settingsRow.publish_final_grade,
      total_percent: settingsRow.publish_final_grade ? calculated.totalPercent : null,
      letter_grade: settingsRow.publish_final_grade ? calculated.letterGrade : null,
      attendance_percent: attendanceByClass.get(course.id) ?? null,
      minimum_attendance_percent: settingsRow.minimum_attendance_percent,
      categories: courseCategories.map((category) => ({
        id: category.id,
        name: category.name,
        weight_percent: category.weight_percent,
        percent: calculated.categoryPercentages[category.id] ?? null,
      })),
      items: courseItems.map((item) => ({
        id: item.id,
        title: item.title,
        category_name: item.category_name,
        source_type: item.source_type,
        score: calculated.scores[item.id] ?? null,
        max_score: item.max_score,
        feedback: entryMap.get(item.id)?.feedback ?? null,
      })),
    } satisfies StudentCourseGrade;
  });
}
