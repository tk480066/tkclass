# แก้ปัญหา TypeScript 7 กับ Next.js

หากพบข้อความ:

```text
TypeScript 7.x does not provide the compiler API required by Next.js
```

ให้หยุดเซิร์ฟเวอร์ด้วย `Control + C` แล้วรันจากโฟลเดอร์โปรเจกต์:

```bash
npm install --save-dev typescript@6
rm -rf .next
npm run dev
```

ตรวจสอบรุ่น:

```bash
npx tsc --version
```

ควรแสดง `Version 6.x.x`

ไฟล์ `next.config.ts` ของเวอร์ชัน 1.0.1 กำหนด `turbopack.root` เป็น `process.cwd()` แล้ว เพื่อไม่ให้ Next.js เลือก lockfile จากโฟลเดอร์ระดับบนโดยอัตโนมัติ
