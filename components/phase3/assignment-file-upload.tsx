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

export function AssignmentFileUpload({ teacherId, classId, assignmentId }: { teacherId: string; classId: string; assignmentId: string }) {
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  async function uploadFiles(files: FileList) {
    setUploading(true);
    setMessage("กำลังอัปโหลด...");
    const supabase = createClient();
    try {
      for (const file of Array.from(files)) {
        if (file.size > 30 * 1024 * 1024) throw new Error(`${file.name} มีขนาดเกิน 30 MB`);
        const storagePath = `${teacherId}/${classId}/${assignmentId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage.from("assignment-files").upload(storagePath, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;
        const { error: rowError } = await supabase.from("assignment_attachments").insert({
          assignment_id: assignmentId,
          storage_path: storagePath,
          file_name: file.name,
          mime_type: file.type || null,
          file_size: file.size,
        });
        if (rowError) {
          await supabase.storage.from("assignment-files").remove([storagePath]);
          throw rowError;
        }
      }
      setMessage("อัปโหลดเอกสารประกอบเรียบร้อยแล้ว");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="phase3-upload-box">
      <span className="phase3-upload-icon"><Paperclip size={21} /></span>
      <div><strong>อัปโหลดเอกสารประกอบ</strong><small>รองรับเอกสาร รูปภาพ และไฟล์ทั่วไป ไม่เกิน 30 MB ต่อไฟล์</small></div>
      <label className="phase2-primary-button"><UploadCloud size={17} /> {uploading ? "กำลังอัปโหลด..." : "เลือกไฟล์"}<input type="file" multiple disabled={uploading} onChange={(event: ChangeEvent<HTMLInputElement>) => { if (event.target.files?.length) void uploadFiles(event.target.files); event.target.value = ""; }} /></label>
      {message && <span className="phase3-upload-message">{message.includes("เรียบร้อย") && <CheckCircle2 size={15} />} {message}</span>}
    </div>
  );
}
