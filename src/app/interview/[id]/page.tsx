"use client";

import { useState, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ChatPanel, type ChatPanelHandle } from "@/components/interview/ChatPanel";
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
import type { InterviewConfig, InterviewMode } from "@/types";

export default function InterviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [mode, setMode] = useState<InterviewMode>(
    (searchParams.get("mode") as InterviewMode) || "normal"
  );
  const [company] = useState(searchParams.get("company") || "bytedance");
  const [role] = useState(searchParams.get("role") || "后端开发工程师");
  const [stressMode, setStressMode] = useState(
    searchParams.get("stress") === "true"
  );
  const [currentStageIndex] = useState(0);
  const [showEndDialog, setShowEndDialog] = useState(false);

  const chatPanelRef = useRef<ChatPanelHandle>(null);

  const flow = COMPANY_FLOWS[company] ?? COMPANY_FLOWS["bytedance"];
  const currentStage = flow.stages[currentStageIndex];
  const totalStages = flow.stages.length;
  const codeEditorVisible = currentStage?.id === "algorithm";

  // 处理代码提交
  const handleCodeSubmit = useCallback(
    (code: string, language: string) => {
      chatPanelRef.current?.sendMessage(
        `我的代码（${language}）：\n\`\`\`${language}\n${code}\n\`\`\``
      );
    },
    []
  );
  const handleEndInterview = useCallback(() => {
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
        <div className="border-b px-4 py-2 flex items-center justify-between shrink-0">
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
          <div className="text-sm text-muted-foreground">
            {currentStageIndex + 1}/{totalStages} · {currentStage?.name}
          </div>
        </div>

        {/* 对话面板 */}
        <div className="flex-1 overflow-hidden" key={`${mode}-${stressMode}`}>
          <ChatPanel
            ref={chatPanelRef}
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
            onSubmit={handleCodeSubmit}
          />
        </aside>
      )}

      {/* 结束面试确认弹窗 */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认结束面试？</DialogTitle>
            <DialogDescription>
              结束后将无法继续本次面试，系统会为你生成复盘报告。
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
