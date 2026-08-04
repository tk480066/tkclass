"use client";

import { useState, type ChangeEvent } from "react";
import { CheckCircle2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function safeFileName(name: string) {
  const extension = name.includes(".") ? `.${name.split(".").pop()}` : "";
  const base = name.replace(extension, "").replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 70) || "file";
  return `${base}${extension.toLowerCase()}`;
}

function acceptValue(types: string[]) {
  const values: string[] = [];
  if (types.includes("image")) values.push("image/*");
  if (types.includes("video")) values.push("video/*");
  if (types.includes("file")) values.push(".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip");
  return values.join(",");
}

export function SubmissionFileUpload({ studentId, assignmentId, submissionId, allowedTypes, disabled }: { studentId: string; assignmentId: string; submissionId: string; allowedTypes: string[]; disabled?: boolean }) {
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  async function uploadFiles(files: FileList) {
    setUploading(true);
    setMessage("กำลังอัปโหลด...");
    const supabase = createClient();
    try {
      for (const file of Array.from(files)) {
        if (file.size > 100 * 1024 * 1024) throw new Error(`${file.name} มีขนาดเกิน 100 MB`);
        const storagePath = `${studentId}/${assignmentId}/${submissionId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage.from("submission-files").upload(storagePath, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;
        const { error: rowError } = await supabase.from("submission_files").insert({ submission_id: submissionId, uploaded_by: studentId, storage_path: storagePath, file_name: file.name, mime_type: file.type || null, file_size: file.size });
        if (rowError) {
          await supabase.storage.from("submission-files").remove([storagePath]);
          throw rowError;
        }
      }
      setMessage("อัปโหลดไฟล์เรียบร้อยแล้ว");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="phase3-submission-upload">
      <div><strong>ไฟล์ผลงาน</strong><small>อัปโหลดได้หลายไฟล์ ไม่เกิน 100 MB ต่อไฟล์</small></div>
      <label className={`phase2-secondary-button ${disabled ? "is-disabled" : ""}`}><UploadCloud size={17} /> {uploading ? "กำลังอัปโหลด..." : "เลือกไฟล์"}<input type="file" multiple accept={acceptValue(allowedTypes)} disabled={disabled || uploading} onChange={(event: ChangeEvent<HTMLInputElement>) => { if (event.target.files?.length) void uploadFiles(event.target.files); event.target.value = ""; }} /></label>
      {disabled && <small>กรุณาบันทึกฉบับร่างก่อนอัปโหลดไฟล์</small>}
      {message && <span className="phase3-upload-message">{message.includes("เรียบร้อย") && <CheckCircle2 size={15} />} {message}</span>}
    </div>
  );
}
