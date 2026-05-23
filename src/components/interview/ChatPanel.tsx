"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Send, Mic, MicOff, Loader2, User, Bot } from "lucide-react";
import type { InterviewConfig } from "@/types";

interface ChatPanelProps {
  interviewId: string;
  config: InterviewConfig & { currentStage?: number };
  mode: "normal" | "reversed";
}

function getMessageText(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function ChatPanel({ interviewId, config, mode }: ChatPanelProps) {
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { interviewId, config, mode },
    }),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text: string) => {
    if (!text.trim() || status === "streaming") return;
    sendMessage({ text: text.trim() });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e.currentTarget.value);
      e.currentTarget.value = "";
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
      const textarea = document.querySelector<HTMLTextAreaElement>("#chat-input");
      if (textarea) {
        textarea.value = text;
        handleSend(text);
        textarea.value = "";
      }
    } catch {
      // 浏览器不支持语音识别
    } finally {
      setListening(false);
    }
  };

  const isLoading = status === "streaming" || status === "submitted";

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            {mode === "normal"
              ? "面试即将开始，AI 面试官会先向你提问..."
              : "面试即将开始，你是面试官，请开始向 AI 候选人提问..."}
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            content={getMessageText(msg)}
            mode={mode}
          />
        ))}

        {isLoading && messages.length > 0 && (
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
}

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

  // 正常模式：user=候选人, assistant=面试官
  // 反转模式：user=面试官(提问者), assistant=候选人
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
