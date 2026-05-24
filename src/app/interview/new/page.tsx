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
import { loadCareerProfile } from "@/lib/career-profile";
import {
  buildCandidateProfileSummary,
  buildResumeSummaryFromFile,
  saveInterviewContext,
} from "@/lib/interview-context";
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
      const res = await fetch("/api/interview/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: { role, company, mode, stressMode, stageIndex },
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `创建面试失败 (HTTP ${res.status})`);
      }
      const { interviewId } = await res.json();
      const profile = loadCareerProfile();
      const candidateProfileSummary = buildCandidateProfileSummary(profile);
      const resumeSummary = await buildResumeSummaryFromFile(resumeFile);

      saveInterviewContext(interviewId, {
        candidateProfileSummary,
        resumeSummary,
        resumeFileName: resumeFile?.name,
      });

      const params = new URLSearchParams({
        mode,
        role,
        company,
        stage: String(stageIndex),
        stress: String(stressMode),
        profile: candidateProfileSummary ? "1" : "0",
        resume: resumeSummary ? "1" : "0",
      });

      router.push(`/interview/${interviewId}?${params.toString()}`);
    } catch (err) {
      console.error("创建面试失败:", err);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold gradient-text mb-2">创建新面试</h1>
        <p className="text-muted-foreground">配置你的 AI 模拟面试环境</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ====== 左栏：核心配置 ====== */}
        <div className="flex-1 space-y-6">
          <Card className="glass border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle>面试模式</CardTitle>
              <CardDescription>选择你的角色</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as InterviewMode)} className="flex gap-6">
                <label htmlFor="normal" className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="normal" id="normal" />
                  <span>我是候选人（AI 面试我）</span>
                </label>
                <label htmlFor="reversed" className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="reversed" id="reversed" />
                  <span>我是面试官（我面试 AI）</span>
                </label>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card className="glass border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle>目标公司与岗位</CardTitle>
              <CardDescription>选择你心仪的公司和目标岗位</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
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
                    <SelectTrigger className="mt-1.5">
                      <SelectValue>{COMPANY_FLOWS[company]?.name || "选择公司"}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(COMPANY_FLOWS).map(([key, f]) => (
                        <SelectItem key={key} value={key}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>岗位</Label>
                  <Select value={role} onValueChange={(v) => v && setRole(v)}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue>{role || "选择目标岗位"}</SelectValue>
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
              </div>
              <div>
                <Label>面试部分</Label>
                <Select
                  value={String(stageIndex)}
                  onValueChange={(v) => v && setStageIndex(Number(v))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue>{flow.stages[stageIndex]?.name || "选择本次面试部分"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {flow.stages.map((stage, index) => (
                      <SelectItem key={`${stage.id}-${index}`} value={String(index)}>
                        {stage.name} · {stage.duration} 分钟
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full py-6 text-base rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02]"
            onClick={handleStart}
            disabled={!role || loading}
          >
            {loading ? "创建中..." : "开始面试"}
          </Button>
        </div>

        {/* ====== 右栏：辅助选项 ====== */}
        <div className="lg:w-80 space-y-6">
          <Card className="glass border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
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

          <Card className="glass border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle>简历（可选）</CardTitle>
              <CardDescription>
                支持 txt、md 等纯文本简历；其他格式会记录文件名，并由面试官追问补充
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  {resumeFile ? resumeFile.name : "拖拽文件或点击上传"}
                </p>
                <label className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium transition-colors h-7 px-2.5 cursor-pointer">
                  选择文件
                  <input
                    type="file"
                    accept=".txt,.md,.markdown,text/plain,text/markdown"
                    className="hidden"
                    onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
