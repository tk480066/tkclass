import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local");
  process.exit(1);
}

async function verify(label, email, password) {
  const supabase = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    console.error(`❌ ${label}: ${error?.message ?? "No user returned"}`);
    return false;
  }

  console.log(`✅ ${label}: login successful (${data.user.email})`);
  await supabase.auth.signOut();
  return true;
}

const teacherOk = await verify("Teacher", "teacher@tkmooc.local", "TKMOOC@1234");
const studentOk = await verify("Student", "10001@students.tkmooc.local", "123456");

if (!teacherOk || !studentOk) process.exit(1);
