import { createAdminSupabase, listAllAuthUsers, parseCliArgs, requiredEnv } from "./_shared.mjs";

const args = parseCliArgs();
const email = String(args.email || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = String(args.password || process.env.ADMIN_PASSWORD || "");
const displayName = String(args.name || process.env.ADMIN_DISPLAY_NAME || "ผู้ดูแลระบบ TK Mooc").trim();

if (!email) throw new Error("Provide --email=... or ADMIN_EMAIL");
if (!password || password.length < 8) throw new Error("Provide --password=... with at least 8 characters or ADMIN_PASSWORD");
requiredEnv("NEXT_PUBLIC_SUPABASE_URL");

const supabase = createAdminSupabase();
const users = await listAllAuthUsers(supabase);
let user = users.find((item) => item.email?.toLowerCase() === email);

if (!user) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName, role: "admin" },
  });
  if (error || !data.user) throw new Error(error?.message ?? "Unable to create admin user");
  user = data.user;
  console.log(`Created Auth user: ${email}`);
} else {
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
    user_metadata: { ...(user.user_metadata ?? {}), display_name: displayName, role: "admin" },
  });
  if (error) throw new Error(error.message);
  console.log(`Updated Auth user: ${email}`);
}

const { error: profileError } = await supabase.from("profiles").upsert({
  id: user.id,
  role: "admin",
  display_name: displayName,
  status: "active",
}, { onConflict: "id" });
if (profileError) throw new Error(profileError.message);

const { data: verifiedProfile, error: verifyError } = await supabase
  .from("profiles")
  .select("id, role, display_name, status")
  .eq("id", user.id)
  .single();
if (verifyError || !verifiedProfile) {
  throw new Error(verifyError?.message ?? "Unable to verify the admin profile");
}
if (verifiedProfile.role !== "admin" || verifiedProfile.status !== "active") {
  throw new Error("Admin profile was created but its role/status is invalid");
}

console.log("Admin profile is ready.");
console.log(`Email: ${email}`);
console.log("Login tab: ผู้ดูแล");
console.log("Destination: /admin/launch");
console.log(`Verify: npm run phase7:verify-admin -- --email=${email} --password='YOUR_PASSWORD'`);
