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

export type AssignmentWorkType = "individual" | "group";
export type AssignmentStatus = "draft" | "published" | "closed" | "archived";
export type AssignmentTargetMode = "class" | "students" | "group";
export type SubmissionStatus = "draft" | "submitted" | "late" | "revision_required" | "graded" | "passed" | "failed" | "withdrawn";

export type AssignmentRow = {
  id: string;
  class_id: string;
  title: string;
  instructions: string | null;
  work_type: AssignmentWorkType;
  max_score: number;
  passing_score: number | null;
  publish_at: string | null;
  due_at: string | null;
  allow_late: boolean;
  allow_resubmit: boolean;
  target_mode: AssignmentTargetMode;
  target_group_name: string | null;
  allowed_submission_types: string[];
  status: AssignmentStatus;
  rubric_json: Array<Record<string, unknown>>;
  created_at: string;
  updated_at: string;
};

export type AssignmentTargetRow = {
  id: string;
  assignment_id: string;
  student_id: string | null;
  group_name: string | null;
  created_at: string;
};

export type AssignmentAttachmentRow = {
  id: string;
  assignment_id: string;
  storage_path: string | null;
  external_url: string | null;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
  signed_url?: string | null;
};

export type SubmissionRow = {
  id: string;
  assignment_id: string;
  submitted_by: string;
  group_name: string | null;
  answer_text: string | null;
  link_url: string | null;
  status: SubmissionStatus;
  submitted_at: string | null;
  withdrawn_at: string | null;
  revision_count: number;
  score: number | null;
  teacher_feedback: string | null;
  rubric_scores: Array<Record<string, unknown>>;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SubmissionMemberRow = {
  id: string;
  submission_id: string;
  student_id: string;
  member_role: "owner" | "member";
  created_at: string;
};

export type SubmissionFileRow = {
  id: string;
  submission_id: string;
  uploaded_by: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
  signed_url?: string | null;
};

export type TeacherAssignmentSummary = AssignmentRow & {
  class_code: string;
  subject_name: string;
  class_name: string;
  submission_count: number;
  pending_review_count: number;
  graded_count: number;
};

export type StudentAssignmentSummary = AssignmentRow & {
  class_code: string;
  subject_name: string;
  class_name: string;
  teacher_name: string;
  submission: SubmissionRow | null;
  display_status: "not_started" | SubmissionStatus;
};

export type SubmissionWithStudent = SubmissionRow & {
  student_code: string;
  student_name: string;
  members: Array<{ student_id: string; student_code: string; student_name: string; member_role: "owner" | "member" }>;
  files: SubmissionFileRow[];
};

export type QuizStatus = "draft" | "published" | "closed" | "archived";
export type QuizQuestionType = "single_choice" | "multiple_choice" | "true_false" | "short_answer" | "essay";
export type QuizAttemptStatus = "in_progress" | "submitted" | "graded" | "expired";

export type QuizRow = {
  id: string;
  class_id: string;
  lesson_id: string | null;
  title: string;
  instructions: string | null;
  status: QuizStatus;
  open_at: string | null;
  close_at: string | null;
  time_limit_minutes: number | null;
  max_attempts: number;
  passing_percent: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_score_after_submit: boolean;
  show_correct_answers: boolean;
  total_points: number;
  created_at: string;
  updated_at: string;
};

export type QuizQuestionRow = {
  id: string;
  quiz_id: string;
  question_type: QuizQuestionType;
  prompt: string;
  explanation: string | null;
  points: number;
  order_no: number;
  is_required: boolean;
  accepted_answers: string[];
  case_sensitive: boolean;
  created_at: string;
  updated_at: string;
};

export type QuizOptionRow = {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_no: number;
  created_at: string;
};

export type QuizQuestionWithOptions = QuizQuestionRow & {
  options: QuizOptionRow[];
};

export type QuizAttemptRow = {
  id: string;
  quiz_id: string;
  student_id: string;
  attempt_no: number;
  status: QuizAttemptStatus;
  started_at: string;
  expires_at: string | null;
  submitted_at: string | null;
  graded_at: string | null;
  score: number | null;
  max_score: number;
  percent: number | null;
  passed: boolean | null;
  question_order: string[];
  option_order: Record<string, string[]>;
  created_at: string;
  updated_at: string;
};

export type QuizAnswerRow = {
  id: string;
  attempt_id: string;
  question_id: string;
  answer_text: string | null;
  selected_option_ids: string[];
  answer_json: Record<string, unknown>;
  is_correct: boolean | null;
  awarded_score: number | null;
  teacher_feedback: string | null;
  graded_at: string | null;
  graded_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TeacherQuizSummary = QuizRow & {
  class_code: string;
  subject_name: string;
  class_name: string;
  question_count: number;
  attempt_count: number;
  pending_review_count: number;
  average_percent: number | null;
};

export type StudentQuizSummary = QuizRow & {
  class_code: string;
  subject_name: string;
  class_name: string;
  teacher_name: string;
  attempt_count: number;
  latest_attempt: QuizAttemptRow | null;
  availability: "upcoming" | "open" | "closed";
  can_attempt: boolean;
};

export type StudentQuizPayloadQuestion = {
  id: string;
  question_type: QuizQuestionType;
  prompt: string;
  points: number;
  order_no: number;
  is_required: boolean;
  options: Array<{ id: string; option_text: string; order_no: number }>;
  answer?: {
    answer_text?: string | null;
    selected_option_ids?: string[];
    answer_json?: Record<string, unknown>;
  };
};

export type StudentQuizAttemptPayload = {
  attempt: QuizAttemptRow;
  quiz: Pick<QuizRow, "id" | "title" | "instructions" | "time_limit_minutes" | "total_points" | "show_score_after_submit" | "show_correct_answers">;
  questions: StudentQuizPayloadQuestion[];
};

export type QuizAttemptWithStudent = QuizAttemptRow & {
  student_code: string;
  student_name: string;
};

export type StudentQuizResultQuestion = {
  id: string;
  question_type: QuizQuestionType;
  prompt: string;
  points: number;
  order_no: number;
  explanation: string | null;
  accepted_answers: string[];
  options: Array<{ id: string; option_text: string; order_no: number; is_correct: boolean | null }>;
};

export type StudentQuizResultPayload = {
  attempt: QuizAttemptRow;
  quiz: QuizRow;
  answers: QuizAnswerRow[];
  questions: StudentQuizResultQuestion[];
};

export type AttendanceSessionStatus = "draft" | "open" | "closed" | "cancelled";
export type AttendanceStatus = "unmarked" | "present" | "late" | "absent" | "leave" | "sick" | "activity";
export type AttendanceCheckinMethod = "manual" | "code" | "qr";

export type AttendanceSessionRow = {
  id: string;
  class_id: string;
  title: string;
  session_date: string;
  period_label: string | null;
  opens_at: string | null;
  closes_at: string | null;
  late_after_minutes: number;
  allow_self_checkin: boolean;
  check_in_code: string | null;
  status: AttendanceSessionStatus;
  note: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type AttendanceRecordRow = {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  checked_in_at: string | null;
  check_in_method: AttendanceCheckinMethod;
  note: string | null;
  marked_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AttendanceSessionSummary = AttendanceSessionRow & {
  class_code: string;
  subject_name: string;
  class_name: string;
  student_count: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  leave_count: number;
  unmarked_count: number;
};

export type AttendanceRosterRow = RosterStudent & {
  record: AttendanceRecordRow | null;
};

export type StudentAttendanceItem = AttendanceSessionRow & {
  class_code: string;
  subject_name: string;
  class_name: string;
  teacher_name: string;
  record: AttendanceRecordRow | null;
};

export type GradeSourceType = "assignment" | "quiz" | "custom";
export type GradeItemStatus = "draft" | "published" | "archived";
export type GradeCalculationMethod = "weighted_categories" | "total_points";

export type GradeCategoryRow = {
  id: string;
  class_id: string;
  name: string;
  weight_percent: number;
  order_no: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type GradeSettingsRow = {
  class_id: string;
  calculation_method: GradeCalculationMethod;
  publish_final_grade: boolean;
  minimum_attendance_percent: number;
  grade_scale: Array<{ grade: string; min: number }>;
  created_at: string;
  updated_at: string;
};

export type GradeItemRow = {
  id: string;
  class_id: string;
  category_id: string | null;
  source_type: GradeSourceType;
  source_id: string | null;
  title: string;
  description: string | null;
  max_score: number;
  item_weight: number;
  status: GradeItemStatus;
  due_at: string | null;
  order_no: number;
  created_at: string;
  updated_at: string;
};

export type GradeEntryRow = {
  id: string;
  grade_item_id: string;
  student_id: string;
  score: number | null;
  is_excused: boolean;
  feedback: string | null;
  graded_by: string | null;
  graded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type GradebookItem = GradeItemRow & {
  category_name: string;
};

export type GradebookStudentRow = {
  student_id: string;
  student_code: string;
  student_name: string;
  student_number: number | null;
  scores: Record<string, number | null>;
  category_percentages: Record<string, number | null>;
  total_percent: number | null;
  letter_grade: string | null;
  attendance_percent: number | null;
};

export type TeacherGradebookPayload = {
  classRow: ClassRow;
  categories: GradeCategoryRow[];
  settings: GradeSettingsRow;
  items: GradebookItem[];
  students: GradebookStudentRow[];
  gradeEntries: GradeEntryRow[];
};

export type StudentCourseGrade = {
  class_id: string;
  class_code: string;
  subject_name: string;
  class_name: string;
  teacher_name: string;
  calculation_method: GradeCalculationMethod;
  publish_final_grade: boolean;
  total_percent: number | null;
  letter_grade: string | null;
  attendance_percent: number | null;
  minimum_attendance_percent: number;
  categories: Array<{
    id: string;
    name: string;
    weight_percent: number;
    percent: number | null;
  }>;
  items: Array<{
    id: string;
    title: string;
    category_name: string;
    source_type: GradeSourceType;
    score: number | null;
    max_score: number;
    feedback: string | null;
  }>;
};
