import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  ClassRow,
  ClassSummary,
  EnrollmentRow,
  LessonBlockRow,
  LessonProgressRow,
  LessonResponseRow,
  LessonRow,
  RosterStudent,
  StudentCourseSummary,
  StudentProfile,
  UnitRow,
  UnitWithLessons,
} from "@/lib/types";

const CLASS_SELECT = "id, teacher_id, class_code, subject_name, class_name, level, room, semester, academic_year, description, status, online_meeting_url, cover_path, course_color, syllabus, created_at, updated_at";
const UNIT_SELECT = "id, class_id, title, description, objectives, order_no, status, publish_at, created_at, updated_at";
const LESSON_SELECT = "id, unit_id, title, summary, objectives, order_no, estimated_minutes, status, publish_at, cover_path, created_at, updated_at";
const BLOCK_SELECT = "id, lesson_id, block_type, title, body, external_url, storage_path, metadata, order_no, is_required, created_at, updated_at";

export function formatStudentName(student: Pick<StudentProfile, "title" | "first_name" | "last_name">) {
  return [student.title, student.first_name, student.last_name].filter(Boolean).join(" ");
}

export async function getTeacherClassSummaries(teacherId: string): Promise<ClassSummary[]> {
  const supabase = await createClient();
  const { data: classes, error } = await supabase
    .from("classes")
    .select(CLASS_SELECT)
    .eq("teacher_id", teacherId)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  const classRows = (classes ?? []) as unknown as ClassRow[];
  if (!classRows.length) return [];

  const classIds = classRows.map((row) => row.id);
  const [{ data: enrollments }, { data: units }] = await Promise.all([
    supabase.from("enrollments").select("class_id").in("class_id", classIds).eq("status", "active"),
    supabase.from("units").select("id, class_id").in("class_id", classIds),
  ]);

  const unitRows = (units ?? []) as Array<{ id: string; class_id: string }>;
  const unitIds = unitRows.map((row) => row.id);
  const { data: lessons } = unitIds.length
    ? await supabase.from("lessons").select("id, unit_id, status").in("unit_id", unitIds)
    : { data: [] as Array<{ id: string; unit_id: string; status: string }> };

  const enrollmentCount = new Map<string, number>();
  for (const row of enrollments ?? []) {
    enrollmentCount.set(row.class_id, (enrollmentCount.get(row.class_id) ?? 0) + 1);
  }

  const unitsByClass = new Map<string, string[]>();
  for (const row of unitRows) {
    const list = unitsByClass.get(row.class_id) ?? [];
    list.push(row.id);
    unitsByClass.set(row.class_id, list);
  }

  const lessonsByUnit = new Map<string, Array<{ status: string }>>();
  for (const row of lessons ?? []) {
    const list = lessonsByUnit.get(row.unit_id) ?? [];
    list.push({ status: row.status });
    lessonsByUnit.set(row.unit_id, list);
  }

  return classRows.map((classRow) => {
    const unitIdsForClass = unitsByClass.get(classRow.id) ?? [];
    const lessonRows = unitIdsForClass.flatMap((unitId) => lessonsByUnit.get(unitId) ?? []);
    return {
      ...classRow,
      student_count: enrollmentCount.get(classRow.id) ?? 0,
      unit_count: unitIdsForClass.length,
      lesson_count: lessonRows.length,
      published_lesson_count: lessonRows.filter((lesson) => lesson.status === "published").length,
    };
  });
}

export async function getTeacherClass(teacherId: string, classId: string): Promise<ClassRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .select(CLASS_SELECT)
    .eq("id", classId)
    .eq("teacher_id", teacherId)
    .single();

  if (error || !data) notFound();
  return data as unknown as ClassRow;
}

export async function getClassRoster(teacherId: string, classId: string): Promise<RosterStudent[]> {
  await getTeacherClass(teacherId, classId);
  const supabase = await createClient();
  const { data: enrollments, error } = await supabase
    .from("enrollments")
    .select("id, class_id, student_id, student_number, group_name, status, enrolled_at, updated_at")
    .eq("class_id", classId)
    .order("student_number", { ascending: true });

  if (error) throw new Error(error.message);
  const enrollmentRows = (enrollments ?? []) as unknown as EnrollmentRow[];
  const studentIds = enrollmentRows.map((row) => row.student_id);
  if (!studentIds.length) return [];

  const { data: students, error: studentError } = await supabase
    .from("student_profiles")
    .select("user_id, student_code, title, first_name, last_name, nickname, level, room, student_number, created_at, updated_at")
    .in("user_id", studentIds);

  if (studentError) throw new Error(studentError.message);
  const studentMap = new Map(
    ((students ?? []) as unknown as StudentProfile[]).map((student) => [student.user_id, student]),
  );

  return enrollmentRows
    .map((enrollment) => {
      const student = studentMap.get(enrollment.student_id);
      if (!student) return null;
      return {
        ...student,
        enrollment_id: enrollment.id,
        enrollment_number: enrollment.student_number,
        group_name: enrollment.group_name,
        enrollment_status: enrollment.status,
        display_name: formatStudentName(student),
      } satisfies RosterStudent;
    })
    .filter((row): row is RosterStudent => Boolean(row));
}

