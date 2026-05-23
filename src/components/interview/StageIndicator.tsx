"use client";

import type { CompanyFlow } from "@/types";

interface StageIndicatorProps {
  flow: CompanyFlow;
  currentStage: number;
}

export function StageIndicator({ flow, currentStage }: StageIndicatorProps) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        {flow.name} 流程
      </h3>
      {flow.stages.map((stage, index) => {
        const isCompleted = index < currentStage;
        const isCurrent = index === currentStage;
        const isPending = index > currentStage;

        return (
          <div key={`${stage.id}-${index}`} className="relative flex gap-3">
            {/* 连接线 */}
            {index < flow.stages.length - 1 && (
              <div className="absolute left-[5px] top-6 bottom-0 w-0.5 -translate-x-1/2">
                <div
                  className={`h-full ${isCompleted ? "bg-green-500" : "bg-muted"}`}
                />
              </div>
            )}

            {/* 圆点 */}
            <div
              className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${
                isCompleted
                  ? "bg-green-500"
                  : isCurrent
                  ? "bg-primary ring-2 ring-primary/30"
                  : "bg-muted-foreground/30"
              } ${isCurrent ? "animate-pulse" : ""}`}
            />

            {/* 阶段信息 */}
            <div className={`pb-4 ${isPending ? "opacity-40" : ""}`}>
              <p className="text-sm font-medium">{stage.name}</p>
              <p className="text-xs text-muted-foreground">{stage.focus}</p>
              <p className="text-xs text-muted-foreground">{stage.duration} 分钟</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
