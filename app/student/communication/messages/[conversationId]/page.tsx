import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { ConversationView } from "@/components/phase6/conversation-view";
import { requireRole } from "@/lib/auth/require-role";
import { getConversationDetail } from "@/lib/data/phase6";

export const metadata: Metadata = { title: "การสนทนา" };

export default async function StudentConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const user = await requireRole("student");
  const detail = await getConversationDetail(user.id, conversationId);
  return <DashboardShell user={user} title={detail.conversation.subject} description={`${detail.conversation.class_code} · ${detail.conversation.subject_name}`}><Link href="/student/communication/messages" className="phase2-back-link"><ArrowLeft size={16} /> กลับกล่องข้อความ</Link><ConversationView detail={detail} currentUserId={user.id} role="student" /></DashboardShell>;
}
