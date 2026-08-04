import crypto from "node:crypto";
import path from "node:path";
import {
  createAdminSupabase,
  listAllAuthUsers,
  parseCliArgs,
  parseJson,
  printHeading,
  readCsvIfExists,
  splitList,
  toBoolean,
  toInteger,
  toIsoDate,
  toNumber,
} from "./_shared.mjs";

const args = parseCliArgs();
const dataDir = path.resolve(String(args.dir || "migration_data"));
const dryRun = args.dryRun === true;
const resetPasswords = args.resetPasswords === true;
const stopOnError = args.stopOnError === true;
const sourceSystem = String(args.source || "google_sheets_csv");
const sourceLabel = String(args.label || path.basename(dataDir));
const supabase = createAdminSupabase();
const mapCache = new Map();
const authUsers = dryRun ? [] : await listAllAuthUsers(supabase);
const authByEmail = new Map(authUsers.filter((user) => user.email).map((user) => [user.email.toLowerCase(), user]));

const counters = {
  total: 0,
  processed: 0,
  inserted: 0,
  updated: 0,
  skipped: 0,
  errors: 0,
  byEntity: {},
};
let runId = null;

function requireField(row, field) {
  const value = String(row[field] ?? "").trim();
  if (!value) throw new Error(`Missing required field: ${field}`);
  return value;
}
function optional(row, field) {
  const value = String(row[field] ?? "").trim();
  return value || null;
}
function statusCounter(entity) {
  counters.byEntity[entity] ??= { total: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 };
  return counters.byEntity[entity];
}
function fakeId() { return crypto.randomUUID(); }

async function startRun() {
  const { data, error } = await supabase.from("migration_runs").insert({
    source_system: sourceSystem,
    source_label: sourceLabel,
    status: "running",
    dry_run: dryRun,
    started_at: new Date().toISOString(),
  }).select("id").single();
  if (error) throw new Error(`Unable to start migration run: ${error.message}`);
  runId = data.id;
}

async function finishRun(status) {
  if (!runId) return;
  const { error } = await supabase.from("migration_runs").update({
    status,
    completed_at: new Date().toISOString(),
    total_rows: counters.total,
    processed_rows: counters.processed,
    inserted_rows: counters.inserted,
    updated_rows: counters.updated,
    skipped_rows: counters.skipped,
    error_rows: counters.errors,
    summary: { by_entity: counters.byEntity, data_directory: dataDir },
  }).eq("id", runId);
  if (error) console.error(`Unable to finish migration run: ${error.message}`);
}

async function logRowError(entity, fileName, row, error) {
  if (!runId) return;
  const message = error instanceof Error ? error.message : String(error);
  const externalKey = row[`${entity.replace(/s$/, "")}_code`] || row.external_key || row.student_code || row.class_code || null;
  const { error: insertError } = await supabase.from("migration_row_errors").insert({
    migration_run_id: runId,
    entity_type: entity,
    source_file: fileName,
    row_number: row.__rowNumber,
    external_key: externalKey,
    error_code: error?.code || null,
    error_message: message,
    source_payload: Object.fromEntries(Object.entries(row).filter(([key]) => key !== "password" && key !== "pin")),
  });
  if (insertError) console.error(`Unable to log row error: ${insertError.message}`);
}

async function getMap(entityType, externalKey) {
  const cacheKey = `${entityType}:${externalKey}`;
  if (mapCache.has(cacheKey)) return mapCache.get(cacheKey);
  if (dryRun) return null;
  const { data, error } = await supabase.from("migration_key_map")
    .select("target_id")
    .eq("source_system", sourceSystem)
    .eq("entity_type", entityType)
    .eq("external_key", externalKey)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const id = data?.target_id ?? null;
  if (id) mapCache.set(cacheKey, id);
  return id;
}

async function setMap(entityType, externalKey, targetId, metadata = {}) {
  mapCache.set(`${entityType}:${externalKey}`, targetId);
  if (dryRun) return;
  const { error } = await supabase.from("migration_key_map").upsert({
    source_system: sourceSystem,
    entity_type: entityType,
    external_key: externalKey,
    target_id: targetId,
    metadata,
  }, { onConflict: "source_system,entity_type,external_key" });
  if (error) throw new Error(error.message);
}

