# TK Mooc Phase 8.1 v8.1.0 — Changelog

## เพิ่มใหม่

- Homepage CMS สำหรับ Header, เมนู, Hero และ Footer
- หน้า `/admin` แบบศูนย์รวมเครื่องมือ Admin
- หน้า `/admin/content/homepage`
- ตาราง `site_homepage_settings`
- ตาราง `site_navigation_items`
- Public Storage Bucket `site-assets` พร้อม Admin-only write policies
- อัปโหลดโลโก้และภาพ Hero
- Hero visual mode: phone, image, none
- Site brand component ที่ใช้โลโก้และชื่อจากฐานข้อมูล
- Homepage fallback เมื่อฐานข้อมูล CMS ยังไม่พร้อม
- Audit logging และการรีเฟรชหน้าหลักหลังบันทึก
- SQL ตรวจสอบ `verify_phase8_1.sql`

## ปรับปรุง

- `app/page.tsx` ดึง Header, Hero, Footer และเมนูจาก Supabase
- เพิ่มทางลัด Homepage CMS ใน Admin Launch Center
- ตั้ง `schema_version` เป็น `8.1.0`
- เพิ่ม Phase 8.1 ใน Preflight table/bucket checks
- จำกัด Server Action body เป็น 4.25 MB และจำกัดรูปจริง 4 MB

## ยังไม่รวมในรุ่นนี้

- Draft และ Preview ของข้อมูลที่ยังไม่เผยแพร่
- Scheduled publishing
- Revision history และ Rollback เนื้อหา
- Drag and Drop เมนู
- Theme editor แบบเต็ม
- Section builder สำหรับข่าว กิจกรรม สถิติ และลิงก์
