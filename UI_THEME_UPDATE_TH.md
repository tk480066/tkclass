# TK Mooc Phase 1 v1.0.5 — Theme from TK Mooc Google Sites

เวอร์ชันนี้ปรับ UI โดยอ้างอิงจากวิดีโอบันทึกหน้าจอเว็บไซต์ TK Mooc ที่ผู้ใช้ส่งมา

## แนวทางการออกแบบที่นำมาใช้

- Header แบบลอยอยู่ด้านบน ขอบมน เงานุ่ม และพื้นหลังโปร่งเล็กน้อย
- โลโก้สี่เหลี่ยมมุมมนสีน้ำเงิน พร้อมชื่อ TK Mooc
- เมนูมีไอคอน ได้แก่ หน้าหลัก สำหรับครู สำหรับนักเรียน และเกี่ยวกับ
- Hero พื้นขาว ตัวอักษรสีน้ำเงินเข้ม พร้อมรูปทรงสีน้ำเงินด้านขวา
- ภาพจำลองโทรศัพท์ Dashboard และป้ายข้อมูลลอย
- การ์ดครูและนักเรียนขนาดใหญ่ พื้นขาว มุมมน และวงกลมสีฟ้าอ่อน
- ข่าวสารเป็นการ์ดภาพสีน้ำเงิน
- ปฏิทินพื้นขาวและช่องวันที่สีฟ้าอ่อน
- Footer สีน้ำเงินกรมท่า
- หน้า Login และ Dashboard ใช้ชุดสีและรูปแบบเดียวกับหน้าแรก
- มี Dark mode

## Motion & Animation

- Scroll reveal
- Floating phone mockup
- Floating information chips
- Hover lift บนการ์ด
- Progress bar animation
- Smooth button and menu interaction
- Form transition เมื่อเปลี่ยนประเภทผู้ใช้
- รองรับ prefers-reduced-motion

## ไฟล์ที่แก้ไข

- `app/page.tsx`
- `app/globals.css`
- `components/theme-toggle.tsx`
- `components/login-panel.tsx`
- `components/dashboard-shell.tsx`
- `components/submit-button.tsx`

## วิธีอัปเดตโครงการเดิม

```bash
cd /Users/tkping/projects/TK_Mooc_Phase1
npm install
rm -rf .next
npm run dev
```

การอัปเดตนี้ไม่เปลี่ยน `.env.local`, Supabase schema, RLS หรือบัญชีผู้ใช้งานเดิม
