"use client";

// TODO: Person C 实现 — 学习路径时间线

import type { LearningStep } from "@/types";

interface LearningPathProps {
  steps: LearningStep[];
}

export function LearningPath({ steps }: LearningPathProps) {
  return (
    <div className="relative pl-6 border-l-2 space-y-6">
      {steps.map((step) => (
        <div key={step.order} className="relative">
          <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-primary" />
          <h4 className="font-semibold">
            步骤 {step.order}: {step.title}
          </h4>
          <p className="text-sm text-muted-foreground">{step.description}</p>
          <p className="text-xs text-muted-foreground mt-1">
            ⏱ {step.estimatedDuration}
          </p>
        </div>
      ))}
    </div>
  );
}
