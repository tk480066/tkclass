"use client";

import { useState, type ChangeEvent } from "react";
import { CheckCircle2, Paperclip, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function safeFileName(name: string) {
  const extension = name.includes(".") ? `.${name.split(".").pop()}` : "";
  const base = name.replace(extension, "").replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 70) || "file";
  return `${base}${extension.toLowerCase()}`;
}

export function AnnouncementFileUpload({ userId, announcementId }: { userId: string; announcementId: string }) {
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  async function uploadFiles(files: FileList) {
    setUploading(true); setMessage("กำลังอัปโหลด...");
    const supabase = createClient();
    try {
      for (const file of Array.from(files)) {
        if (file.size > 50 * 1024 * 1024) throw new Error(`${file.name} มีขนาดเกิน 50 MB`);
        const storagePath = `${userId}/announcement/${announcementId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage.from("communication-files").upload(storagePath, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;
        const { error: rowError } = await supabase.from("announcement_attachments").insert({ announcement_id: announcementId, storage_path: storagePath, file_name: file.name, mime_type: file.type || null, file_size: file.size });
        if (rowError) { await supabase.storage.from("communication-files").remove([storagePath]); throw rowError; }
      }
      setMessage("อัปโหลดไฟล์ประกอบแล้ว"); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "อัปโหลดไม่สำเร็จ"); }
    finally { setUploading(false); }
  }
  return <div className="phase6-upload-box"><span><Paperclip size={20} /></span><div><strong>เอกสารประกอบประกาศ</strong><small>อัปโหลดเอกสารหรือรูปภาพได้หลายไฟล์ ไม่เกิน 50 MB ต่อไฟล์</small></div><label className="phase2-secondary-button"><UploadCloud size={17} /> {uploading ? "กำลังอัปโหลด..." : "เลือกไฟล์"}<input type="file" multiple disabled={uploading} onChange={(event: ChangeEvent<HTMLInputElement>) => { if (event.target.files?.length) void uploadFiles(event.target.files); event.target.value = ""; }} /></label>{message && <em>{message.includes("แล้ว") && <CheckCircle2 size={14} />} {message}</em>}</div>;
}
