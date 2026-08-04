import fs from "node:fs";
import path from "node:path";
import {
  createAdminSupabase,
  ensureDir,
  listAllAuthUsers,
  paginateTable,
  parseCliArgs,
  printHeading,
  safeFileName,
} from "./_shared.mjs";

const args = parseCliArgs();
const includeStorage = args.includeStorage === true;
const stamp = safeFileName(new Date().toISOString());
const outputDir = path.resolve(String(args.output || `backups/tkmooc-${stamp}`));
ensureDir(outputDir);
const supabase = createAdminSupabase();

const tables = [
  "profiles", "teacher_profiles", "student_profiles", "classes", "enrollments",
  "units", "lessons", "lesson_blocks", "lesson_progress", "lesson_responses",
  "assignments", "assignment_targets", "assignment_attachments", "submissions", "submission_members", "submission_files",
  "quizzes", "quiz_questions", "quiz_options", "quiz_attempts", "quiz_answers",
  "attendance_sessions", "attendance_records", "grade_categories", "grade_settings", "grade_items", "grade_entries",
  "announcements", "announcement_attachments", "announcement_reads", "conversations", "conversation_participants", "messages", "message_attachments",
  "system_settings", "migration_runs", "migration_row_errors", "migration_key_map", "deployment_checks", "audit_events",
];
const buckets = ["course-content", "assignment-files", "submission-files", "communication-files"];
const manifest = {
  created_at: new Date().toISOString(),
  format_version: 1,
  includes_storage_objects: includeStorage,
  note: "Auth password hashes are not exported. Supabase database backups do not include Storage object bytes.",
  tables: {},
  buckets: {},
};

printHeading("Export Auth users");
const authUsers = await listAllAuthUsers(supabase);
const safeAuthUsers = authUsers.map((user) => ({
  id: user.id,
  email: user.email,
  phone: user.phone,
  created_at: user.created_at,
  updated_at: user.updated_at,
  last_sign_in_at: user.last_sign_in_at,
  email_confirmed_at: user.email_confirmed_at,
  user_metadata: user.user_metadata,
  app_metadata: user.app_metadata,
}));
fs.writeFileSync(path.join(outputDir, "auth_users.json"), JSON.stringify(safeAuthUsers, null, 2));
manifest.auth_users = safeAuthUsers.length;
console.log(`Auth users: ${safeAuthUsers.length}`);

printHeading("Export database tables");
for (const table of tables) {
  try {
    const rows = await paginateTable(supabase, table);
    fs.writeFileSync(path.join(outputDir, `${table}.json`), JSON.stringify(rows, null, 2));
    manifest.tables[table] = { rows: rows.length, ok: true };
    console.log(`✅ ${table}: ${rows.length}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    manifest.tables[table] = { rows: 0, ok: false, error: message };
    console.log(`⚠️ ${table}: ${message}`);
  }
}

async function listFolder(bucket, prefix = "") {
  const output = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: 1000,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(error.message);
    for (const item of data ?? []) {
      const objectPath = prefix ? `${prefix}/${item.name}` : item.name;
      const isFolder = !item.id && !item.metadata;
      if (isFolder) output.push(...await listFolder(bucket, objectPath));
      else output.push({ ...item, object_path: objectPath });
    }
    if (!data || data.length < 1000) break;
  }
  return output;
}

printHeading("Export Storage metadata");
for (const bucket of buckets) {
  try {
    const objects = await listFolder(bucket);
    const metadataDir = ensureDir(path.join(outputDir, "storage_metadata"));
    fs.writeFileSync(path.join(metadataDir, `${bucket}.json`), JSON.stringify(objects, null, 2));
    manifest.buckets[bucket] = { objects: objects.length, downloaded: 0, ok: true };
    console.log(`✅ ${bucket}: ${objects.length} objects`);

    if (includeStorage) {
      const bucketDir = ensureDir(path.join(outputDir, "storage", bucket));
      let downloaded = 0;
      for (const object of objects) {
        const { data, error } = await supabase.storage.from(bucket).download(object.object_path);
        if (error) {
          console.log(`⚠️ ${bucket}/${object.object_path}: ${error.message}`);
          continue;
        }
        const destination = path.join(bucketDir, object.object_path);
        ensureDir(path.dirname(destination));
        fs.writeFileSync(destination, Buffer.from(await data.arrayBuffer()));
        downloaded += 1;
      }
      manifest.buckets[bucket].downloaded = downloaded;
      console.log(`   downloaded: ${downloaded}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    manifest.buckets[bucket] = { objects: 0, downloaded: 0, ok: false, error: message };
    console.log(`⚠️ ${bucket}: ${message}`);
  }
}

fs.writeFileSync(path.join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`\nBackup completed: ${outputDir}`);
console.log("Store this directory outside the project repository and do not commit it.");
