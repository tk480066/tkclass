"use client";

import { useState, type ChangeEvent } from "react";
import { Paperclip, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function safeFileName(name: string) {
  const extension = name.includes(".") ? `.${name.split(".").pop()}` : "";
  const base = name.replace(extension, "").replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 70) || "file";
  return `${base}${extension.toLowerCase()}`;
}

export function MessageAttachmentUpload({ userId, conversationId, messageId }: { userId: string; conversationId: string; messageId: string }) {
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  async function uploadFiles(files: FileList) {
    setUploading(true); setMessage("กำลังอัปโหลด...");
    const supabase = createClient();
    try {
      for (const file of Array.from(files)) {
        if (file.size > 50 * 1024 * 1024) throw new Error(`${file.name} มีขนาดเกิน 50 MB`);
        const storagePath = `${userId}/message/${conversationId}/${messageId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage.from("communication-files").upload(storagePath, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;
        const { error: rowError } = await supabase.from("message_attachments").insert({ message_id: messageId, storage_path: storagePath, file_name: file.name, mime_type: file.type || null, file_size: file.size });
        if (rowError) { await supabase.storage.from("communication-files").remove([storagePath]); throw rowError; }
      }
      setMessage("แนบไฟล์แล้ว"); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "อัปโหลดไม่สำเร็จ"); }
    finally { setUploading(false); }
  }
  return <div className="phase6-message-upload"><Paperclip size={14} /><label><UploadCloud size={14} /> {uploading ? "กำลังแนบ..." : "แนบไฟล์กับข้อความนี้"}<input type="file" multiple disabled={uploading} onChange={(event: ChangeEvent<HTMLInputElement>) => { if (event.target.files?.length) void uploadFiles(event.target.files); event.target.value = ""; }} /></label>{message && <small>{message}</small>}</div>;
}
