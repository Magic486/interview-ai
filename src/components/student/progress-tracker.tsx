"use client";

import type { LearningRoadmap } from "@//types/student";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Flag,
  CheckCircle2,
  Circle,
  RotateCcw,
  TrendingUp,
} from "lucide-react";

interface ProgressTrackerProps {
  roadmap: LearningRoadmap;
  career: string;
  completedMilestones: Record<number, number[]>;
  completedPhases: number[];
  onToggleMilestone: (phaseIndex: number, milestoneIndex: number) => void;
  onTogglePhase: (phaseIndex: number) => void;
  onReset: () => void;
}

export function ProgressTracker({
  roadmap,
  career,
  completedMilestones,
  completedPhases,
  onToggleMilestone,
  onTogglePhase,
  onReset,
}: ProgressTrackerProps) {
  // Calculate overall progress
  const totalMilestones = roadmap.phases.reduce(
    (sum, phase) => sum + phase.milestones.length,
    0
  );
  const completedCount = Object.values(completedMilestones).reduce(
    (sum, arr) => sum + arr.length,
    0
  );
  const overallProgress =
    totalMilestones > 0
      ? Math.round((completedCount / totalMilestones) * 100)
      : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">学习进度</h2>
        <p className="text-slate-500 text-sm">
          「{career}」方向的成长记录
        </p>
      </div>

      {/* Overall Progress Card */}
      <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                总体进度
              </h3>
              <p className="text-sm text-slate-500">
                已完成 {completedCount} / {totalMilestones} 个里程碑
              </p>
            </div>
            <div className="text-4xl font-bold text-amber-600">
              {overallProgress}%
            </div>
          </div>
          <Progress value={overallProgress} className="h-3" />
          <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            {overallProgress === 0 && "开始你的学习之旅吧！"}
            {overallProgress > 0 &&
              overallProgress < 50 &&
              "不错的开始，继续保持！"}
            {overallProgress >= 50 &&
              overallProgress < 100 &&
              "已过半程，胜利在望！"}
            {overallProgress === 100 && "恭喜你完成了所有里程碑！"}
          </div>
        </CardContent>
      </Card>

      {/* Phase Progress */}
      {roadmap.phases.map((phase) => {
        const phaseCompleted =
          completedMilestones[phase.phase]?.length || 0;
        const phaseTotal = phase.milestones.length;
        const phaseProgress =
          phaseTotal > 0
            ? Math.round((phaseCompleted / phaseTotal) * 100)
            : 0;
        const isComplete = completedPhases.includes(phase.phase);

        return (
          <Card
            key={phase.phase}
            className={isComplete ? "border-emerald-200 bg-emerald-50/30" : ""}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      isComplete ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      phase.phase
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">{phase.name}</CardTitle>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {phase.duration}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={isComplete ? "default" : "secondary"}
                    className={
                      isComplete
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-600"
                    }
                  >
                    {phaseCompleted}/{phaseTotal}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onTogglePhase(phase.phase)}
                    className="text-xs"
                  >
                    {isComplete ? "取消完成" : "标记完成"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={phaseProgress} className="h-2 mb-3" />
              <div className="space-y-2">
                {phase.milestones.map((milestone, i) => {
                  const isMilestoneComplete =
                    completedMilestones[phase.phase]?.includes(i);
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 cursor-pointer group"
                      onClick={() => onToggleMilestone(phase.phase, i)}
                    >
                      {isMilestoneComplete ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300 group-hover:text-amber-400 shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          isMilestoneComplete
                            ? "line-through text-slate-400"
                            : "text-slate-600 group-hover:text-slate-800"
                        }`}
                      >
                        {milestone}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Goals reminder */}
              {phase.goals.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                    <Flag className="w-3 h-3" />
                    阶段目标
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {phase.goals.map((goal, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-xs text-slate-500"
                      >
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Reset */}
      <div className="flex justify-center pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-slate-400 gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          重置所有进度
        </Button>
      </div>
    </div>
  );
}
