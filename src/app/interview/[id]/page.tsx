"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
import { loadInterviewContext } from "@/lib/interview-context";
import { AlertTriangle, Clock } from "lucide-react";
import type { InterviewConfig, InterviewMode } from "@/types";

export default function InterviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const interviewId = params.id as string;
  const [interviewContext] = useState(() => loadInterviewContext(interviewId));

  const [mode, setMode] = useState<InterviewMode>(
    (searchParams.get("mode") as InterviewMode) || "normal"
  );
  const company = searchParams.get("company") || "bytedance";
  const role = searchParams.get("role") || "后端开发工程师";
  const [stressMode, setStressMode] = useState(
    searchParams.get("stress") === "true"
  );
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingExitHref, setPendingExitHref] = useState<string | null>(null);
  const [endReason, setEndReason] = useState<"manual" | "timeout">("manual");
  const chatPanelRef = useRef<ChatPanelHandle>(null);
  const allowExitRef = useRef(false);
  const exitWasBackRef = useRef(false);
  const exitGuardKeyRef = useRef<string | null>(null);

  const flow = COMPANY_FLOWS[company] ?? COMPANY_FLOWS.bytedance;
  const requestedStageIndex = Number(searchParams.get("stage") ?? 0);
  const currentStageIndex = Number.isFinite(requestedStageIndex)
    ? Math.min(Math.max(requestedStageIndex, 0), flow.stages.length - 1)
    : 0;
  const currentStage = flow.stages[currentStageIndex];
  const codeEditorVisible = currentStage?.id === "algorithm";
  const stageDurationSeconds = (currentStage?.duration ?? 45) * 60;

  const handleCodeSubmit = useCallback((code: string, language: string) => {
    chatPanelRef.current?.sendMessage(
      `我的代码（${language}）：\n\`\`\`${language}\n${code}\n\`\`\``
    );
  }, []);

  const handleEndInterview = useCallback(() => {
    setEndReason("manual");
    setShowEndDialog(true);
  }, []);

  const handleTimerExpire = useCallback(() => {
    setEndReason("timeout");
    setShowEndDialog(true);
  }, []);

  const cancelExit = useCallback(() => {
    setShowExitDialog(false);
    setPendingExitHref(null);
    if (exitWasBackRef.current) {
      window.history.pushState(
        { interviewExitGuard: exitGuardKeyRef.current },
        "",
        window.location.href
      );
    }
    exitWasBackRef.current = false;
  }, []);

  const confirmExit = useCallback(() => {
    allowExitRef.current = true;
    setShowExitDialog(false);

    if (pendingExitHref) {
      router.push(pendingExitHref);
      return;
    }

    const exitFromUrl = window.location.href;
    let attempts = 0;
    const maxAttempts = 6;

    window.history.back();

    const skipSamePageGuards = window.setInterval(() => {
      if (window.location.href !== exitFromUrl) {
        window.clearInterval(skipSamePageGuards);
        return;
      }

      attempts += 1;
      if (attempts >= maxAttempts) {
        window.clearInterval(skipSamePageGuards);
        router.push("/");
        return;
      }

      window.history.back();
    }, 120);
  }, [pendingExitHref, router]);

  const confirmEndInterview = useCallback(() => {
    allowExitRef.current = true;
    setShowEndDialog(false);
    const reviewParams = new URLSearchParams({
      mode,
      role,
      company,
      stage: String(currentStageIndex),
    });
    router.push(`/interview/review/${interviewId}?${reviewParams.toString()}`);
  }, [interviewId, mode, role, company, currentStageIndex, router]);

  const handleToggleMode = useCallback(() => {
    setMode((current) => (current === "normal" ? "reversed" : "normal"));
  }, []);

  const handleToggleStress = useCallback(() => {
    setStressMode((prev) => !prev);
  }, []);

  useEffect(() => {
    const guardKey = `interview-exit:${interviewId}:${window.location.pathname}${window.location.search}`;
    exitGuardKeyRef.current = guardKey;

    if (window.history.state?.interviewExitGuard !== guardKey) {
      window.history.replaceState(
        { ...(window.history.state ?? {}), interviewExitBase: guardKey },
        "",
        window.location.href
      );
      window.history.pushState(
        { interviewExitGuard: guardKey },
        "",
        window.location.href
      );
    }

    const handlePopState = () => {
      if (allowExitRef.current) return;
      exitWasBackRef.current = true;
      setPendingExitHref(null);
      setShowExitDialog(true);
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (allowExitRef.current) return;
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      event.preventDefault();
      exitWasBackRef.current = false;
      setPendingExitHref(`${url.pathname}${url.search}${url.hash}`);
      setShowExitDialog(true);
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowExitRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [interviewId]);

  const config: InterviewConfig & { currentStage: number } = {
    role,
    company,
    mode,
    stressMode,
    currentStage: currentStageIndex,
    stageIndex: currentStageIndex,
    candidateProfileSummary: interviewContext?.candidateProfileSummary,
    resumeSummary: interviewContext?.resumeSummary,
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <aside className="w-64 shrink-0 border-r p-4 overflow-y-auto">
        <StageIndicator flow={flow} currentStage={currentStageIndex} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b px-4 py-2 flex items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm">
              {flow.name} · {role}
            </span>
            <Badge variant={stressMode ? "destructive" : "outline"} className="text-xs">
              {stressMode ? "压力面" : "普通模式"}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {mode === "reversed" ? "面试官视角" : "候选人视角"}
            </Badge>
            {interviewContext?.candidateProfileSummary ? (
              <Badge variant="outline" className="text-xs">
                已接入个人信息
              </Badge>
            ) : null}
            {interviewContext?.resumeSummary ? (
              <Badge variant="outline" className="text-xs">
                已接入简历
              </Badge>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <CountdownTimer
              durationSeconds={stageDurationSeconds}
              paused={showEndDialog}
              onExpire={handleTimerExpire}
            />
            <div className="text-sm text-muted-foreground">
              当前模块 · {currentStage?.name}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden" key={`${mode}-${stressMode}-${currentStageIndex}`}>
          <ChatPanel
            ref={chatPanelRef}
            interviewId={interviewId}
            config={config}
            mode={mode}
          />
        </div>

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

      {codeEditorVisible && (
        <aside className="w-96 shrink-0 border-l border-border/50 bg-background/80 backdrop-blur-xl">
          <CodeEditor
            visible={true}
            onLanguageChange={() => {}}
            onSubmit={handleCodeSubmit}
          />
        </aside>
      )}

      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {endReason === "timeout" ? "本轮时间已到" : "确认结束面试？"}
            </DialogTitle>
            <DialogDescription>
              {endReason === "timeout"
                ? "当前模块倒计时已结束，可以进入复盘报告。"
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

      <Dialog open={showExitDialog} onOpenChange={(open) => {
        if (open) {
          setShowExitDialog(true);
          return;
        }

        if (allowExitRef.current) {
          setShowExitDialog(false);
          return;
        }

        cancelExit();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认离开当前面试？</DialogTitle>
            <DialogDescription>
              当前面试还在进行中，离开后本页对话可能无法继续。确认要退出吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelExit}>
              继续面试
            </Button>
            <Button variant="destructive" onClick={confirmExit}>
              确认离开
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

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 text-sm font-semibold text-destructive shadow-sm">
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
