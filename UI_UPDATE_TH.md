# UI Update v1.0.4 — Blue & White Showcase

เวอร์ชันนี้ปรับ UI ของ TK Mooc ให้ใกล้เคียงภาพตัวอย่างแนว Mobile App Showcase มากขึ้น โดยใช้ธีมสีน้ำเงิน-ขาวและเพิ่ม motion/animation ดังนี้

## สิ่งที่ปรับ

- หน้าแรกใช้โครงสร้าง Hero แบบข้อความซ้าย ภาพจำลองโทรศัพท์ขวา
- เปลี่ยนธีมหลักเป็นสีน้ำเงิน-ขาว พร้อม gradient ฟ้าเข้มถึงฟ้าอ่อน
- เพิ่ม section Features แบบ 3 การ์ดตรงกลาง
- เพิ่ม section Solution แบบภาพ mockup สลับกับข้อความ
- เพิ่ม section Workflow และ widget รายการคล้าย layout ภาพตัวอย่าง
- ปรับหน้า Login ให้เป็นสองคอลัมน์ในแนวเดียวกัน
- ปรับหน้า Dashboard เป็น blue-white glass UI

## Motion & Animation

- Scroll reveal เมื่อเลื่อนหน้าจอ
- Floating animation สำหรับโทรศัพท์และการ์ด mockup
- Animated bar chart
- Progress bar animation
- Hover lift บนการ์ด ปุ่ม และรายการ
- Shimmer effect บนปุ่มหลัก
- Orbit animation ใน section security
- รองรับ `prefers-reduced-motion`

## ไฟล์สำคัญที่แก้

- `app/page.tsx`
- `app/globals.css`
- `components/login-panel.tsx`
- `components/dashboard-shell.tsx`

## วิธีอัปเดตโครงการเดิม

```bash
cd /Users/tkping/projects/TK_Mooc_Phase1
npm install
rm -rf .next
npm run dev
```

กรณีคัดลอกไฟล์จากเวอร์ชันนี้เข้าโปรเจกต์เดิม ให้ทับเฉพาะไฟล์ที่ระบุด้านบน โดยไม่ต้องแก้ `.env.local`
