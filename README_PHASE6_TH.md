# TK Mooc Phase 6 — การสื่อสาร

Phase 6 พัฒนาต่อยอดจาก Phase 5 โดยเพิ่มระบบประกาศ การสนทนาแบบรายบุคคล การติดตามสถานะอ่าน และไฟล์แนบภายในระบบ

## ความสามารถระบบครู

- Dashboard การสื่อสารพร้อมสถิติประกาศและข้อความที่ยังไม่อ่าน
- สร้างประกาศแยกตามชั้นเรียน
- กำหนดระดับทั่วไป สำคัญ หรือเร่งด่วน
- บันทึกฉบับร่าง เผยแพร่ หรือเก็บเข้าคลัง
- กำหนดเวลาเผยแพร่และเวลาสิ้นสุด
- ปักหมุดประกาศสำคัญ
- อัปโหลดเอกสารประกอบและเพิ่มลิงก์ภายนอก
- ดูจำนวนผู้เรียนที่อ่านประกาศ
- เริ่มการสนทนารายบุคคลกับนักเรียนในชั้นเรียน
- ส่งข้อความ แนบไฟล์ และปิดการสนทนา

## ความสามารถระบบนักเรียน

- ดูประกาศจากทุกวิชาที่ลงทะเบียน
- แสดงประกาศใหม่ ประกาศปักหมุด และระดับความสำคัญ
- เปิดไฟล์และลิงก์ประกอบ
- ทำเครื่องหมายว่าอ่านประกาศแล้ว
- เริ่มการสนทนากับครูจากรายวิชาของตน
- ส่งข้อความและแนบไฟล์กับข้อความล่าสุด
- ดูจำนวนข้อความที่ยังไม่อ่าน

## ตารางฐานข้อมูลใหม่

```text
announcements
announcement_attachments
announcement_reads
conversations
conversation_participants
messages
message_attachments
```

Storage Bucket:

```text
communication-files
```

## การติดตั้งจาก Phase 5

สำรองโครงการเดิม:

```bash
cd /Users/tkping/projects
cp -R TK_Mooc_Phase1 TK_Mooc_Phase5_backup_before_phase6
```

แตก ZIP และคัดลอกเข้าโครงการ:

```bash
cd ~/Downloads
unzip TK_Mooc_Phase6_v6.0.0.zip

rsync -av \
  --exclude='.git' \
  --exclude='.env.local' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.vercel' \
  ~/Downloads/TK_Mooc_Phase6_v6.0.0/ \
  /Users/tkping/projects/TK_Mooc_Phase1/
```

## รัน SQL

เปิดไฟล์:

```text
supabase/migrations/0006_phase6_communication.sql
```

นำไป Run ใน Supabase SQL Editor หลังจากรัน Phase 1–5 แล้ว

ลำดับ Migration:

```text
0001_phase1_foundation.sql
0002_phase2_classes_lessons.sql
0003_phase3_assignments_submissions.sql
0004_phase4_quizzes.sql
0005_phase5_attendance_gradebook.sql
0006_phase6_communication.sql
```

ตรวจสอบด้วย:

```text
supabase/verify_phase6.sql
```

## สร้างข้อมูลตัวอย่าง

```bash
cd /Users/tkping/projects/TK_Mooc_Phase1
npm install
npm run create-demo-users
npm run seed-phase2
npm run seed-phase3
npm run seed-phase4
npm run seed-phase5
npm run seed-phase6
```

ข้อมูลตัวอย่าง Phase 6 ประกอบด้วยประกาศ 3 รายการ สถานะอ่านตัวอย่าง และการสนทนาระหว่างครูกับนักเรียนรหัส 10001

## เส้นทางใหม่

ระบบครู:

```text
/teacher/communication
/teacher/communication/announcements
/teacher/communication/announcements/[announcementId]
/teacher/communication/messages
/teacher/communication/messages/[conversationId]
```

ระบบนักเรียน:

```text
/student/communication
/student/communication/announcements/[announcementId]
/student/communication/messages
/student/communication/messages/[conversationId]
```

## เปิดระบบ

```bash
rm -rf .next
npm run dev
```

เปิด `http://localhost:3000`

## ตรวจสอบก่อน Deploy

```bash
npm run typecheck
npm run build
```

จากนั้น Commit:

```bash
git add .
git commit -m "Develop TK Mooc Phase 6 communication"
git push origin main
```

## หมายเหตุด้านความปลอดภัย

- ตารางใหม่เปิด Row Level Security ทุกตาราง
- ครูเห็นเฉพาะประกาศและการสนทนาในชั้นเรียนของตน
- นักเรียนเห็นเฉพาะประกาศที่เผยแพร่และยังไม่หมดอายุในวิชาที่ลงทะเบียน
- การสนทนาอ่านได้เฉพาะผู้เข้าร่วม
- Storage เป็น Private Bucket และเปิดไฟล์ผ่าน Signed URL
- `SUPABASE_SECRET_KEY` ใช้เฉพาะ Seed Script และฝั่ง Server เท่านั้น
