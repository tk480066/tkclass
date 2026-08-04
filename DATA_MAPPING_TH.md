# การเตรียมและจับคู่ข้อมูล Phase 7

Phase 7 รองรับการย้ายข้อมูลจาก Google Sheets หรือระบบเดิมผ่าน CSV โดยใช้รหัสภายนอกที่อ่านง่าย เช่น `teacher_code`, `student_code`, `class_code`, `unit_code` และ `lesson_code`

ระบบบันทึกการจับคู่รหัสเดิมกับ UUID ใหม่ไว้ในตาราง `migration_key_map` จึงสามารถรันไฟล์เดิมซ้ำเพื่ออัปเดตข้อมูลได้โดยไม่สร้างหน่วย บทเรียน งาน หรือแบบทดสอบซ้ำ

## ลำดับไฟล์ที่ระบบนำเข้า

1. `teachers.csv`
2. `students.csv`
3. `classes.csv`
4. `enrollments.csv`
5. `units.csv`
6. `lessons.csv`
7. `lesson_blocks.csv`
8. `assignments.csv`
9. `assignment_targets.csv`
10. `assignment_attachments.csv`
11. `quizzes.csv`
12. `quiz_questions.csv`
13. `quiz_options.csv`
14. `attendance_sessions.csv`
15. `attendance_records.csv`
16. `grade_settings.csv`
17. `grade_categories.csv`
18. `grade_items.csv`
19. `grade_entries.csv`
20. `announcements.csv`
21. `announcement_attachments.csv`

ไฟล์ที่ไม่ต้องใช้สามารถไม่สร้างหรือปล่อยให้มีเฉพาะหัวตารางได้

## การส่งออกจาก Google Sheets

สำหรับแต่ละชีต:

1. ตั้งชื่อคอลัมน์ให้ตรงกับไฟล์ใน `migration_templates/`
2. ตรวจว่าไม่มีรหัสซ้ำ
3. เลือก **File → Download → Comma-separated values (.csv)**
4. บันทึกลงโฟลเดอร์ `migration_data/`
5. เก็บไฟล์เป็น UTF-8

## กฎข้อมูลสำคัญ

### ครู

- `teacher_code` ต้องไม่ซ้ำ
- `email` ต้องเป็นอีเมลจริงและไม่ซ้ำ
- บัญชีใหม่ต้องมี `password` หรือกำหนด `MIGRATION_DEFAULT_TEACHER_PASSWORD`
- ระบบจะไม่เปลี่ยนรหัสผ่านบัญชีเดิม เว้นแต่รันด้วย `--reset-passwords`

### นักเรียน

- `student_code` ต้องเป็นตัวเลข 5 หลัก
- นักเรียนจะใช้อีเมลภายในรูปแบบ `รหัสนักเรียน@students.tkmooc.local`
- บัญชีใหม่ต้องมี `pin` หรือกำหนด `MIGRATION_DEFAULT_STUDENT_PIN`
- PIN ควรเป็นอย่างน้อย 6 หลักและไม่ควรใช้ค่าเดียวกันทั้งโรงเรียนในระบบจริง

### วันและเวลา

แนะนำรูปแบบ ISO 8601 พร้อมเขตเวลาไทย:

```text
2026-05-01T08:00:00+07:00
```

### ค่าหลายรายการ

ใช้เครื่องหมาย `|` หรือ `;` เช่น:

```text
text|file|link
```

### JSON

คอลัมน์ `metadata_json` และ `rubric_json` ต้องเป็น JSON ที่ถูกต้อง เช่น:

```json
{}
```

หรือ

```json
[{"criterion":"ความถูกต้อง","points":5}]
```

## ข้อมูลที่ CSV Importer ชุดนี้ยังไม่ย้ายโดยตรง

เนื่องจากมีความสัมพันธ์และไฟล์จำนวนมาก ข้อมูลต่อไปนี้ไม่ได้รวมในตัวนำเข้า CSV อัตโนมัติ:

- ไฟล์จริงใน Supabase Storage
- ผลงานและไฟล์ส่งงานย้อนหลัง
- การตอบกิจกรรมในบทเรียนย้อนหลัง
- Attempts และคำตอบแบบทดสอบย้อนหลัง
- การสนทนาและข้อความย้อนหลัง
- สถานะอ่านประกาศย้อนหลัง

ข้อมูลกลุ่มนี้ควรใช้วิธีใดวิธีหนึ่ง:

1. เก็บระบบเดิมแบบ Read-only ไว้ช่วงเปลี่ยนผ่าน
2. เขียน ETL เฉพาะตามโครงสร้างข้อมูลจริง
3. ใช้ `phase7:backup --include-storage` เมื่อย้ายระหว่าง Supabase Projects
4. นำเข้าคะแนนสรุปย้อนหลังผ่าน `grade_items.csv` และ `grade_entries.csv`

## ตรวจสอบก่อนนำเข้าจริง

```bash
npm run phase7:import -- --dir=./migration_data --dry-run
```

เมื่อไม่มี Error จึงรันจริง:

```bash
npm run phase7:import -- --dir=./migration_data --label="Google Sheets ปีการศึกษา 2569"
```

กรณีต้องการหยุดทันทีเมื่อเจอแถวผิด:

```bash
npm run phase7:import -- --dir=./migration_data --stop-on-error
```

กรณีตั้งใจรีเซ็ตรหัสผ่านจาก CSV:

```bash
npm run phase7:import -- --dir=./migration_data --reset-passwords
```

อย่าใช้ `--reset-passwords` หลังเปิดระบบจริงโดยไม่มีแผนแจ้งผู้ใช้
