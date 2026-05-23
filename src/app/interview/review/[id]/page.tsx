"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreRadar } from "@/components/review/ScoreRadar";
import { AnswerAnalysis } from "@/components/review/AnswerAnalysis";
import { TrendChart } from "@/components/review/TrendChart";
import { ImprovementList } from "@/components/review/ImprovementList";
import { generateReview } from "@/lib/ai/actions";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import type { ReviewReport } from "@/types";

type PageParams = { id: string };

export default function ReviewPage({ params }: { params: Promise<PageParams> }) {
  const { id } = use(params);
  const router = useRouter();
  const [report, setReport] = useState<ReviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await generateReview(id);
        if (!cancelled) setReport(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "加载复盘报告失败");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">AI 正在分析你的面试表现...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
        <h1 className="text-xl font-bold">无法加载复盘报告</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
      </div>
    );
  }

  if (!report) return null;

  const trendData = report.perQuestionAnalysis.map((q, i) => ({
    label: `Q${i + 1}`,
    score: q.score,
  }));

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">面试复盘报告</h1>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">
            {report.overallScore}
          </CardTitle>
          <CardDescription>综合评分</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>能力维度</CardTitle>
          <CardDescription>各维度得分一览</CardDescription>
        </CardHeader>
        <CardContent>
          <ScoreRadar scores={report.dimensionScores} />
        </CardContent>
      </Card>

      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>得分趋势</CardTitle>
            <CardDescription>每道题的表现变化</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart data={trendData} />
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-xl font-bold mb-4">逐题分析</h2>
        <div className="space-y-4">
          {report.perQuestionAnalysis.map((q, i) => (
            <AnswerAnalysis key={i} data={q} index={i} />
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>优势与改进</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-green-600 mb-3">Top 3 优势</h3>
            <div className="space-y-3">
              {report.top3Strengths.map((s, i) => (
                <div key={i} className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="font-medium">{i + 1}. {s.point}</p>
                  <p className="text-sm text-muted-foreground mt-1">{s.example}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-amber-600 mb-3">Top 3 待改进</h3>
            <div className="space-y-3">
              {report.top3Weaknesses.map((w, i) => (
                <div key={i} className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                  <p className="font-medium">{i + 1}. {w.point}</p>
                  <p className="text-sm text-muted-foreground mt-1">{w.example}</p>
                  <p className="text-sm font-medium mt-2">建议：{w.suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-bold mb-4">改进计划</h2>
        <ImprovementList items={report.improvementPlan} />
      </div>

      <div className="flex gap-4 justify-center">
        <Button onClick={() => router.push("/career")}>
          查看职业规划
        </Button>
        <Button variant="outline" onClick={() => router.push("/interview/new")}>
          开始新面试
        </Button>
      </div>
    </div>
  );
}
