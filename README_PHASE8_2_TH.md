# TK Mooc Phase 8.2 — จัดการ Section และการเรียงลำดับ

Phase 8.2 ต่อยอดจาก Phase 8.1 เพิ่มระบบให้ Admin ควบคุมลำดับและการแสดงผลของส่วนต่าง ๆ บนหน้าหลักจาก Supabase

## ความสามารถ

- แสดง/ซ่อน Hero, พื้นที่ครู–นักเรียน, ข่าวสาร, ปฏิทิน และลิงก์ที่เกี่ยวข้อง
- แก้ไขข้อความเหนือหัวข้อ ชื่อ Section และคำอธิบาย
- เลื่อน Section ขึ้นหรือลงโดยไม่แก้โค้ด
- กำหนดลำดับด้วยตัวเลข
- เลือกพื้นหลัง ปกติ อ่อน น้ำเงิน หรือเข้ม
- เพิ่ม Section แบบข้อความกำหนดเอง
- เพิ่ม Section แบบ Call to Action พร้อมปุ่มและลิงก์
- ลบ Section ที่ Admin สร้างเอง
- Section หลักของระบบลบไม่ได้ แต่ซ่อนได้
- บันทึก Audit event และอัปเดตหน้าหลักทันที

## เส้นทาง Admin

```text
/admin/content/homepage   Header, เมนู, Hero และ Footer
/admin/content/sections   Section และการเรียงลำดับ
```

## ติดตั้งจาก Phase 8.1

```bash
cd ~/Downloads
unzip TK_Mooc_Phase8_2_Patch_v8.2.0.zip
rsync -av ~/Downloads/TK_Mooc_Phase8_2_Patch_v8.2.0/ /Users/tkping/projects/TK_Mooc_Phase1/
```

รัน SQL:

```text
supabase/migrations/0009_phase8_2_homepage_sections.sql
```

ตรวจสอบด้วย:

```text
supabase/verify_phase8_2.sql
```

จากนั้น:

```bash
cd /Users/tkping/projects/TK_Mooc_Phase1
rm -rf .next
npm install
npm run typecheck
npm run build
npm run dev
```

เปิด `http://localhost:3000/admin/content/sections`

## ตารางใหม่

```text
site_homepage_sections
```

ชนิด Section:

```text
hero
roles
news
calendar
links
custom_text
cta
```

## หมายเหตุ

Phase 8.2 จัดการโครงสร้างและหัวข้อของ Section ส่วนข้อมูลข่าว กิจกรรม สถิติ และลิงก์แบบ CRUD เต็มรูปแบบจะพัฒนาใน Phase 8.3
