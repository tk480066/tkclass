import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-role";

export default async function DashboardRedirectPage() {
  const user = await requireUser();
  if (user.profile.role === "admin") redirect("/admin/launch");
  if (user.profile.role === "teacher") redirect("/teacher");
  if (user.profile.role === "student") redirect("/student");
  redirect("/unauthorized");
}
