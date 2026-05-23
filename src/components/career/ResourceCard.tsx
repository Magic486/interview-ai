"use client";

// TODO: Person C 实现 — 推荐资源卡片

import type { LearningResource } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Video, Code2 } from "lucide-react";

interface ResourceCardProps {
  resource: LearningResource;
}

const iconMap = {
  course: Video,
  book: BookOpen,
  project: Code2,
};

export function ResourceCard({ resource }: ResourceCardProps) {
  const Icon = iconMap[resource.type];

  return (
    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-medium">{resource.name}</p>
          <p className="text-xs text-muted-foreground">
            {resource.type === "course" ? "课程" : resource.type === "book" ? "书籍" : "项目"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
