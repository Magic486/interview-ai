"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload } from "lucide-react";
import { COMPANY_FLOWS, ROLES } from "@/config/interview-stages";
import { createInterview } from "@/lib/ai/actions";
import type { InterviewMode } from "@/types";

export default function NewInterviewPage() {
  const router = useRouter();
  const [mode, setMode] = useState<InterviewMode>("normal");
  const [company, setCompany] = useState("bytedance");
  const [role, setRole] = useState("");
  const [stageIndex, setStageIndex] = useState(0);
  const [stressMode, setStressMode] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const flow = COMPANY_FLOWS[company] ?? COMPANY_FLOWS.bytedance;

  const handleStart = async () => {
    if (!role) return;
    setLoading(true);

    try {
      const { interviewId } = await createInterview({
        role,
        company,
        mode,
        stressMode,
        stageIndex,
      });

      const params = new URLSearchParams({
        mode,
        role,
        company,
        stage: String(stageIndex),
        stress: String(stressMode),
      });

      router.push(`/interview/${interviewId}?${params.toString()}`);
    } catch (err) {
      console.error("创建面试失败:", err);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">创建新面试</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>面试模式</CardTitle>
            <CardDescription>选择你的角色</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as InterviewMode)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normal" id="normal" />
                <Label htmlFor="normal">我是候选人（AI 面试我）</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="reversed" id="reversed" />
                <Label htmlFor="reversed">我是面试官（我面试 AI）</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>目标公司与岗位</CardTitle>
            <CardDescription>选择你心仪的公司和目标岗位</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>公司</Label>
              <Select
                value={company}
                onValueChange={(v) => {
                  if (!v) return;
                  setCompany(v);
                  setStageIndex(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(COMPANY_FLOWS).map(([key, flow]) => (
                    <SelectItem key={key} value={key}>
                      {flow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>面试部分</Label>
              <Select
                value={String(stageIndex)}
                onValueChange={(v) => v && setStageIndex(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择本次面试部分" />
                </SelectTrigger>
                <SelectContent>
                  {flow.stages.map((stage, index) => (
                    <SelectItem key={`${stage.id}-${index}`} value={String(index)}>
                      {stage.name} · {stage.duration} 分钟
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-muted-foreground">
                本次只进行所选部分，不再自动推进完整流程。
              </p>
            </div>
            <div>
              <Label>岗位</Label>
              <Select value={role} onValueChange={(v) => v && setRole(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择目标岗位" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>压力面模式</CardTitle>
            <CardDescription>开启后 AI 将持续追问边界条件和缺陷</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="stress-mode">开启压力面</Label>
              <Switch id="stress-mode" checked={stressMode} onCheckedChange={setStressMode} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>简历（可选）</CardTitle>
            <CardDescription>上传简历让面试更有针对性</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                {resumeFile ? resumeFile.name : "拖拽文件到此处或点击上传"}
              </p>
              <label className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium transition-colors h-7 px-2.5 cursor-pointer">
                选择文件
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          </CardContent>
        </Card>

        <Button
          size="lg"
          className="w-full"
          onClick={handleStart}
          disabled={!role || loading}
        >
          {loading ? "创建中..." : "开始面试"}
        </Button>
      </div>
    </div>
  );
}
