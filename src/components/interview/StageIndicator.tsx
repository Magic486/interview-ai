"use client";

// TODO: Person B 实现 — 面试阶段指示器
// 显示当前面试流程（已完成/进行中/未开始 三种状态）

import type { CompanyFlow } from "@/types";

interface StageIndicatorProps {
  flow: CompanyFlow;
  currentStage: number;
}

export function StageIndicator({ flow, currentStage }: StageIndicatorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {flow.name} 面试流程
      </h3>
      {flow.stages.map((stage, index) => (
        <div key={stage.id} className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              index < currentStage
                ? "bg-green-500"
                : index === currentStage
                ? "bg-primary animate-pulse"
                : "bg-muted"
            }`}
          />
          <div>
            <p
              className={`text-sm font-medium ${
                index <= currentStage ? "" : "text-muted-foreground"
              }`}
            >
              {stage.name}
            </p>
            <p className="text-xs text-muted-foreground">{stage.focus}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
