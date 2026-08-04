# TK Mooc Phase 4 — แบบทดสอบและการประเมินผล

Phase 4 พัฒนาต่อยอดจาก Phase 3 โดยคงระบบ Next.js, Supabase Auth, Row Level Security, ชั้นเรียน บทเรียน งานและการส่งงาน รวมถึง UI และ Dark mode เดิม พร้อมเพิ่มระบบแบบทดสอบออนไลน์สำหรับครูและนักเรียน

## ความสามารถระบบครู

- Dashboard สรุปจำนวนแบบทดสอบ แบบทดสอบที่เผยแพร่ จำนวนครั้งที่เข้าสอบ และคำตอบที่รอตรวจ
- สร้างแบบทดสอบแยกตามชั้นเรียน และเชื่อมกับบทเรียนได้
- กำหนดคำชี้แจง วันเวลาเปิด–ปิด เวลาทำ จำนวนครั้งที่ทำได้ และเกณฑ์ผ่าน
- เลือกสุ่มลำดับคำถามและสุ่มตัวเลือก
- เลือกแสดงคะแนนหลังส่งและกำหนดการเปิดเผยคำตอบ
- สร้างคำถาม 5 รูปแบบ:
  - เลือกคำตอบเดียว
  - เลือกได้หลายคำตอบ
  - จริง–เท็จ
  - คำตอบสั้น
  - คำตอบอธิบาย
- กำหนดคะแนน ลำดับ ความจำเป็นต้องตอบ และคำอธิบายเฉลย
- ตรวจคำตอบปรนัยและคำตอบสั้นอัตโนมัติ
- ตรวจคำตอบอธิบายด้วยตนเอง พร้อมให้คะแนนและความคิดเห็น
- ดูผลการทำรายคน จำนวนครั้ง คะแนน เปอร์เซ็นต์ และสถานะผ่าน
- เก็บแบบทดสอบเข้าคลัง

## ความสามารถระบบนักเรียน

- Dashboard แสดงจำนวนแบบทดสอบที่กำลังเปิด
- ดูแบบทดสอบที่เผยแพร่และปิดแล้วตามรายวิชาที่ลงทะเบียน
- ดูคำชี้แจง จำนวนข้อ คะแนนเต็ม เวลาทำ จำนวนครั้ง และเกณฑ์ผ่าน
- เริ่มทำหรือกลับมาทำ Attempt ที่ยังไม่เสร็จ
- บันทึกคำตอบเป็นฉบับร่าง
- ตัวจับเวลาส่งแบบทดสอบอัตโนมัติเมื่อหมดเวลา
- รองรับคำตอบแบบตัวเลือก คำตอบสั้น และคำตอบอธิบาย
- ดูผลคะแนน สถานะผ่าน และความคิดเห็นจากครู
- คำตอบที่ถูกต้องไม่ถูกส่งตรงมายัง Browser ระหว่างทำแบบทดสอบ

## ตารางฐานข้อมูลใหม่

```text
quizzes
quiz_questions
quiz_options
quiz_attempts
quiz_answers
```

## ฟังก์ชันฐานข้อมูลสำคัญ

```text
get_quiz_question_count
get_my_quiz_attempts
start_quiz_attempt
get_quiz_attempt_payload
get_quiz_attempt_result
submit_quiz_attempt
recalculate_quiz_attempt
```

ฟังก์ชันเหล่านี้ใช้สำหรับเริ่ม Attempt ส่ง Payload ที่ไม่เปิดเผยเฉลย ตรวจคำตอบอัตโนมัติ และคำนวณคะแนนใหม่หลังครูตรวจข้ออธิบาย

---

## 1. สำรองโครงการเดิม

```bash
cd /Users/tkping/projects
cp -R TK_Mooc_Phase1 TK_Mooc_Phase3_backup_before_phase4
```

แม้ชื่อโฟลเดอร์ยังเป็น `TK_Mooc_Phase1` ก็สามารถพัฒนาต่อในโฟลเดอร์เดิมได้

## 2. แตกและคัดลอก Phase 4

```bash
cd ~/Downloads
unzip TK_Mooc_Phase4_v4.0.0.zip

rsync -av \
  --exclude='.git' \
  --exclude='.env.local' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.vercel' \
  ~/Downloads/TK_Mooc_Phase4_v4.0.0/ \
  /Users/tkping/projects/TK_Mooc_Phase1/
```

## 3. รัน SQL ตามลำดับ

Migration ต้องทำตามลำดับนี้:

```text
0001_phase1_foundation.sql
0002_phase2_classes_lessons.sql
0003_phase3_assignments_submissions.sql  ← ใช้ไฟล์ที่แก้ Constraint แล้ว
0004_phase4_quizzes.sql
```

เปิดไฟล์:

```text
supabase/migrations/0004_phase4_quizzes.sql
```

แล้วนำ SQL ทั้งหมดไปรันที่:

```text
Supabase Dashboard
→ SQL Editor
→ New query
→ Run
```

Migration Phase 4 ครอบด้วย `begin` และ `commit` หากเกิดข้อผิดพลาดระหว่างรัน รายการในรอบนั้นจะไม่ถูก Commit

ตรวจสอบด้วย:

```text
supabase/verify_phase4.sql
```

ควรพบตาราง 5 ตาราง Enum 3 รายการ และฟังก์ชัน Phase 4 ครบ

## 4. Environment Variables

ใช้ค่าเดิมจาก Phase ก่อนหน้า:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
SUPABASE_SECRET_KEY=sb_secret_xxxxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`SUPABASE_SECRET_KEY` ใช้เฉพาะ Script ฝั่ง Server สำหรับข้อมูลตัวอย่าง ห้ามใส่ใน Client Component และห้าม Commit `.env.local`