export async function getClassCurriculum(teacherId: string, classId: string): Promise<UnitWithLessons[]> {
  await getTeacherClass(teacherId, classId);
  const supabase = await createClient();
  const { data: units, error } = await supabase
    .from("units")
    .select(UNIT_SELECT)
    .eq("class_id", classId)
    .order("order_no", { ascending: true });

  if (error) throw new Error(error.message);
  const unitRows = (units ?? []) as unknown as UnitRow[];
  if (!unitRows.length) return [];

  const unitIds = unitRows.map((unit) => unit.id);
  const { data: lessons, error: lessonError } = await supabase
    .from("lessons")
    .select(LESSON_SELECT)
    .in("unit_id", unitIds)
    .order("order_no", { ascending: true });

  if (lessonError) throw new Error(lessonError.message);
  const lessonRows = (lessons ?? []) as unknown as LessonRow[];
  const grouped = new Map<string, LessonRow[]>();
  for (const lesson of lessonRows) {
    const list = grouped.get(lesson.unit_id) ?? [];
    list.push(lesson);
    grouped.set(lesson.unit_id, list);
  }

  return unitRows.map((unit) => ({ ...unit, lessons: grouped.get(unit.id) ?? [] }));
}

export async function getTeacherLessonEditor(teacherId: string, lessonId: string) {
  const supabase = await createClient();
  const { data: lesson, error } = await supabase
    .from("lessons")
    .select(LESSON_SELECT)
    .eq("id", lessonId)
    .single();

  if (error || !lesson) notFound();
  const lessonRow = lesson as unknown as LessonRow;
  const { data: unit, error: unitError } = await supabase
    .from("units")
    .select(UNIT_SELECT)
    .eq("id", lessonRow.unit_id)
    .single();
  if (unitError || !unit) notFound();

  const unitRow = unit as unknown as UnitRow;
  const classRow = await getTeacherClass(teacherId, unitRow.class_id);
  const { data: blocks, error: blockError } = await supabase
    .from("lesson_blocks")
    .select(BLOCK_SELECT)
    .eq("lesson_id", lessonId)
    .order("order_no", { ascending: true });
  if (blockError) throw new Error(blockError.message);

  return {
    classRow,
    unit: unitRow,
    lesson: lessonRow,
    blocks: (blocks ?? []) as unknown as LessonBlockRow[],
  };
}

export async function getStudentCourses(studentId: string): Promise<StudentCourseSummary[]> {
  const supabase = await createClient();
  const { data: enrollments, error } = await supabase
    .from("enrollments")
    .select("class_id")
    .eq("student_id", studentId)
    .eq("status", "active");

  if (error) throw new Error(error.message);
  const enrollmentClassRows = (enrollments ?? []) as Array<{ class_id: string }>;
  const classIds = enrollmentClassRows.map((row) => row.class_id);
  if (!classIds.length) return [];

  const { data: classes, error: classError } = await supabase
    .from("classes")
    .select(CLASS_SELECT)
    .in("id", classIds)
    .eq("status", "active")
    .order("subject_name", { ascending: true });
  if (classError) throw new Error(classError.message);
  const classRows = (classes ?? []) as unknown as ClassRow[];

  const teacherIds = [...new Set(classRows.map((row) => row.teacher_id))];
  const { data: teacherProfiles } = teacherIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", teacherIds)
    : { data: [] as Array<{ id: string; display_name: string }> };
  const teacherRows = (teacherProfiles ?? []) as Array<{ id: string; display_name: string }>;
  const teacherMap = new Map<string, string>(teacherRows.map((row) => [row.id, row.display_name]));

  const { data: units } = await supabase
    .from("units")
    .select("id, class_id")
    .in("class_id", classIds)
    .eq("status", "published");
  const unitRows = (units ?? []) as Array<{ id: string; class_id: string }>;
  const unitIds = unitRows.map((row) => row.id);

  const { data: lessons } = unitIds.length
    ? await supabase
        .from("lessons")
        .select("id, unit_id")
        .in("unit_id", unitIds)
        .eq("status", "published")
    : { data: [] as Array<{ id: string; unit_id: string }> };
  const lessonRows = (lessons ?? []) as Array<{ id: string; unit_id: string }>;
  const lessonIds = lessonRows.map((row) => row.id);

  const { data: progress } = lessonIds.length
    ? await supabase
        .from("lesson_progress")
        .select("lesson_id, status")
        .eq("student_id", studentId)
        .in("lesson_id", lessonIds)
    : { data: [] as Array<{ lesson_id: string; status: string }> };
  const progressRows = (progress ?? []) as Array<{ lesson_id: string; status: string }>;
  const completed = new Set(progressRows.filter((row) => row.status === "completed").map((row) => row.lesson_id));

  const unitClassMap = new Map(unitRows.map((row) => [row.id, row.class_id]));
  return classRows.map((classRow) => {
    const classUnitIds = unitRows.filter((unit) => unit.class_id === classRow.id).map((unit) => unit.id);
    const classLessons = lessonRows.filter((lesson) => unitClassMap.get(lesson.unit_id) === classRow.id);
    const completedLessons = classLessons.filter((lesson) => completed.has(lesson.id)).length;
    return {
      ...classRow,
      teacher_name: teacherMap.get(classRow.teacher_id) ?? "ครูผู้สอน",
      unit_count: classUnitIds.length,
      lesson_count: classLessons.length,
      completed_lessons: completedLessons,
      progress_percent: classLessons.length ? Math.round((completedLessons / classLessons.length) * 100) : 0,
    };
  });
}

