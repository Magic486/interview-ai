"use client";

// TODO: Person B 实现 — 简历拖拽上传
// 支持拖拽 .pdf/.doc/.txt，调用 analyzeResume Server Action

import { Upload } from "lucide-react";

interface ResumeUploaderProps {
  onUpload: (file: File) => void;
}

export function ResumeUploader({ onUpload }: ResumeUploaderProps) {
  return (
    <div className="border-2 border-dashed rounded-lg p-6 text-center">
      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground mb-2">拖拽简历文件到此处</p>
      <label
        className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium transition-colors h-7 px-2.5 cursor-pointer"
      >
        选择文件
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
          }}
        />
      </label>
    </div>
  );
}
