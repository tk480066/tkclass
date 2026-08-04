import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function findUserByEmail(email) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const found = data.users.find((user) => user.email === email);
    if (found) return found;
    if (data.users.length < 100) return null;
  }
  return null;
}

function isoOffset(hours) {
  return new Date(Date.now() + hours * 3600000).toISOString();
}

async function main() {
  const teacher = await findUserByEmail("teacher@tkmooc.local");
  const students = await Promise.all(["10001", "10002", "10003", "10004"].map((code) => findUserByEmail(`${code}@students.tkmooc.local`)));
  if (!teacher || students.some((student) => !student)) {
    throw new Error("Run create-demo-users and seed-phase2 before seed-phase6");
  }

  const { data: classRow, error: classError } = await admin
    .from("classes")
    .select("id, class_code, subject_name")
    .eq("teacher_id", teacher.id)
    .eq("class_code", "CS-M2-01")
    .single();
  if (classError) throw classError;

  const classId = classRow.id;
  const studentRows = students.filter(Boolean);

  const { data: oldAnnouncements, error: oldAnnouncementError } = await admin
    .from("announcements")
    .select("id")
    .eq("class_id", classId)
    .like("title", "[Demo]%");
  if (oldAnnouncementError) throw oldAnnouncementError;
  if (oldAnnouncements?.length) {
    const { error } = await admin.from("announcements").delete().in("id", oldAnnouncements.map((row) => row.id));
    if (error) throw error;
  }

  const { data: announcements, error: announcementError } = await admin
    .from("announcements")
    .insert([
      {
        class_id: classId,
        author_id: teacher.id,
        title: "[Demo] แจ้งกำหนดส่งโครงงานผังงาน",
        body: "นักเรียนทุกคนกรุณาตรวจสอบไฟล์งานและส่งโครงงานภายในวันศุกร์ เวลา 16.30 น. หากมีข้อสงสัยสามารถส่งข้อความถึงครูได้จากเมนูการสื่อสาร",
        priority: "urgent",
        status: "published",
        publish_at: isoOffset(-3),
        expires_at: isoOffset(96),
        is_pinned: true,
      },
      {
        class_id: classId,
        author_id: teacher.id,
        title: "[Demo] สรุปกิจกรรมสัปดาห์นี้",
        body: "สัปดาห์นี้เราเรียนเรื่องแนวคิดเชิงคำนวณและฝึกออกแบบผังงาน นักเรียนสามารถกลับไปทบทวนบทเรียนและแบบทดสอบได้ตลอดเวลา",
        priority: "important",
        status: "published",
        publish_at: isoOffset(-24),
        expires_at: null,
        is_pinned: false,
      },
      {
        class_id: classId,
        author_id: teacher.id,
        title: "[Demo] ประกาศฉบับร่างสำหรับสัปดาห์หน้า",
        body: "ตัวอย่างประกาศที่ยังไม่เผยแพร่ให้นักเรียนเห็น",
        priority: "normal",
        status: "draft",
        publish_at: isoOffset(72),
        expires_at: null,
        is_pinned: false,
      },
    ])
    .select("id, title, status");
  if (announcementError) throw announcementError;

  const publishedAnnouncements = announcements.filter((row) => row.status === "published");
  const reads = [
    { announcement_id: publishedAnnouncements[0].id, user_id: studentRows[0].id, read_at: isoOffset(-2) },
    { announcement_id: publishedAnnouncements[0].id, user_id: studentRows[1].id, read_at: isoOffset(-1.5) },
    { announcement_id: publishedAnnouncements[1].id, user_id: studentRows[0].id, read_at: isoOffset(-10) },
  ];
  const { error: readsError } = await admin.from("announcement_reads").upsert(reads, { onConflict: "announcement_id,user_id" });
  if (readsError) throw readsError;

  const { data: oldConversations, error: oldConversationError } = await admin
    .from("conversations")
    .select("id")
    .eq("class_id", classId)
    .like("subject", "[Demo]%");
  if (oldConversationError) throw oldConversationError;
  if (oldConversations?.length) {
    const { error } = await admin.from("conversations").delete().in("id", oldConversations.map((row) => row.id));
    if (error) throw error;
  }

  const { data: conversation, error: conversationError } = await admin
    .from("conversations")
    .insert({
      class_id: classId,
      subject: "[Demo] ขอคำแนะนำเรื่องโครงงาน",
      created_by: studentRows[0].id,
      status: "active",
      last_message_at: isoOffset(-0.5),
    })
    .select("id")
    .single();
  if (conversationError) throw conversationError;

  const { error: participantError } = await admin.from("conversation_participants").insert([
    { conversation_id: conversation.id, user_id: teacher.id, last_read_at: isoOffset(-2) },
    { conversation_id: conversation.id, user_id: studentRows[0].id, last_read_at: isoOffset(-0.4) },
  ]);
  if (participantError) throw participantError;

  const { error: messageError } = await admin.from("messages").insert([
    {
      conversation_id: conversation.id,
      sender_id: studentRows[0].id,
      body: "คุณครูครับ ผมควรเริ่มโครงงานจากการวิเคราะห์ปัญหาหรือวาดผังงานก่อนครับ",
      created_at: isoOffset(-4),
    },
    {
      conversation_id: conversation.id,
      sender_id: teacher.id,
      body: "เริ่มจากเขียนปัญหาและข้อมูลเข้า-ออกให้ชัดเจนก่อน จากนั้นค่อยวาดผังงานครับ",
      created_at: isoOffset(-2),
    },
    {
      conversation_id: conversation.id,
      sender_id: studentRows[0].id,
      body: "เข้าใจแล้วครับ เดี๋ยวผมปรับและส่งฉบับร่างให้ครูตรวจอีกครั้ง",
      created_at: isoOffset(-0.5),
    },
  ]);
  if (messageError) throw messageError;

  console.log("Phase 6 demo data created successfully");
  console.log(`Class: ${classRow.class_code} · ${classRow.subject_name}`);
  console.log(`Announcements: ${announcements.length}`);
  console.log("Conversation created for student 10001");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