## 5. สร้างข้อมูลตัวอย่าง

รันตามลำดับ:

```bash
cd /Users/tkping/projects/TK_Mooc_Phase1
npm install
npm run create-demo-users
npm run seed-phase2
npm run seed-phase3
npm run seed-phase4
```

`seed-phase4` จะสร้างแบบทดสอบตัวอย่างเรื่อง **แนวคิดเชิงคำนวณ** ประกอบด้วยคำถามครบ 5 รูปแบบ

ข้อมูลผลการทำตัวอย่าง:

```text
นักเรียน 10001  ตรวจแล้ว 90%
นักเรียน 10002  รอครูตรวจข้ออธิบาย
```

### บัญชีครู

```text
Email: teacher@tkmooc.local
Password: TKMOOC@1234
```

### บัญชีนักเรียน

```text
10001 / 123456
10002 / 123456
10003 / 123456
10004 / 123456
```

## 6. เปิดระบบในเครื่อง

```bash
rm -rf .next
npm run dev
```

เปิด:

```text
http://localhost:3000
```

## 7. เส้นทางระบบครู

```text
/teacher/quizzes
/teacher/classes/[classId]/quizzes
/teacher/quizzes/[quizId]
/teacher/quizzes/[quizId]/attempts/[attemptId]
```

## 8. เส้นทางระบบนักเรียน

```text
/student/quizzes
/student/quizzes/[quizId]
/student/quizzes/attempts/[attemptId]
/student/quizzes/attempts/[attemptId]/result
```

## 9. ขั้นตอนทดสอบระบบครู

1. Login ด้วยบัญชีครู
2. เปิดเมนู `แบบทดสอบ`
3. เลือกชั้นเรียนและสร้างแบบทดสอบ
4. หลังบันทึก กด `เพิ่มคำถามและจัดการแบบทดสอบ`
5. เพิ่มคำถามให้ครบอย่างน้อย 2–3 รูปแบบ
6. ตั้งสถานะเป็น `เผยแพร่และเปิดทำ`
7. Login เป็นนักเรียนแล้วทำแบบทดสอบ
8. กลับเป็นครู เปิดผลการทำของนักเรียน
9. ให้คะแนนข้อคำตอบอธิบายและบันทึกความคิดเห็น
10. ตรวจว่าเปอร์เซ็นต์และสถานะผ่านถูกคำนวณใหม่

## 10. ขั้นตอนทดสอบระบบนักเรียน

1. Login ด้วยรหัสนักเรียน `10001`
2. เปิดเมนู `แบบทดสอบ`
3. เปิดแบบทดสอบที่กำลังเปิด
4. กดเริ่มทำ
5. ตอบบางข้อแล้วบันทึกฉบับร่าง
6. กลับเข้ามาทำต่อ
7. ตอบคำถามที่บังคับให้ครบและกดส่ง
8. ตรวจคะแนนและสถานะผ่าน
9. Login ด้วย `10002` เพื่อตรวจสถานะรอครูตรวจข้ออธิบาย

## 11. ตรวจสอบก่อน Deploy

```bash
npm run typecheck
npm run build
```

จากนั้น Commit:

```bash
git add .
git commit -m "Develop TK Mooc Phase 4 quizzes"
git push origin main
```

Vercel ต้องมี Environment Variables เดิมครบทุกตัว และควร Redeploy หลังเปลี่ยนค่า Environment Variable

## Security Design

- ตาราง Phase 4 เปิด Row Level Security ทุกตาราง
- ครูจัดการได้เฉพาะแบบทดสอบในชั้นเรียนของตน
- นักเรียนเห็นเฉพาะแบบทดสอบของรายวิชาที่ลงทะเบียน
- นักเรียนอ่าน `quiz_questions`, `quiz_options`, `quiz_attempts` และ `quiz_answers` โดยตรงไม่ได้
- Payload ระหว่างทำข้อสอบไม่มี `is_correct`, `accepted_answers` หรือคำอธิบายเฉลย
- ผลคะแนนและสถานะถูก–ผิดถูก Mask ใน Database Function เมื่อครูปิดการแสดงคะแนน
- การเริ่มและส่ง Attempt ดำเนินการผ่าน Database Function
- Trigger ป้องกันนักเรียนกำหนดคะแนนหรือสถานะถูก–ผิดจาก Browser
- การตรวจสิทธิ์ไม่ได้พึ่งการซ่อนปุ่มเพียงอย่างเดียว แต่ตรวจทั้ง Server และฐานข้อมูล

## ข้อจำกัดใน Phase 4

- ยังไม่มี Question Bank กลางสำหรับคัดลอกคำถามข้ามแบบทดสอบ
- ยังไม่มีการนำเข้าแบบทดสอบจาก CSV หรือ Google Forms
- ยังไม่มีข้อสอบแบบจับคู่ เรียงลำดับ เติมคำหลายช่อง หรืออัปโหลดไฟล์เป็นคำตอบ
- ยังไม่มี Safe Exam Browser หรือระบบตรวจจับการออกจากหน้าจอ
- การแก้ไขคำถามหลังมีนักเรียนส่งแล้วควรทำอย่างระมัดระวัง เพราะอาจกระทบการตีความผลย้อนหลัง
- การแสดงเฉลยรายข้อแบบละเอียดจะพัฒนาต่อเมื่อเพิ่มระบบกำหนดวันเผยแพร่ผล
