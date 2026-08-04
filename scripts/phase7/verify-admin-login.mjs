import { createPublicSupabase, parseCliArgs } from "./_shared.mjs";

const args = parseCliArgs();
const email = String(args.email || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = String(args.password || process.env.ADMIN_PASSWORD || "");

if (!email) throw new Error("Provide --email=... or ADMIN_EMAIL");
if (!password) throw new Error("Provide --password=... or ADMIN_PASSWORD");

const supabase = createPublicSupabase();
const { data, error } = await supabase.auth.signInWithPassword({ email, password });

if (error || !data.user) {
  throw new Error(`Admin authentication failed: ${error?.message ?? "No user returned"}`);
}

const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("id, role, display_name, status")
  .eq("id", data.user.id)
  .single();

if (profileError || !profile) {
  await supabase.auth.signOut();
  throw new Error(`Admin profile lookup failed: ${profileError?.message ?? "No profile returned"}`);
}

if (profile.role !== "admin") {
  await supabase.auth.signOut();
  throw new Error(`The account can authenticate, but its profile role is '${profile.role}', not 'admin'.`);
}

if (profile.status !== "active") {
  await supabase.auth.signOut();
  throw new Error(`The admin profile status is '${profile.status}', not 'active'.`);
}

console.log("Admin login verification passed.");
console.log(`Email: ${email}`);
console.log(`Profile: ${profile.display_name}`);
console.log("Destination: /admin/launch");
await supabase.auth.signOut();
