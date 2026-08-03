"use client";

import { useState, type ChangeEvent } from "react";
import { CheckCircle2, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function safeFileName(name: string) {
  const extension = name.includes(".") ? `.${name.split(".").pop()}` : "";
  const base = name.replace(extension, "").replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 60) || "file";
  return `${base}${extension.toLowerCase()}`;
}

export function CourseFileUpload({
  teacherId,
  classId,
  inputName = "storagePath",
  defaultPath = "",
  label = "อัปโหลดไฟล์จากอุปกรณ์",
}: {
  teacherId: string;
  classId: string;
  inputName?: string;
  defaultPath?: string;
  label?: string;
}) {
  const [path, setPath] = useState(defaultPath);
  const [message, setMessage] = useState(defaultPath ? "มีไฟล์เดิมอยู่แล้ว" : "");
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    if (file.size > 50 * 1024 * 1024) {
      setMessage("ไฟล์ต้องมีขนาดไม่เกิน 50 MB");
      return;
    }
    setUploading(true);
    setMessage("กำลังอัปโหลด...");
    const supabase = createClient();
    const storagePath = `${teacherId}/${classId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage.from("course-content").upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      setMessage(error.message);
      setUploading(false);
      return;
    }
    setPath(storagePath);
    setMessage("อัปโหลดสำเร็จ");
    setUploading(false);
  }

  return (
    <div className="course-upload-control">
      <input type="hidden" name={inputName} value={path} />
      <label className="course-upload-label">
        <UploadCloud size={19} />
        <span>{uploading ? "กำลังอัปโหลด..." : label}</span>
        <input type="file" disabled={uploading} onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }} />
      </label>
      {message && <small className={path ? "upload-success" : "upload-message"}>{path && <CheckCircle2 size={14} />} {message}</small>}
      {path && <code className="upload-path">{path}</code>}
    </div>
  );
}
