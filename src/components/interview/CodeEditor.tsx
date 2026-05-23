"use client";

import { useState, useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Code2, Play } from "lucide-react";

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "go", label: "Go" },
];

interface CodeEditorProps {
  visible: boolean;
  onLanguageChange: (lang: string) => void;
  onSubmit: (code: string, language: string) => void;
}

export function CodeEditor({ visible, onLanguageChange, onSubmit }: CodeEditorProps) {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  if (!visible) return null;

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const handleLanguageSwitch = (value: string) => {
    setLanguage(value);
    onLanguageChange(value);
  };

  const handleRun = () => {
    if (!code.trim()) return;
    onSubmit(code, language);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">代码编辑器</span>
        </div>
        <Select value={language} onValueChange={(v) => v && handleLanguageSwitch(v)}>
          <SelectTrigger className="w-32 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(value) => setCode(value || "")}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>

      <div className="p-3 border-t flex gap-2">
        <Button className="flex-1 gap-2" size="sm" onClick={handleRun}>
          <Play className="h-4 w-4" />
          提交代码
        </Button>
      </div>
    </div>
  );
}