export async function getStudentCourse(studentId: string, classId: string) {
  const courses = await getStudentCourses(studentId);
  const course = courses.find((row) => row.id === classId);
  if (!course) notFound();

  const supabase = await createClient();
  const { data: units, error } = await supabase
    .from("units")
    .select(UNIT_SELECT)
    .eq("class_id", classId)
    .eq("status", "published")
    .order("order_no", { ascending: true });
  if (error) throw new Error(error.message);
  const unitRows = (units ?? []) as unknown as UnitRow[];
  const unitIds = unitRows.map((unit) => unit.id);

  const { data: lessons, error: lessonError } = unitIds.length
    ? await supabase
        .from("lessons")
        .select(LESSON_SELECT)
        .in("unit_id", unitIds)
        .eq("status", "published")
        .order("order_no", { ascending: true })
    : { data: [] as LessonRow[], error: null };
  if (lessonError) throw new Error(lessonError.message);
  const lessonRows = (lessons ?? []) as unknown as LessonRow[];
  const lessonIds = lessonRows.map((lesson) => lesson.id);

  const { data: progress } = lessonIds.length
    ? await supabase
        .from("lesson_progress")
        .select("id, lesson_id, student_id, status, progress_percent, started_at, completed_at, last_viewed_at, updated_at")
        .eq("student_id", studentId)
        .in("lesson_id", lessonIds)
    : { data: [] as LessonProgressRow[] };
  const progressMap = new Map(
    ((progress ?? []) as unknown as LessonProgressRow[]).map((row) => [row.lesson_id, row]),
  );

  const grouped = new Map<string, Array<LessonRow & { progress: LessonProgressRow | null }>>();
  for (const lesson of lessonRows) {
    const list = grouped.get(lesson.unit_id) ?? [];
    list.push({ ...lesson, progress: progressMap.get(lesson.id) ?? null });
    grouped.set(lesson.unit_id, list);
  }

  return {
    course,
    units: unitRows.map((unit) => ({ ...unit, lessons: grouped.get(unit.id) ?? [] })),
  };
}

export async function getStudentLesson(studentId: string, lessonId: string) {
  const supabase = await createClient();
  const { data: lesson, error } = await supabase
    .from("lessons")
    .select(LESSON_SELECT)
    .eq("id", lessonId)
    .single();
  if (error || !lesson) notFound();
  const lessonRow = lesson as unknown as LessonRow;

  const { data: unit, error: unitError } = await supabase
    .from("units")
    .select(UNIT_SELECT)
    .eq("id", lessonRow.unit_id)
    .single();
  if (unitError || !unit) notFound();
  const unitRow = unit as unknown as UnitRow;

  const courseData = await getStudentCourse(studentId, unitRow.class_id);
  const { data: blocks, error: blockError } = await supabase
    .from("lesson_blocks")
    .select(BLOCK_SELECT)
    .eq("lesson_id", lessonId)
    .order("order_no", { ascending: true });
  if (blockError) throw new Error(blockError.message);

  const blockRows = (blocks ?? []) as unknown as LessonBlockRow[];
  const signedBlocks = await Promise.all(
    blockRows.map(async (block) => {
      if (!block.storage_path) return block;
      const { data } = await supabase.storage.from("course-content").createSignedUrl(block.storage_path, 3600);
      return { ...block, signed_url: data?.signedUrl ?? null };
    }),
  );

  const [{ data: progress }, { data: responses }] = await Promise.all([
    supabase
      .from("lesson_progress")
      .select("id, lesson_id, student_id, status, progress_percent, started_at, completed_at, last_viewed_at, updated_at")
      .eq("lesson_id", lessonId)
      .eq("student_id", studentId)
      .maybeSingle(),
    supabase
      .from("lesson_responses")
      .select("id, lesson_block_id, student_id, response_text, response_json, submitted_at, updated_at")
      .eq("student_id", studentId),
  ]);

  return {
    course: courseData.course,
    unit: unitRow,
    lesson: lessonRow,
    blocks: signedBlocks,
    progress: (progress ?? null) as unknown as LessonProgressRow | null,
    responses: (responses ?? []) as unknown as LessonResponseRow[],
  };
}
