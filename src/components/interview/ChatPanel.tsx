"use client";

// TODO: Person B 实现 — 核心对话面板
// 对接 AI SDK 的 useChat hook，支持流式渲染、消息列表、自动滚动

export function ChatPanel() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {/* 消息列表 */}
      </div>
      <div className="border-t p-4">
        {/* 输入框 */}
      </div>
    </div>
  );
}
