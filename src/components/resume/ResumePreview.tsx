"use client";

// TODO: Person B 实现 — 简历解析结果预览

import type { ParsedResume } from "@/types";
import { Badge } from "@/components/ui/badge";

interface ResumePreviewProps {
  resume: ParsedResume | null;
}

export function ResumePreview({ resume }: ResumePreviewProps) {
  if (!resume) return null;

  return (
    <div className="space-y-4">
      <h4 className="font-semibold">简历解析结果</h4>
      <div>
        <p className="text-sm text-muted-foreground mb-2">技能标签</p>
        <div className="flex flex-wrap gap-1">
          {resume.skills.map((s) => (
            <Badge key={s.name} variant="secondary">
              {s.name} ({s.level})
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
