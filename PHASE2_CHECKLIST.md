# TK Mooc Phase 2 Checklist

## Database

- [ ] รัน `0001_phase1_foundation.sql` แล้ว
- [ ] รัน `0002_phase2_classes_lessons.sql`
- [ ] พบตาราง units, lessons, lesson_blocks, lesson_progress, lesson_responses
- [ ] RLS เปิดครบทุกตาราง
- [ ] พบ Bucket `course-content` และเป็น Private
- [ ] รัน `verify_phase2.sql` ผ่าน

## Demo data

- [ ] `npm run create-demo-users`
- [ ] `npm run seed-phase2`
- [ ] ครู Login ได้
- [ ] นักเรียน 10001 Login ได้

## Teacher tests

- [ ] สร้างและแก้ไขชั้นเรียน
- [ ] เพิ่มนักเรียนเดิม
- [ ] นำเข้า CSV
- [ ] สร้างหน่วย
- [ ] สร้างบทเรียน
- [ ] เพิ่มบล็อกข้อความ
- [ ] อัปโหลดรูป/ไฟล์
- [ ] เพิ่ม YouTube link
- [ ] เผยแพร่หน่วยและบทเรียน

## Student tests

- [ ] เห็นเฉพาะวิชาที่ลงทะเบียน
- [ ] เห็นชื่อครู
- [ ] เปิดบทเรียนที่เผยแพร่
- [ ] เล่นวิดีโอ/เปิดเอกสาร
- [ ] ตอบกิจกรรมระหว่างบท
- [ ] เริ่มเรียน
- [ ] ทำเครื่องหมายเรียนจบ
- [ ] เปอร์เซ็นต์รายวิชาเปลี่ยนตาม Progress

## Production

- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] Push GitHub
- [ ] Vercel Deploy ผ่าน
- [ ] Environment Variables ครบ
- [ ] ทดสอบ RLS ด้วยครูอย่างน้อย 2 บัญชีและนักเรียนอย่างน้อย 2 บัญชี
