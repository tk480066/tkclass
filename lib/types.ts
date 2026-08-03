export type AppRole = "admin" | "teacher" | "student";

export type Profile = {
  id: string;
  role: AppRole;
  display_name: string;
  avatar_path: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};

export type AuthUserWithProfile = {
  id: string;
  email: string | null;
  profile: Profile;
};

export type ContentStatus = "draft" | "published" | "archived";
export type LessonBlockType = "text" | "image" | "video" | "file" | "link" | "activity";
export type LessonProgressStatus = "not_started" | "in_progress" | "completed";

export type ClassRow = {
  id: string;
  teacher_id: string;
  class_code: string;
  subject_name: string;
  class_name: string;
  level: string | null;
  room: string | null;
  semester: number | null;
  academic_year: number | null;
  description: string | null;
  status: "active" | "inactive" | "archived";
  online_meeting_url: string | null;
  cover_path: string | null;
  course_color: string | null;
  syllabus: string | null;
  created_at: string;
  updated_at: string;
};

export type StudentProfile = {
  user_id: string;
  student_code: string;
  title: string | null;
  first_name: string;
  last_name: string;
  nickname: string | null;
  level: string | null;
  room: string | null;
  student_number: number | null;
  created_at: string;
  updated_at: string;
};

export type EnrollmentRow = {
  id: string;
  class_id: string;
  student_id: string;
  student_number: number | null;
  group_name: string | null;
  status: "active" | "inactive";
  enrolled_at: string;
  updated_at: string;
};

export type RosterStudent = StudentProfile & {
  enrollment_id: string;
  enrollment_number: number | null;
  group_name: string | null;
  enrollment_status: "active" | "inactive";
  display_name: string;
};

export type UnitRow = {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  objectives: string | null;
  order_no: number;
  status: ContentStatus;
  publish_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LessonRow = {
  id: string;
  unit_id: string;
  title: string;
  summary: string | null;
  objectives: string | null;
  order_no: number;
  estimated_minutes: number;
  status: ContentStatus;
  publish_at: string | null;
  cover_path: string | null;
  created_at: string;
  updated_at: string;
};

export type LessonBlockRow = {
  id: string;
  lesson_id: string;
  block_type: LessonBlockType;
  title: string | null;
  body: string | null;
  external_url: string | null;
  storage_path: string | null;
  metadata: Record<string, unknown>;
  order_no: number;
  is_required: boolean;
  created_at: string;
  updated_at: string;
  signed_url?: string | null;
};

export type LessonProgressRow = {
  id: string;
  lesson_id: string;
  student_id: string;
  status: LessonProgressStatus;
  progress_percent: number;
  started_at: string | null;
  completed_at: string | null;
  last_viewed_at: string;
  updated_at: string;
};

export type LessonResponseRow = {
  id: string;
  lesson_block_id: string;
  student_id: string;
  response_text: string | null;
  response_json: Record<string, unknown>;
  submitted_at: string;
  updated_at: string;
};

export type ClassSummary = ClassRow & {
  student_count: number;
  unit_count: number;
  lesson_count: number;
  published_lesson_count: number;
};

export type UnitWithLessons = UnitRow & {
  lessons: LessonRow[];
};

export type StudentCourseSummary = ClassRow & {
  teacher_name: string;
  unit_count: number;
  lesson_count: number;
  completed_lessons: number;
  progress_percent: number;
};
