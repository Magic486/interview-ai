"use client";

import { useState, useRef, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Send, Mic, MicOff, Loader2, User, Bot, AlertCircle } from "lucide-react";
import type { InterviewConfig } from "@/types";

export interface ChatPanelHandle {
  sendMessage: (text: string) => void;
}

interface ChatPanelProps {
  interviewId: string;
  config: InterviewConfig & { currentStage?: number };
  mode: "normal" | "reversed";
}

const INIT_TRIGGER = "__INTERVIEW_START__";

function formatError(err: Error | undefined): string {
  if (!err) return "AI 服务连接失败，请检查 API Key";
  const msg = err.message;
  if (!msg) return "AI 服务连接失败，请检查 API Key";
  // 如果服务端返回的是 JSON 格式错误，提取真实错误信息
  try {
    const parsed = JSON.parse(msg);
    return parsed.error || parsed.message || msg;
  } catch {
    return msg;
  }
}

function getMessageText(msg: UIMessage): string {
  const parts = msg.parts as Array<{ type: string; text?: string; delta?: string }>;
  return parts
    .filter((p) => p.type === "text" || p.type === "text-delta")
    .map((p) => p.text ?? p.delta ?? "")
    .join("");
}

export const ChatPanel = forwardRef<ChatPanelHandle, ChatPanelProps>(
  function ChatPanel({ interviewId, config, mode }, ref) {
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { interviewId, config, mode },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [interviewId, mode]
  );

  const { messages, sendMessage, status, error } = useChat({
    transport,
    onError: (err) => {
      console.error("Chat error:", err);
    },
  });

  useImperativeHandle(ref, () => ({
    sendMessage: (text: string) => {
      sendMessage({ text });
    },
  }), [sendMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 普通模式下自动触发 AI 面试官第一个问题
  const autoTriggered = useRef(false);
  useEffect(() => {
    if (
      mode === "normal" &&
      !autoTriggered.current &&
      status === "ready" &&
      messages.length === 0
    ) {
      autoTriggered.current = true;
      sendMessage({ text: INIT_TRIGGER });
    }
  }, [mode, status, messages.length, sendMessage]);

  const isLoading = status === "streaming" || status === "submitted";

  const handleSend = useCallback(
    (text: string) => {
      if (!text.trim() || status === "streaming") return;
      sendMessage({ text: text.trim() });
    },
    [sendMessage, status]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const text = e.currentTarget.value;
      if (text.trim()) {
        handleSend(text);
        e.currentTarget.value = "";
      }
    }
  };

  const handleVoiceToggle = async () => {
    if (listening) {
      setListening(false);
      return;
    }
    try {
      setListening(true);
      const { SpeechService } = await import("@/lib/speech");
      const speech = new SpeechService();
      const text = await speech.startRecognition("zh-CN");
      const ta = document.querySelector<HTMLTextAreaElement>("#chat-input");
      if (ta) {
        ta.value = text;
        handleSend(text);
        ta.value = "";
      }
    } catch {
      // 语音识别不支持
    } finally {
      setListening(false);
    }
  };

  // 过滤掉初始触发消息，不显示在 UI
  const visibleMessages = messages.filter((msg) => {
    const text = getMessageText(msg);
    return text !== INIT_TRIGGER;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{formatError(error)}</span>
          </div>
        )}

        {visibleMessages.length === 0 && !error && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI 面试官正在准备题目...
              </span>
            ) : mode === "normal" ? (
              "面试即将开始，AI 面试官会先向你提问..."
            ) : (
              "面试即将开始，你是面试官，请开始向 AI 候选人提问..."
            )}
          </div>
        )}

        {visibleMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            content={getMessageText(msg)}
            mode={mode}
          />
        ))}

        {isLoading && visibleMessages.length > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm pl-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            AI 思考中...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4 bg-background">
        <div className="flex gap-2">
          <Textarea
            id="chat-input"
            placeholder={
              mode === "normal" ? "输入你的回答..." : "向 AI 候选人提问..."
            }
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <div className="flex flex-col gap-1">
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                const ta = document.querySelector<HTMLTextAreaElement>("#chat-input");
                if (ta?.value) {
                  handleSend(ta.value);
                  ta.value = "";
                }
              }}
              disabled={isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={listening ? "default" : "outline"}
              onClick={handleVoiceToggle}
            >
              {listening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

function MessageBubble({
  role,
  content,
  mode,
}: {
  role: "user" | "assistant" | "system";
  content: string;
  mode: "normal" | "reversed";
}) {
  if (role === "system" || !content) return null;

  const isInterviewer =
    mode === "reversed" ? role === "user" : role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-3 max-w-[85%]",
        isInterviewer ? "mr-auto" : "ml-auto flex-row-reverse"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isInterviewer ? "bg-primary/10" : "bg-muted"
        )}
      >
        {isInterviewer ? (
          <Bot className="h-4 w-4 text-primary" />
        ) : (
          <User className="h-4 w-4" />
        )}
      </div>
      <Card
        className={cn(
          "p-3 text-sm leading-relaxed",
          isInterviewer ? "bg-muted/50" : "bg-primary/5 border-primary/20"
        )}
      >
        <p className="whitespace-pre-wrap">{content}</p>
      </Card>
    </div>
  );
}
