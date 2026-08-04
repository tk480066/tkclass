import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";

export default async function AdminIndexPage() {
  await requireRole("admin");
  redirect("/admin/launch");
}