async function upsertMapped(table, entityType, externalKey, payload) {
  const mappedId = await getMap(entityType, externalKey);
  if (dryRun) {
    const id = mappedId || fakeId();
    await setMap(entityType, externalKey, id);
    return { id, result: mappedId ? "updated" : "inserted" };
  }
  if (mappedId) {
    const { data, error } = await supabase.from(table).update(payload).eq("id", mappedId).select("id").maybeSingle();
    if (error) throw new Error(error.message);
    if (data?.id) return { id: data.id, result: "updated" };
  }
  const { data, error } = await supabase.from(table).insert(payload).select("id").single();
  if (error) throw new Error(error.message);
  await setMap(entityType, externalKey, data.id);
  return { id: data.id, result: "inserted" };
}

async function findTeacherId(teacherCode) {
  const mapped = await getMap("teacher", teacherCode);
  if (mapped) return mapped;
  if (dryRun) throw new Error(`Teacher not imported before use: ${teacherCode}`);
  const { data, error } = await supabase.from("teacher_profiles").select("user_id").eq("teacher_code", teacherCode).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Teacher code not found: ${teacherCode}`);
  await setMap("teacher", teacherCode, data.user_id);
  return data.user_id;
}

async function findStudentId(studentCode) {
  const mapped = await getMap("student", studentCode);
  if (mapped) return mapped;
  if (dryRun) throw new Error(`Student not imported before use: ${studentCode}`);
  const { data, error } = await supabase.from("student_profiles").select("user_id").eq("student_code", studentCode).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Student code not found: ${studentCode}`);
  await setMap("student", studentCode, data.user_id);
  return data.user_id;
}

