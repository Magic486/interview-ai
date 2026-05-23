import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";

// TODO: 从数据库获取真实数据
const mockInterviews = [
  { id: "1", role: "后端开发工程师", company: "字节跳动", date: "2026-05-22", score: 78, status: "completed" },
  { id: "2", role: "前端开发工程师", company: "阿里巴巴", date: "2026-05-21", score: 85, status: "completed" },
  { id: "3", role: "后端开发工程师", company: "腾讯", date: "2026-05-20", score: 72, status: "completed" },
];

export default function DashboardPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">历史面试</h1>
          <p className="text-muted-foreground">查看你的面试记录和复盘报告</p>
        </div>
        <Link href="/interview/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            新面试
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {mockInterviews.map((interview) => (
          <Link key={interview.id} href={`/interview/review/${interview.id}`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {interview.company} · {interview.role}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    {interview.date}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{interview.score}</div>
                  <div className="text-sm text-muted-foreground">总分</div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
