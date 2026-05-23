"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ChatPanel } from "@/components/interview/ChatPanel";
import { StageIndicator } from "@/components/interview/StageIndicator";
import { InterviewControls } from "@/components/interview/InterviewControls";
import { CodeEditor } from "@/components/interview/CodeEditor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { COMPANY_FLOWS } from "@/config/interview-stages";
import { AlertTriangle, Clock, StopCircle } from "lucide-react";
import type { InterviewConfig, InterviewMode } from "@/types";

export default function InterviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [mode, setMode] = useState<InterviewMode>(
    (searchParams.get("mode") as InterviewMode) || "normal"
  );
  const company = searchParams.get("company") || "bytedance";
  const role = searchParams.get("role") || "后端开发工程师";
  const [stressMode, setStressMode] = useState(
    searchParams.get("stress") === "true"
  );
  const [showEndDialog, setShowEndDialog] = useState(false);

  const flow = COMPANY_FLOWS[company] ?? COMPANY_FLOWS["bytedance"];
  const requestedStageIndex = Number(searchParams.get("stage") ?? 0);
  const currentStageIndex = Number.isFinite(requestedStageIndex)
    ? Math.min(Math.max(requestedStageIndex, 0), flow.stages.length - 1)
    : 0;
  const currentStage = flow.stages[currentStageIndex];
  const codeEditorVisible = currentStage?.id === "algorithm";
  const stageDurationSeconds = (currentStage?.duration ?? 45) * 60;
  const [endReason, setEndReason] = useState<"manual" | "timeout">("manual");

  // 处理面试结束
  const handleEndInterview = useCallback(() => {
    setEndReason("manual");
    setShowEndDialog(true);
  }, []);

  const handleTimerExpire = useCallback(() => {
    setEndReason("timeout");
    setShowEndDialog(true);
  }, []);

  const confirmEndInterview = useCallback(() => {
    setShowEndDialog(false);
    router.push(`/interview/review/${interviewId}?mode=${mode}&role=${role}&company=${company}`);
  }, [interviewId, mode, role, company, router]);

  // 切换模式
  const handleToggleMode = useCallback(() => {
    const newMode = mode === "normal" ? "reversed" : "normal";
    setMode(newMode);
    // 强制重新渲染 ChatPanel（key 变化触发）
  }, [mode]);

  // 切换压力面
  const handleToggleStress = useCallback(() => {
    setStressMode((prev) => !prev);
  }, []);

  const config: InterviewConfig & { currentStage: number } = {
    role,
    company,
    mode,
    stressMode,
    currentStage: currentStageIndex,
    stageIndex: currentStageIndex,
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* 左侧：阶段指示器 */}
      <aside className="w-64 shrink-0 border-r p-4 overflow-y-auto">
        <StageIndicator flow={flow} currentStage={currentStageIndex} />
      </aside>

      {/* 中间：对话区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部状态栏 */}
        <div className="border-b px-4 py-2 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              {flow.name} · {role}
            </span>
            <Badge variant={stressMode ? "destructive" : "outline"} className="text-xs">
              {stressMode ? "压力面" : "普通模式"}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {mode === "reversed" ? "面试官视角" : "候选人视角"}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <CountdownTimer
              key={currentStageIndex}
              durationSeconds={stageDurationSeconds}
              paused={showEndDialog}
              onExpire={handleTimerExpire}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleEndInterview}
              className="h-8 gap-1"
            >
              <StopCircle className="h-4 w-4" />
              提前结束
            </Button>
            <div className="text-sm text-muted-foreground">
              当前模块 · {currentStage?.name}
            </div>
          </div>
        </div>

        {/* 对话面板 */}
        <div className="flex-1 overflow-hidden" key={`${mode}-${stressMode}`}>
          <ChatPanel
            interviewId={interviewId}
            config={config}
            mode={mode}
          />
        </div>

        {/* 底部控制栏 */}
        <div className="border-t px-4 py-2 shrink-0">
          <InterviewControls
            mode={mode}
            stressMode={stressMode}
            onToggleMode={handleToggleMode}
            onToggleStress={handleToggleStress}
            onEndInterview={handleEndInterview}
          />
        </div>
      </div>

      {/* 右侧：代码编辑器（仅算法面） */}
      {codeEditorVisible && (
        <aside className="w-96 shrink-0 border-l">
          <CodeEditor
            visible={true}
            onLanguageChange={() => {}}
            onSubmit={() => {}}
          />
        </aside>
      )}

      {/* 结束面试确认弹窗 */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {endReason === "timeout" ? "本轮时间已到" : "确认结束面试？"}
            </DialogTitle>
            <DialogDescription>
              {endReason === "timeout"
                ? "当前流程倒计时已结束，可以进入复盘报告。"
                : "结束后将无法继续本次面试，系统会为你生成复盘报告。"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              继续面试
            </Button>
            <Button onClick={confirmEndInterview}>
              结束并查看复盘
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CountdownTimer({
  durationSeconds,
  paused,
  onExpire,
}: {
  durationSeconds: number;
  paused: boolean;
  onExpire: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [notice, setNotice] = useState<string | null>(null);
  const remainingRef = useRef(durationSeconds);
  const expiredRef = useRef(false);
  const fiveMinuteNotifiedRef = useRef(false);
  const oneMinuteNotifiedRef = useRef(false);

  useEffect(() => {
    if (paused || expiredRef.current) return;

    const timer = window.setInterval(() => {
      remainingRef.current = Math.max(remainingRef.current - 1, 0);
      setTimeLeft(remainingRef.current);

      if (remainingRef.current <= 60 && !oneMinuteNotifiedRef.current) {
        oneMinuteNotifiedRef.current = true;
        setNotice("最后 1 分钟");
      } else if (
        remainingRef.current <= 300 &&
        !fiveMinuteNotifiedRef.current
      ) {
        fiveMinuteNotifiedRef.current = true;
        setNotice("剩余 5 分钟");
      }

      if (remainingRef.current === 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire();
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [onExpire, paused]);

  const urgent = timeLeft <= 300;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm font-semibold shadow-sm ${
          urgent
            ? "border-destructive/40 bg-destructive/10 text-destructive"
            : "border-destructive/30 bg-destructive/5 text-destructive"
        }`}
      >
        <Clock className="h-4 w-4" />
        <span className="tabular-nums">{formatTime(timeLeft)}</span>
      </div>
      {notice && (
        <div className="flex items-center gap-1 rounded-md bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground">
          <AlertTriangle className="h-3.5 w-3.5" />
          {notice}
        </div>
      )}
    </div>
  );
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

// 内联 Badge（避免额外引入）
function Badge({
  children,
  variant = "outline",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary";
  className?: string;
}) {
  const variants = {
    default: "bg-primary text-primary-foreground",
    destructive: "bg-destructive/10 text-destructive",
    outline: "border text-muted-foreground",
    secondary: "bg-secondary text-secondary-foreground",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${variants[variant]} ${className || ""}`}
    >
      {children}
    </span>
  );
}
