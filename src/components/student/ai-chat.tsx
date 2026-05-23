"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ChatMessage } from "@//types/student";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AiChatProps {
  context?: string;
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h1 className="text-base font-bold mt-3 mb-1">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-sm font-bold mt-2.5 mb-1">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold mt-2 mb-0.5">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="leading-relaxed mb-1.5 last:mb-0">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>
        ),
        li: ({ children }) => <li className="text-sm">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        code: ({ children }) => (
          <code className="bg-black/10 rounded px-1 py-0.5 text-xs font-mono">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="bg-black/10 rounded p-2 overflow-x-auto text-xs font-mono my-1.5">
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-slate-300 pl-2 my-1.5 text-slate-500">
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export function AiChat({ context }: AiChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/career/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          context: context || undefined,
        }),
      });

      if (!response.ok) throw new Error("请求失败");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("无法读取响应流");

      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "" },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data) as { content?: string };
              if (parsed.content) {
                assistantContent += parsed.content;
                const currentContent = assistantContent;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: currentContent,
                  };
                  return updated;
                });
              }
            } catch {
              // skip
            }
          }
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `抱歉，出现了错误：${err instanceof Error ? err.message : "未知错误"}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, context]);

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Bot className="w-5 h-5 text-amber-600" />
          职业规划 AI 顾问
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 pt-0 min-h-0">
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-3 pr-3">
            {messages.length === 0 && (
              <div className="text-center text-slate-400 text-sm py-8">
                <Bot className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>你好！我是你的职业规划 AI 顾问</p>
                <p className="text-xs mt-1">
                  可以问我任何关于职业规划的问题
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-amber-600" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm break-words overflow-hidden ${
                    msg.role === "user"
                      ? "bg-amber-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    msg.content ? (
                      <MarkdownContent content={msg.content} />
                    ) : (
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                    )
                  ) : (
                    <p className="leading-relaxed">{msg.content}</p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
        <div className="flex gap-2 pt-2 border-t border-slate-100 shrink-0">
          <Input
            placeholder="输入你的问题..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
