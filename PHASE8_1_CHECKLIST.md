# TK Mooc Phase 8.1 Checklist

## ฐานข้อมูล

- [ ] รัน `0008_phase8_1_homepage_cms.sql` หลัง Phase 7
- [ ] พบตาราง `site_homepage_settings`
- [ ] พบตาราง `site_navigation_items`
- [ ] RLS เปิดใช้งานทั้ง 2 ตาราง
- [ ] พบ Bucket `site-assets`
- [ ] Bucket จำกัด JPG, PNG, WebP และไฟล์ไม่เกิน 4 MB
- [ ] รัน `verify_phase8_1.sql` ผ่าน
- [ ] `schema_version` แสดง `8.1.0`

## สิทธิ์และความปลอดภัย

- [ ] Admin เปิด `/admin/content/homepage` ได้
- [ ] Teacher และ Student ถูกปฏิเสธจากหน้า CMS
- [ ] ผู้ใช้ทั่วไปอ่านหน้าหลักได้โดยไม่ Login
- [ ] ผู้ใช้ทั่วไปอัปโหลดหรือลบไฟล์ใน `site-assets` ไม่ได้
- [ ] URL ที่ไม่ปลอดภัย เช่น `javascript:` ถูกปฏิเสธ
- [ ] Audit event ถูกบันทึกหลังแก้ไข

## Header และเมนู

- [ ] เปลี่ยนชื่อเว็บไซต์และคำโปรยได้
- [ ] เปิด/ปิดคำโปรยได้
- [ ] เปิด/ปิด Dark mode button ได้
- [ ] เปลี่ยนข้อความ Login/Dashboard ได้
- [ ] อัปโหลดและลบโลโก้ได้
- [ ] เพิ่ม แก้ไข ซ่อน และลบเมนูได้
- [ ] ลำดับเมนูทำงานถูกต้อง
- [ ] ลิงก์เปิดแท็บใหม่ทำงานถูกต้อง

## Hero

- [ ] เปิด/ซ่อน Hero ได้
- [ ] แก้ไขข้อความและปุ่มได้
- [ ] โหมดโทรศัพท์จำลองแสดงถูกต้อง
- [ ] โหมดรูปภาพอัปโหลดและแสดงถูกต้อง
- [ ] โหมดไม่แสดงภาพจัดกึ่งกลางถูกต้อง
- [ ] ลบภาพ Hero แล้วกลับเป็นโหมดโทรศัพท์ได้

## Footer

- [ ] เปิด/ซ่อน Footer ได้
- [ ] ข้อมูลติดต่อแสดงถูกต้อง
- [ ] Facebook, YouTube และ LINE เปิดลิงก์ถูกต้อง
- [ ] Copyright และ Technology แสดงถูกต้อง

## Responsive และคุณภาพ

- [ ] Desktop 1440px แสดงถูกต้อง
- [ ] Tablet 768px แสดงถูกต้อง
- [ ] Mobile 375px แสดงถูกต้อง
- [ ] Light mode และ Dark mode อ่านง่าย
- [ ] รูปภาพมี Alt text
- [ ] Menu bar ยัง Fixed และเลื่อนตามหน้า
- [ ] `npm run typecheck` ผ่าน
- [ ] `npm run build` ผ่าน
- [ ] Preview Deployment ผ่านการตรวจ
