import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Mic, BarChart3, RefreshCw, Briefcase } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-20 text-center px-4">
        <Badge variant="secondary" className="mb-4">
          教育赛道 · 职业规划
        </Badge>
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          你的 AI 面试教练
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          模拟大厂真实面试流程 · 反转视角角色扮演 · 智能复盘深度分析
          · 职业规划学习路径
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/interview/new">
            <Button size="lg" className="gap-2">
              <Mic className="h-5 w-5" />
              开始面试
            </Button>
          </Link>
          <Link href="/career">
            <Button size="lg" variant="outline" className="gap-2">
              <Briefcase className="h-5 w-5" />
              职业规划
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Mic className="h-8 w-8 text-primary mb-2" />
              <CardTitle>大厂面试流程</CardTitle>
              <CardDescription>
                模拟字节/阿里/腾讯真实面试流程，一面算法、二面项目、三面HR，支持压力面模式
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <RefreshCw className="h-8 w-8 text-primary mb-2" />
              <CardTitle>反转视角</CardTitle>
              <CardDescription>
                切换角色做面试官，面试 AI 候选人。通过换位思考理解面试官的评判标准
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-primary mb-2" />
              <CardTitle>复盘报告</CardTitle>
              <CardDescription>
                面试后自动生成多维度评分报告，逐题分析优缺点，给出改进计划和示范回答
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center px-4">
        <h2 className="text-2xl font-semibold mb-4">
          准备好了吗？开始你的第一场模拟面试
        </h2>
        <Link href="/interview/new">
          <Button size="lg" className="gap-2">
            立即开始
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
