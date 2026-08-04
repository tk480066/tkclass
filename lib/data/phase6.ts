import { notFound } from "next/navigation";
import { getClassRoster, getTeacherClassSummaries } from "@/lib/data/phase2";
import { createClient } from "@/lib/supabase/server";
import type {
  AnnouncementAttachmentRow,
  AnnouncementRow,
  AnnouncementSummary,
  AppRole,
  ClassRow,
  CommunicationCounts,
  ConversationDetail,
  ConversationMessage,
  ConversationParticipantRow,
  ConversationRow,
  ConversationSummary,
  MessageAttachmentRow,
  MessageRow,
  Profile,
} from "@/lib/types";

const ANNOUNCEMENT_SELECT = "id, class_id, author_id, title, body, priority, status, publish_at, expires_at, is_pinned, created_at, updated_at";
const CONVERSATION_SELECT = "id, class_id, subject, created_by, status, last_message_at, created_at, updated_at";
const MESSAGE_SELECT = "id, conversation_id, sender_id, message_kind, body, reply_to_id, edited_at, deleted_at, created_at";
const CLASS_SELECT = "id, teacher_id, class_code, subject_name, class_name, level, room, semester, academic_year, description, status, online_meeting_url, cover_path, course_color, syllabus, created_at, updated_at";

async function signCommunicationFiles<T extends { storage_path: string | null }>(rows: T[]) {
  const supabase = await createClient();
  return Promise.all(
    rows.map(async (row) => {
      if (!row.storage_path) return { ...row, signed_url: null };
      const { data } = await supabase.storage.from("communication-files").createSignedUrl(row.storage_path, 3600);
      return { ...row, signed_url: data?.signedUrl ?? null };
    }),
  );
}

async function hydrateAnnouncements(rows: AnnouncementRow[], currentUserId: string): Promise<AnnouncementSummary[]> {
  if (!rows.length) return [];
  const supabase = await createClient();
  const classIds = [...new Set(rows.map((row) => row.class_id))];
  const authorIds = [...new Set(rows.map((row) => row.author_id))];
  const announcementIds = rows.map((row) => row.id);

  const [{ data: classes }, { data: authors }, { data: reads }, { data: attachments }, { data: enrollments }] = await Promise.all([
    supabase.from("classes").select("id, class_code, subject_name, class_name").in("id", classIds),
    supabase.from("profiles").select("id, display_name").in("id", authorIds),
    supabase.from("announcement_reads").select("announcement_id, user_id").in("announcement_id", announcementIds),
    supabase.from("announcement_attachments").select("announcement_id").in("announcement_id", announcementIds),
    supabase.from("enrollments").select("class_id").in("class_id", classIds).eq("status", "active"),
  ]);

  const classRows = (classes ?? []) as Array<{ id: string; class_code: string; subject_name: string; class_name: string }>;
  const authorRows = (authors ?? []) as Array<{ id: string; display_name: string }>;
  const readRows = (reads ?? []) as Array<{ announcement_id: string; user_id: string }>;
  const attachmentRows = (attachments ?? []) as Array<{ announcement_id: string }>;
  const enrollmentRows = (enrollments ?? []) as Array<{ class_id: string }>;
  const classMap = new Map(classRows.map((row) => [row.id, row]));
  const authorMap = new Map(authorRows.map((row) => [row.id, row.display_name]));
  const readCount = new Map<string, number>();
  const myReads = new Set<string>();
  for (const row of readRows) {
    readCount.set(row.announcement_id, (readCount.get(row.announcement_id) ?? 0) + 1);
    if (row.user_id === currentUserId) myReads.add(row.announcement_id);
  }
  const attachmentCount = new Map<string, number>();
  for (const row of attachmentRows) attachmentCount.set(row.announcement_id, (attachmentCount.get(row.announcement_id) ?? 0) + 1);
  const recipientCount = new Map<string, number>();
  for (const row of enrollmentRows) recipientCount.set(row.class_id, (recipientCount.get(row.class_id) ?? 0) + 1);

  return rows.map((row) => {
    const classRow = classMap.get(row.class_id);
    return {
      ...row,
      class_code: classRow?.class_code ?? "-",
      subject_name: classRow?.subject_name ?? "รายวิชา",
      class_name: classRow?.class_name ?? "",
      author_name: authorMap.get(row.author_id) ?? "ครูผู้สอน",
      read_count: readCount.get(row.id) ?? 0,
      recipient_count: recipientCount.get(row.class_id) ?? 0,
      is_read: myReads.has(row.id),
      attachment_count: attachmentCount.get(row.id) ?? 0,
    };
  });
}

export async function getTeacherAnnouncements(teacherId: string, classId?: string): Promise<AnnouncementSummary[]> {
  const supabase = await createClient();
  const classes = await getTeacherClassSummaries(teacherId);
  const classIds = classes.map((row) => row.id);
  if (!classIds.length) return [];
  let query = supabase
    .from("announcements")
    .select(ANNOUNCEMENT_SELECT)
    .in("class_id", classIds)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });
  if (classId) query = query.eq("class_id", classId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return hydrateAnnouncements((data ?? []) as unknown as AnnouncementRow[], teacherId);
}

