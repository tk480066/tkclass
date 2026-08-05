# TK Mooc Phase 8.3 — ข่าว กิจกรรม สถิติ และลิงก์ที่เกี่ยวข้อง

ต่อยอดจาก Phase 8.2 โดยเปลี่ยนข้อมูลตัวอย่างบนหน้าหลักเป็นข้อมูลจริงที่ Admin จัดการผ่าน Supabase

## หน้า Admin

- `/admin/content/news` ข่าวสารและประกาศสาธารณะ
- `/admin/content/events` ปฏิทินและกิจกรรม
- `/admin/content/statistics` สถิติอัตโนมัติหรือกำหนดเอง
- `/admin/content/links` ลิงก์และบริการที่เกี่ยวข้อง

## Migration

รัน `supabase/migrations/0010_phase8_3_public_content.sql` หลัง Migration 0009 จากนั้นตรวจด้วย `supabase/verify_phase8_3.sql`

## ตารางใหม่

- `site_news_items`
- `site_events`
- `site_stat_items`
- `site_related_links`

ทุกตารางเปิด RLS ผู้ใช้ทั่วไปอ่านเฉพาะข้อมูลที่เปิดแสดง ส่วน Admin จัดการได้ทั้งหมด

## การติดตั้ง Patch

```bash
cd ~/Downloads
unzip TK_Mooc_Phase8_3_Patch_v8.3.0.zip
rsync -av ~/Downloads/TK_Mooc_Phase8_3_Patch_v8.3.0/ /Users/tkping/projects/TK_Mooc_Phase1/
```

จากนั้น:

```bash
cd /Users/tkping/projects/TK_Mooc_Phase1
rm -rf .next
npm run typecheck
npm run build
npm run dev
```

## สถิติอัตโนมัติ

รองรับ `courses`, `classes`, `teachers`, `students`, `lessons` และ `manual` โดยระบบจะนับข้อมูลจากฐานข้อมูลเมื่อเปิดหน้าหลัก
