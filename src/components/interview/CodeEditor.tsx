"use client";

// TODO: Person B 实现 — Monaco 代码编辑器封装
// 手撕算法场景，支持 Python / JS / Java / Go

import { Button } from "@/components/ui/button";
import { Code2 } from "lucide-react";

interface CodeEditorProps {
  language?: string;
  onLanguageChange?: (lang: string) => void;
  onSubmit?: (code: string) => void;
}

export function CodeEditor({ language = "javascript", onSubmit }: CodeEditorProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4" />
          <span className="text-sm font-medium">代码编辑器</span>
        </div>
        <Button size="sm" variant="outline">
          运行
        </Button>
      </div>
      <div className="flex-1 p-4">
        {/* TODO: 集成 @monaco-editor/react */}
        <p className="text-sm text-muted-foreground">
          代码编辑器待集成 (@monaco-editor/react)
        </p>
      </div>
    </div>
  );
}
