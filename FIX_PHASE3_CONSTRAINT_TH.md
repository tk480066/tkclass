# TK Mooc Phase 3 v3.0.1 — แก้ Constraint ซ้ำ

## ปัญหา

เมื่อรัน Migration Phase 3 พบข้อผิดพลาด:

```text
ERROR: 42710: check constraint "assignments_passing_score_check" already exists
```

สาเหตุเกิดจากคอลัมน์ `passing_score` มี inline CHECK ซึ่ง PostgreSQL ตั้งชื่ออัตโนมัติเป็น
`assignments_passing_score_check` และในตารางเดียวกันมีการประกาศ Constraint ชื่อนี้ซ้ำอีกครั้ง

## การแก้ไข

เดิม:

```sql
passing_score numeric(8,2) check (passing_score is null or passing_score >= 0),
...
constraint assignments_passing_score_check check (
  passing_score is null or passing_score <= max_score
),
```

แก้เป็น Constraint เดียว:

```sql
passing_score numeric(8,2),
...
constraint assignments_passing_score_check check (
  passing_score is null
  or (passing_score >= 0 and passing_score <= max_score)
),
```

## วิธีดำเนินการ

1. เปิด Supabase SQL Editor แล้วรัน `rollback;` หนึ่งครั้ง เพื่อยกเลิก Transaction ที่อาจค้างอยู่
2. ใช้ไฟล์ที่แก้แล้ว:
   `supabase/migrations/0003_phase3_assignments_submissions.sql`
3. คัดลอก SQL ทั้งไฟล์และรันใหม่ตั้งแต่ต้น
4. หลังสำเร็จ รัน `supabase/verify_phase3.sql`

Migration มี `begin;` และ `commit;` ครอบอยู่ ดังนั้นการรันเดิมที่ล้มเหลวก่อน `commit;`
โดยปกติจะไม่ทิ้งตาราง Phase 3 แบบครึ่งหนึ่งไว้ในฐานข้อมูล