async function findClassId(classCode) {
  const mapped = await getMap("class", classCode);
  if (mapped) return mapped;
  if (dryRun) throw new Error(`Class not imported before use: ${classCode}`);
  const { data, error } = await supabase.from("classes").select("id").eq("class_code", classCode).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Class code not found: ${classCode}`);
  await setMap("class", classCode, data.id);
  return data.id;
}

async function requireMap(entity, externalKey) {
  const id = await getMap(entity, externalKey);
  if (!id) throw new Error(`${entity} external key not found: ${externalKey}`);
  return id;
}

async function upsertAuthUser({ email, password, displayName, role }) {
  const normalized = email.toLowerCase();
  let user = authByEmail.get(normalized);
  if (dryRun) return user?.id || fakeId();
  if (!user) {
    if (!password || password.length < 6) throw new Error(`Password/PIN required for new account: ${email}`);
    const { data, error } = await supabase.auth.admin.createUser({
      email: normalized,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName, role },
    });
    if (error || !data.user) throw new Error(error?.message ?? `Unable to create ${email}`);
    user = data.user;
    authByEmail.set(normalized, user);
  } else if (resetPasswords && password) {
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: { ...(user.user_metadata ?? {}), display_name: displayName, role },
    });
    if (error || !data.user) throw new Error(error?.message ?? `Unable to update ${email}`);
    user = data.user;
    authByEmail.set(normalized, user);
  }
  return user.id;
}

async function processFile(entity, fileName, handler) {
  const { rows } = readCsvIfExists(dataDir, fileName);
  if (!rows.length) {
    console.log(`⏭️ ${fileName}: not found or empty`);
    return;
  }
  printHeading(`${entity} (${rows.length})`);
  counters.total += rows.length;
  statusCounter(entity).total += rows.length;
  for (const row of rows) {
    try {
      const result = await handler(row);
      counters.processed += 1;
      counters[result] += 1;
      statusCounter(entity)[result] += 1;
      console.log(`✅ row ${row.__rowNumber}: ${result}`);
    } catch (error) {
      counters.processed += 1;
      counters.errors += 1;
      statusCounter(entity).errors += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`❌ row ${row.__rowNumber}: ${message}`);
      await logRowError(entity, fileName, row, error);
      if (stopOnError) throw error;
    }
  }
}

async function main() {
  await startRun();
  console.log(`Data directory: ${dataDir}`);
  console.log(`Dry run: ${dryRun}`);
  console.log(`Reset existing passwords: ${resetPasswords}`);

  await processFile("teachers", "teachers.csv", async (row) => {
    const teacherCode = requireField(row, "teacher_code");
    const email = requireField(row, "email").toLowerCase();
    const displayName = requireField(row, "display_name");
    const password = optional(row, "password") || process.env.MIGRATION_DEFAULT_TEACHER_PASSWORD || "";
    const existingId = await getMap("teacher", teacherCode);
    const userId = await upsertAuthUser({ email, password, displayName, role: "teacher" });
    if (!dryRun) {
      const profileResult = await supabase.from("profiles").upsert({
        id: userId, role: "teacher", display_name: displayName, status: optional(row, "status") || "active",
      }, { onConflict: "id" });
      if (profileResult.error) throw new Error(profileResult.error.message);
      const teacherResult = await supabase.from("teacher_profiles").upsert({
        user_id: userId, teacher_code: teacherCode, email, department: optional(row, "department"),
      }, { onConflict: "user_id" });
      if (teacherResult.error) throw new Error(teacherResult.error.message);
    }
    await setMap("teacher", teacherCode, userId, { email });
    return existingId ? "updated" : "inserted";
  });

  await processFile("students", "students.csv", async (row) => {
    const studentCode = requireField(row, "student_code");
    if (!/^\d{5}$/.test(studentCode)) throw new Error("student_code must be exactly 5 digits");
    const firstName = requireField(row, "first_name");
    const lastName = requireField(row, "last_name");
    const displayName = [optional(row, "title"), firstName, lastName].filter(Boolean).join(" ");
    const email = `${studentCode}@students.tkmooc.local`;
    const pin = optional(row, "pin") || process.env.MIGRATION_DEFAULT_STUDENT_PIN || "";
    const existingId = await getMap("student", studentCode);
    const userId = await upsertAuthUser({ email, password: pin, displayName, role: "student" });
    if (!dryRun) {
      const profileResult = await supabase.from("profiles").upsert({
        id: userId, role: "student", display_name: displayName, status: optional(row, "status") || "active",
      }, { onConflict: "id" });
      if (profileResult.error) throw new Error(profileResult.error.message);
      const studentResult = await supabase.from("student_profiles").upsert({
        user_id: userId,
        student_code: studentCode,
        title: optional(row, "title"),
        first_name: firstName,
        last_name: lastName,
        nickname: optional(row, "nickname"),
        level: optional(row, "level"),
        room: optional(row, "room"),
        student_number: toInteger(row.student_number),
      }, { onConflict: "user_id" });
      if (studentResult.error) throw new Error(studentResult.error.message);
    }
    await setMap("student", studentCode, userId, { email });
    return existingId ? "updated" : "inserted";
  });

  await processFile("classes", "classes.csv", async (row) => {
    const classCode = requireField(row, "class_code");
    const teacherId = await findTeacherId(requireField(row, "teacher_code"));
    const payload = {
      teacher_id: teacherId,
      class_code: classCode,
      subject_name: requireField(row, "subject_name"),
      class_name: requireField(row, "class_name"),
      level: optional(row, "level"), room: optional(row, "room"),
      semester: toInteger(row.semester), academic_year: toInteger(row.academic_year),
      description: optional(row, "description"), status: optional(row, "status") || "active",
      online_meeting_url: optional(row, "online_meeting_url"),
      course_color: optional(row, "course_color") || "#0d5ba7",
      syllabus: optional(row, "syllabus"),
    };
    if (dryRun) {
      const existingId = await getMap("class", classCode);
      const id = existingId || fakeId();
      await setMap("class", classCode, id);
      return existingId ? "updated" : "inserted";
    }
    const { data: existing, error: findError } = await supabase.from("classes").select("id").eq("class_code", classCode).maybeSingle();
    if (findError) throw new Error(findError.message);
    const result = await supabase.from("classes").upsert(payload, { onConflict: "class_code" }).select("id").single();
    if (result.error) throw new Error(result.error.message);
    await setMap("class", classCode, result.data.id);
    return existing ? "updated" : "inserted";
  });

  await processFile("enrollments", "enrollments.csv", async (row) => {
    const classId = await findClassId(requireField(row, "class_code"));
    const studentId = await findStudentId(requireField(row, "student_code"));
    if (dryRun) return "inserted";
    const { data: existing, error: findError } = await supabase.from("enrollments").select("id").eq("class_id", classId).eq("student_id", studentId).maybeSingle();
    if (findError) throw new Error(findError.message);
    const { error } = await supabase.from("enrollments").upsert({
      class_id: classId, student_id: studentId,
      student_number: toInteger(row.student_number), group_name: optional(row, "group_name"),
      status: optional(row, "status") || "active",
    }, { onConflict: "class_id,student_id" });
    if (error) throw new Error(error.message);
    return existing ? "updated" : "inserted";
  });

  await processFile("units", "units.csv", async (row) => {
    const code = requireField(row, "unit_code");
    return (await upsertMapped("units", "unit", code, {
      class_id: await findClassId(requireField(row, "class_code")),
      title: requireField(row, "title"), description: optional(row, "description"), objectives: optional(row, "objectives"),
      order_no: toInteger(row.order_no, 1), status: optional(row, "status") || "draft", publish_at: toIsoDate(row.publish_at),
    })).result;
  });

  await processFile("lessons", "lessons.csv", async (row) => {
    const code = requireField(row, "lesson_code");
    return (await upsertMapped("lessons", "lesson", code, {
      unit_id: await requireMap("unit", requireField(row, "unit_code")),
      title: requireField(row, "title"), summary: optional(row, "summary"), objectives: optional(row, "objectives"),
      order_no: toInteger(row.order_no, 1), estimated_minutes: toInteger(row.estimated_minutes, 20),
      status: optional(row, "status") || "draft", publish_at: toIsoDate(row.publish_at), cover_path: optional(row, "cover_path"),
    })).result;
  });

  await processFile("lesson_blocks", "lesson_blocks.csv", async (row) => {
    const code = requireField(row, "block_code");
    return (await upsertMapped("lesson_blocks", "lesson_block", code, {
      lesson_id: await requireMap("lesson", requireField(row, "lesson_code")),
      block_type: requireField(row, "block_type"), title: optional(row, "title"), body: optional(row, "body"),
      external_url: optional(row, "external_url"), storage_path: optional(row, "storage_path"),
      metadata: parseJson(row.metadata_json, {}), order_no: toInteger(row.order_no, 1), is_required: toBoolean(row.is_required, true),
    })).result;
  });

  await processFile("assignments", "assignments.csv", async (row) => {
    const code = requireField(row, "assignment_code");
    return (await upsertMapped("assignments", "assignment", code, {
      class_id: await findClassId(requireField(row, "class_code")),
      title: requireField(row, "title"), instructions: optional(row, "instructions"),
      work_type: optional(row, "work_type") || "individual", max_score: toNumber(row.max_score, 10),
      passing_score: toNumber(row.passing_score), publish_at: toIsoDate(row.publish_at), due_at: toIsoDate(row.due_at),
      allow_late: toBoolean(row.allow_late, true), allow_resubmit: toBoolean(row.allow_resubmit, true),
      target_mode: optional(row, "target_mode") || "class", target_group_name: optional(row, "target_group_name"),
      allowed_submission_types: splitList(row.allowed_submission_types).length ? splitList(row.allowed_submission_types) : ["text", "file", "link"],
      status: optional(row, "status") || "draft", rubric_json: parseJson(row.rubric_json, []),
    })).result;
  });

  await processFile("assignment_targets", "assignment_targets.csv", async (row) => {
    const assignmentId = await requireMap("assignment", requireField(row, "assignment_code"));
    const targetType = requireField(row, "target_type");
    const studentCode = optional(row, "student_code");
    const groupName = optional(row, "group_name");
    if (targetType === "student" && !studentCode) throw new Error("student_code is required for student target");
    if (targetType === "group" && !groupName) throw new Error("group_name is required for group target");
    if (!["student", "group"].includes(targetType)) throw new Error("target_type must be student or group");
    const studentId = targetType === "student" ? await findStudentId(studentCode) : null;
    if (dryRun) return "inserted";
    const query = supabase.from("assignment_targets").select("id").eq("assignment_id", assignmentId);
    const { data: existing, error: findError } = targetType === "student"
      ? await query.eq("student_id", studentId).maybeSingle()
      : await query.eq("group_name", groupName).maybeSingle();
    if (findError) throw new Error(findError.message);
    const payload = {
      assignment_id: assignmentId, student_id: studentId, group_name: targetType === "group" ? groupName : null,
    };
    const result = existing
      ? await supabase.from("assignment_targets").update(payload).eq("id", existing.id)
      : await supabase.from("assignment_targets").insert(payload);
    if (result.error) throw new Error(result.error.message);
    return existing ? "updated" : "inserted";
  });

  await processFile("assignment_attachments", "assignment_attachments.csv", async (row) => {
    const code = requireField(row, "attachment_code");
    const storagePath = optional(row, "storage_path");
    const externalUrl = optional(row, "external_url");
    if (!storagePath && !externalUrl) throw new Error("storage_path or external_url is required");
    return (await upsertMapped("assignment_attachments", "assignment_attachment", code, {
      assignment_id: await requireMap("assignment", requireField(row, "assignment_code")),
      storage_path: storagePath, external_url: externalUrl, file_name: optional(row, "file_name"),
      mime_type: optional(row, "mime_type"), file_size: toInteger(row.file_size),
    })).result;
  });

  await processFile("quizzes", "quizzes.csv", async (row) => {
    const code = requireField(row, "quiz_code");
    const lessonCode = optional(row, "lesson_code");
    return (await upsertMapped("quizzes", "quiz", code, {
      class_id: await findClassId(requireField(row, "class_code")),
      lesson_id: lessonCode ? await requireMap("lesson", lessonCode) : null,
      title: requireField(row, "title"), instructions: optional(row, "instructions"), status: optional(row, "status") || "draft",
      open_at: toIsoDate(row.open_at), close_at: toIsoDate(row.close_at), time_limit_minutes: toInteger(row.time_limit_minutes),
      max_attempts: toInteger(row.max_attempts, 1), passing_percent: toNumber(row.passing_percent, 50),
      shuffle_questions: toBoolean(row.shuffle_questions), shuffle_options: toBoolean(row.shuffle_options),
      show_score_after_submit: toBoolean(row.show_score_after_submit, true), show_correct_answers: toBoolean(row.show_correct_answers),
    })).result;
  });

  await processFile("quiz_questions", "quiz_questions.csv", async (row) => {
    const code = requireField(row, "question_code");
    return (await upsertMapped("quiz_questions", "quiz_question", code, {
      quiz_id: await requireMap("quiz", requireField(row, "quiz_code")),
      question_type: requireField(row, "question_type"), prompt: requireField(row, "prompt"), explanation: optional(row, "explanation"),
      points: toNumber(row.points, 1), order_no: toInteger(row.order_no, 1), is_required: toBoolean(row.is_required, true),
      accepted_answers: splitList(row.accepted_answers), case_sensitive: toBoolean(row.case_sensitive),
    })).result;
  });

  await processFile("quiz_options", "quiz_options.csv", async (row) => {
    const questionId = await requireMap("quiz_question", requireField(row, "question_code"));
    const orderNo = toInteger(row.order_no, 1);
    if (dryRun) return "inserted";
    const { data: existing, error: findError } = await supabase.from("quiz_options").select("id").eq("question_id", questionId).eq("order_no", orderNo).maybeSingle();
    if (findError) throw new Error(findError.message);
    const { error } = await supabase.from("quiz_options").upsert({
      question_id: questionId, option_text: requireField(row, "option_text"), is_correct: toBoolean(row.is_correct), order_no: orderNo,
    }, { onConflict: "question_id,order_no" });
    if (error) throw new Error(error.message);
    return existing ? "updated" : "inserted";
  });

  await processFile("attendance_sessions", "attendance_sessions.csv", async (row) => {
    const code = requireField(row, "session_code");
    const classId = await findClassId(requireField(row, "class_code"));
    const teacherCode = optional(row, "teacher_code");
    const createdBy = teacherCode ? await findTeacherId(teacherCode) : dryRun ? fakeId() : (await supabase.from("classes").select("teacher_id").eq("id", classId).single()).data.teacher_id;
    return (await upsertMapped("attendance_sessions", "attendance_session", code, {
      class_id: classId, title: optional(row, "title") || "เช็กชื่อเข้าเรียน", session_date: requireField(row, "session_date"),
      period_label: optional(row, "period_label"), opens_at: toIsoDate(row.opens_at), closes_at: toIsoDate(row.closes_at),
      late_after_minutes: toInteger(row.late_after_minutes, 15), allow_self_checkin: toBoolean(row.allow_self_checkin, true),
      check_in_code: optional(row, "check_in_code"), status: optional(row, "status") || "closed", note: optional(row, "note"), created_by: createdBy,
    })).result;
  });

  await processFile("attendance_records", "attendance_records.csv", async (row) => {
    const sessionId = await requireMap("attendance_session", requireField(row, "session_code"));
    const studentId = await findStudentId(requireField(row, "student_code"));
    if (dryRun) return "inserted";
    const { data: existing, error: findError } = await supabase.from("attendance_records").select("id").eq("session_id", sessionId).eq("student_id", studentId).maybeSingle();
    if (findError) throw new Error(findError.message);
    const { error } = await supabase.from("attendance_records").upsert({
      session_id: sessionId, student_id: studentId, status: optional(row, "status") || "unmarked",
      checked_in_at: toIsoDate(row.checked_in_at), check_in_method: optional(row, "check_in_method") || "manual", note: optional(row, "note"),
    }, { onConflict: "session_id,student_id" });
    if (error) throw new Error(error.message);
    return existing ? "updated" : "inserted";
  });

  await processFile("grade_settings", "grade_settings.csv", async (row) => {
    const classId = await findClassId(requireField(row, "class_code"));
    if (dryRun) return "inserted";
    const { data: existing, error: findError } = await supabase.from("grade_settings").select("class_id").eq("class_id", classId).maybeSingle();
    if (findError) throw new Error(findError.message);
    const { error } = await supabase.from("grade_settings").upsert({
      class_id: classId, calculation_method: optional(row, "calculation_method") || "weighted_categories",
      publish_final_grade: toBoolean(row.publish_final_grade),
      minimum_attendance_percent: toNumber(row.minimum_attendance_percent, 80),
      grade_scale: parseJson(row.grade_scale_json, [
        { grade: "4", min: 80 }, { grade: "3.5", min: 75 }, { grade: "3", min: 70 },
        { grade: "2.5", min: 65 }, { grade: "2", min: 60 }, { grade: "1.5", min: 55 },
        { grade: "1", min: 50 }, { grade: "0", min: 0 },
      ]),
    }, { onConflict: "class_id" });
    if (error) throw new Error(error.message);
    return existing ? "updated" : "inserted";
  });

  await processFile("grade_categories", "grade_categories.csv", async (row) => {
    const classId = await findClassId(requireField(row, "class_code"));
    const name = requireField(row, "name");
    const code = optional(row, "category_code") || `${row.class_code}:${name}`;
    if (dryRun) return (await upsertMapped("grade_categories", "grade_category", code, {})).result;
    const { data: existing, error: findError } = await supabase.from("grade_categories").select("id").eq("class_id", classId).eq("name", name).maybeSingle();
    if (findError) throw new Error(findError.message);
    const { data, error } = await supabase.from("grade_categories").upsert({
      class_id: classId, name, weight_percent: toNumber(row.weight_percent, 0), order_no: toInteger(row.order_no, 1), is_active: toBoolean(row.is_active, true),
    }, { onConflict: "class_id,name" }).select("id").single();
    if (error) throw new Error(error.message);
    await setMap("grade_category", code, data.id);
    return existing ? "updated" : "inserted";
  });

  await processFile("grade_items", "grade_items.csv", async (row) => {
    const code = requireField(row, "item_code");
    const categoryCode = optional(row, "category_code");
    return (await upsertMapped("grade_items", "grade_item", code, {
      class_id: await findClassId(requireField(row, "class_code")),
      category_id: categoryCode ? await requireMap("grade_category", categoryCode) : null,
      source_type: "custom", source_id: null, title: requireField(row, "title"), description: optional(row, "description"),
      max_score: toNumber(row.max_score, 10), item_weight: toNumber(row.item_weight, 1),
      status: optional(row, "status") || "draft", due_at: toIsoDate(row.due_at), order_no: toInteger(row.order_no, 1),
    })).result;
  });

  await processFile("grade_entries", "grade_entries.csv", async (row) => {
    const gradeItemId = await requireMap("grade_item", requireField(row, "item_code"));
    const studentId = await findStudentId(requireField(row, "student_code"));
    if (dryRun) return "inserted";
    const { data: existing, error: findError } = await supabase.from("grade_entries").select("id").eq("grade_item_id", gradeItemId).eq("student_id", studentId).maybeSingle();
    if (findError) throw new Error(findError.message);
    const { error } = await supabase.from("grade_entries").upsert({
      grade_item_id: gradeItemId, student_id: studentId, score: toNumber(row.score),
      is_excused: toBoolean(row.is_excused), feedback: optional(row, "feedback"), graded_at: toIsoDate(row.graded_at),
    }, { onConflict: "grade_item_id,student_id" });
    if (error) throw new Error(error.message);
    return existing ? "updated" : "inserted";
  });

  await processFile("announcements", "announcements.csv", async (row) => {
    const code = requireField(row, "announcement_code");
    const classId = await findClassId(requireField(row, "class_code"));
    const teacherCode = optional(row, "teacher_code");
    const authorId = teacherCode ? await findTeacherId(teacherCode) : dryRun ? fakeId() : (await supabase.from("classes").select("teacher_id").eq("id", classId).single()).data.teacher_id;
    return (await upsertMapped("announcements", "announcement", code, {
      class_id: classId, author_id: authorId, title: requireField(row, "title"), body: requireField(row, "body"),
      priority: optional(row, "priority") || "normal", status: optional(row, "status") || "draft",
      publish_at: toIsoDate(row.publish_at), expires_at: toIsoDate(row.expires_at), is_pinned: toBoolean(row.is_pinned),
    })).result;
  });

  await processFile("announcement_attachments", "announcement_attachments.csv", async (row) => {
    const code = requireField(row, "attachment_code");
    const storagePath = optional(row, "storage_path");
    const externalUrl = optional(row, "external_url");
    if (!storagePath && !externalUrl) throw new Error("storage_path or external_url is required");
    return (await upsertMapped("announcement_attachments", "announcement_attachment", code, {
      announcement_id: await requireMap("announcement", requireField(row, "announcement_code")),
      storage_path: storagePath, external_url: externalUrl, file_name: optional(row, "file_name"),
      mime_type: optional(row, "mime_type"), file_size: toInteger(row.file_size),
    })).result;
  });

  const finalStatus = counters.errors ? "completed_with_errors" : "completed";
  await finishRun(finalStatus);
  console.log("\n=== Migration summary ===");
  console.log(JSON.stringify(counters, null, 2));
  if (counters.errors) process.exitCode = 2;
}

try {
  await main();
} catch (error) {
  console.error(error);
  await finishRun("failed");
  process.exitCode = 1;
}
