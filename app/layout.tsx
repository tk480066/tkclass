import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TK Mooc",
    template: "%s | TK Mooc",
  },
  description: "TK Mooc ศูนย์การเรียนรู้ครูปิง พัฒนาด้วย Next.js, Supabase และ Vercel",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
