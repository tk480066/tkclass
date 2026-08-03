# TK Mooc Phase 1 v1.0.3 — UI & Motion Update

## แนวทางการออกแบบ

UI ได้รับแรงบันดาลใจจากหน้า Mobile App Showcase ในไฟล์อ้างอิง โดยนำมาแปลงเป็นเอกลักษณ์ TK Mooc ดังนี้

- พื้นหลังไล่สีม่วง น้ำเงิน และชมพู
- กรอบเว็บไซต์สีเข้ม ขอบมน และพื้นที่เนื้อหาสีขาว
- Hero ขนาดใหญ่พร้อม Dashboard Mockup
- Section แบบสลับซ้าย–ขวา
- การ์ดขอบมน เงานุ่ม และไอคอนแบบ Gradient
- Motion ที่ไม่รบกวนการอ่าน

## ไฟล์ที่เพิ่ม

```text
components/brand-mark.tsx
components/scroll-reveal.tsx
UI_UPDATE_TH.md
```

## ไฟล์ที่ปรับปรุง

```text
app/globals.css
app/page.tsx
app/login/page.tsx
app/teacher/page.tsx
app/student/page.tsx
app/unauthorized/page.tsx
components/login-panel.tsx
components/dashboard-shell.tsx
package.json
README_TH.md
```

## Motion ที่เพิ่ม

- Scroll Reveal ด้วย IntersectionObserver
- Floating Dashboard และ Phone Mockup
- Animated bar chart
- Gradient glow และ orbit animation
- Shimmer บนปุ่มหลัก
- Hover lift บนการ์ด
- Animated progress bar
- Transition ตอนสลับ Teacher/Student Login

ระบบรองรับ `prefers-reduced-motion` โดยจะลดหรือปิด Animation อัตโนมัติ

## วิธีอัปเดตโปรเจกต์เดิม

สำรองโครงการเดิมก่อน แล้วคัดลอกไฟล์จากเวอร์ชัน 1.0.3 ไปแทนที่ โดยไม่ต้องแก้ `.env.local` และไม่ต้องรัน SQL ใหม่ เพราะการเปลี่ยนครั้งนี้เป็น UI เท่านั้น

```bash
cd /Users/tkping/projects/TK_Mooc_Phase1
cp -R . ../TK_Mooc_Phase1_backup
```

จากนั้นแทนที่ไฟล์ตามรายการด้านบน แล้วรัน:

```bash
npm install
rm -rf .next
npm run typecheck
npm run build
npm run dev
```

เปิด:

```text
http://localhost:3000
```

## Deploy

```bash
git add .
git commit -m "Redesign TK Mooc UI with motion animations"
git push origin main
```

หาก Vercel เชื่อมกับ Repository อยู่แล้ว ระบบจะ Deploy อัตโนมัติ หรือ Deploy ด้วย CLI:

```bash
npx vercel@latest --prod
```