export async function getStudentAnnouncements(studentId: string): Promise<AnnouncementSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select(ANNOUNCEMENT_SELECT)
    .order("is_pinned", { ascending: false })
    .order("publish_at", { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  return hydrateAnnouncements((data ?? []) as unknown as AnnouncementRow[], studentId);
}

export async function getAnnouncementDetail(currentUserId: string, announcementId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("announcements").select(ANNOUNCEMENT_SELECT).eq("id", announcementId).single();
  if (error || !data) notFound();
  const row = data as unknown as AnnouncementRow;
  const [summary] = await hydrateAnnouncements([row], currentUserId);
  const [{ data: attachmentRows }, { data: readRows }] = await Promise.all([
    supabase
      .from("announcement_attachments")
      .select("id, announcement_id, storage_path, external_url, file_name, mime_type, file_size, created_at")
      .eq("announcement_id", announcementId)
      .order("created_at"),
    supabase.from("announcement_reads").select("announcement_id, user_id, read_at").eq("announcement_id", announcementId),
  ]);
  const attachments = await signCommunicationFiles((attachmentRows ?? []) as unknown as AnnouncementAttachmentRow[]);
  return { announcement: summary, attachments, reads: readRows ?? [] };
}

export async function getTeacherCommunicationContacts(teacherId: string) {
  const classes = await getTeacherClassSummaries(teacherId);
  const groups = await Promise.all(
    classes.map(async (classRow) => ({
      classRow,
      students: (await getClassRoster(teacherId, classRow.id)).filter((row) => row.enrollment_status === "active"),
    })),
  );
  return groups;
}

export async function getStudentCommunicationClasses(studentId: string) {
  const supabase = await createClient();
  const { data: enrollmentRows, error } = await supabase
    .from("enrollments")
    .select("class_id")
    .eq("student_id", studentId)
    .eq("status", "active");
  if (error) throw new Error(error.message);
  const enrolledClasses = (enrollmentRows ?? []) as Array<{ class_id: string }>;
  const classIds = enrolledClasses.map((row) => row.class_id);
  if (!classIds.length) return [];
  const { data: classes, error: classError } = await supabase.from("classes").select(CLASS_SELECT).in("id", classIds).eq("status", "active").order("subject_name");
  if (classError) throw new Error(classError.message);
  return (classes ?? []) as unknown as ClassRow[];
}

export async function getConversations(userId: string): Promise<ConversationSummary[]> {
  const supabase = await createClient();
  const { data: myParticipantRows, error } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id, joined_at, last_read_at, is_muted")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  const myParticipants = (myParticipantRows ?? []) as unknown as ConversationParticipantRow[];
  const conversationIds = myParticipants.map((row) => row.conversation_id);
  if (!conversationIds.length) return [];

  const [{ data: conversationRows }, { data: participantRows }, { data: messageRows }] = await Promise.all([
    supabase.from("conversations").select(CONVERSATION_SELECT).in("id", conversationIds).order("last_message_at", { ascending: false }),
    supabase.from("conversation_participants").select("conversation_id, user_id, joined_at, last_read_at, is_muted").in("conversation_id", conversationIds),
    supabase.from("messages").select(MESSAGE_SELECT).in("conversation_id", conversationIds).order("created_at", { ascending: true }),
  ]);
  const conversations = (conversationRows ?? []) as unknown as ConversationRow[];
  const participants = (participantRows ?? []) as unknown as ConversationParticipantRow[];
  const messages = (messageRows ?? []) as unknown as MessageRow[];
  const classIds = [...new Set(conversations.map((row) => row.class_id))];
  const profileIds = [...new Set(participants.map((row) => row.user_id))];
  const [{ data: classes }, { data: profiles }] = await Promise.all([
    supabase.from("classes").select("id, class_code, subject_name, class_name").in("id", classIds),
    supabase.from("profiles").select("id, display_name, role").in("id", profileIds),
  ]);
  const conversationClassRows = (classes ?? []) as Array<{ id: string; class_code: string; subject_name: string; class_name: string }>;
  const conversationProfileRows = (profiles ?? []) as Array<{ id: string; display_name: string; role: AppRole }>;
  const classMap = new Map(conversationClassRows.map((row) => [row.id, row]));
  const profileMap = new Map(conversationProfileRows.map((row) => [row.id, row]));
  const participantMap = new Map<string, ConversationParticipantRow[]>();
  for (const row of participants) {
    const list = participantMap.get(row.conversation_id) ?? [];
    list.push(row);
    participantMap.set(row.conversation_id, list);
  }
  const messageMap = new Map<string, MessageRow[]>();
  for (const row of messages) {
    const list = messageMap.get(row.conversation_id) ?? [];
    list.push(row);
    messageMap.set(row.conversation_id, list);
  }
  const myReadMap = new Map(myParticipants.map((row) => [row.conversation_id, row.last_read_at]));

  return conversations.map((row) => {
    const classRow = classMap.get(row.class_id);
    const conversationMessages = messageMap.get(row.id) ?? [];
    const latest = conversationMessages.at(-1) ?? null;
    const lastRead = myReadMap.get(row.id);
    const unread = conversationMessages.filter((message) => message.sender_id !== userId && (!lastRead || new Date(message.created_at) > new Date(lastRead))).length;
    return {
      ...row,
      class_code: classRow?.class_code ?? "-",
      subject_name: classRow?.subject_name ?? "รายวิชา",
      class_name: classRow?.class_name ?? "",
      participant_names: (participantMap.get(row.id) ?? [])
        .filter((participant) => participant.user_id !== userId)
        .map((participant) => profileMap.get(participant.user_id)?.display_name ?? "ผู้ใช้งาน"),
      latest_message: latest ? (latest.deleted_at ? "ข้อความถูกลบ" : latest.body) : null,
      latest_sender_id: latest?.sender_id ?? null,
      unread_count: unread,
    };
  });
}

export async function getConversationDetail(userId: string, conversationId: string): Promise<ConversationDetail> {
  const supabase = await createClient();
  const { data: conversationData, error } = await supabase.from("conversations").select(CONVERSATION_SELECT).eq("id", conversationId).single();
  if (error || !conversationData) notFound();
  const conversation = conversationData as unknown as ConversationRow;
  const [{ data: classData }, { data: participantData }, { data: messageData }] = await Promise.all([
    supabase.from("classes").select("id, class_code, subject_name, class_name").eq("id", conversation.class_id).single(),
    supabase.from("conversation_participants").select("conversation_id, user_id, joined_at, last_read_at, is_muted").eq("conversation_id", conversationId),
    supabase.from("messages").select(MESSAGE_SELECT).eq("conversation_id", conversationId).order("created_at", { ascending: true }),
  ]);
  const participants = (participantData ?? []) as unknown as ConversationParticipantRow[];
  if (!participants.some((row) => row.user_id === userId)) notFound();
  const messages = (messageData ?? []) as unknown as MessageRow[];
  const profileIds = [...new Set([...participants.map((row) => row.user_id), ...messages.map((row) => row.sender_id)])];
  const messageIds = messages.map((row) => row.id);
  const [{ data: profileData }, { data: attachmentData }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, role").in("id", profileIds),
    messageIds.length
      ? supabase.from("message_attachments").select("id, message_id, storage_path, file_name, mime_type, file_size, created_at").in("message_id", messageIds).order("created_at")
      : Promise.resolve({ data: [] as MessageAttachmentRow[] }),
  ]);
  const profiles = (profileData ?? []) as Array<Pick<Profile, "id" | "display_name" | "role">>;
  const profileMap = new Map(profiles.map((row) => [row.id, row]));
  const signedAttachments = await signCommunicationFiles((attachmentData ?? []) as unknown as MessageAttachmentRow[]);
  const attachmentMap = new Map<string, MessageAttachmentRow[]>();
  for (const row of signedAttachments) {
    const list = attachmentMap.get(row.message_id) ?? [];
    list.push(row);
    attachmentMap.set(row.message_id, list);
  }
  const classRow = (classData ?? { class_code: "-", subject_name: "รายวิชา", class_name: "" }) as { class_code: string; subject_name: string; class_name: string };
  return {
    conversation: {
      ...conversation,
      class_code: classRow.class_code,
      subject_name: classRow.subject_name,
      class_name: classRow.class_name,
    },
    participants: participants.map((row) => ({
      ...row,
      display_name: profileMap.get(row.user_id)?.display_name ?? "ผู้ใช้งาน",
      role: (profileMap.get(row.user_id)?.role ?? "student") as AppRole,
    })),
    messages: messages.map((row) => ({
      ...row,
      body: row.deleted_at ? "ข้อความถูกลบ" : row.body,
      sender_name: profileMap.get(row.sender_id)?.display_name ?? "ผู้ใช้งาน",
      sender_role: (profileMap.get(row.sender_id)?.role ?? "student") as AppRole,
      attachments: attachmentMap.get(row.id) ?? [],
    } satisfies ConversationMessage)),
  };
}

export async function getCommunicationCounts(userId: string, role: AppRole): Promise<CommunicationCounts> {
  const [conversations, announcements] = await Promise.all([
    getConversations(userId),
    role === "student" ? getStudentAnnouncements(userId) : Promise.resolve([]),
  ]);
  const unreadAnnouncements = announcements.filter((row) => !row.is_read).length;
  const unreadMessages = conversations.reduce((sum, row) => sum + row.unread_count, 0);
  return { unreadAnnouncements, unreadMessages, totalUnread: unreadAnnouncements + unreadMessages };
}
