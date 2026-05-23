import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, FileText } from "lucide-react";
import { db } from "@/lib/db";
import { interviews, reviews } from "@/lib/db/schema";
import { COMPANY_FLOWS } from "@/config/interview-stages";

function getCompanyName(companyType: string): string {
  return COMPANY_FLOWS[companyType]?.name ?? companyType;
}

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const interviewList = db
    .select()
    .from(interviews)
    .all()
    .filter((i) => i.userId === userId);

  const interviewsWithScores = await Promise.all(
    interviewList.map(async (interview) => {
      let score: number | null = null;
      if (interview.status === "completed") {
        const review = db
          .select({ overallScore: reviews.overallScore })
          .from(reviews)
          .where(eq(reviews.interviewId, interview.id))
          .get();
        score = review?.overallScore ?? null;
      }
      return { ...interview, score };
    })
  );

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold gradient-text mb-1">历史面试</h1>
          <p className="text-muted-foreground">查看你的面试记录和复盘报告</p>
        </div>
        <Link href="/interview/new">
          <Button className="gap-2 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
            <Plus className="h-4 w-4" />
            新面试
          </Button>
        </Link>
      </div>

      {interviewsWithScores.length === 0 ? (
        <Card className="glass border-0 shadow-lg text-center py-12">
          <CardContent className="space-y-4">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
            <CardTitle>暂无面试记录</CardTitle>
            <CardDescription>开始你的第一次 AI 模拟面试吧</CardDescription>
            <Link href="/interview/new">
              <Button>开始面试</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {interviewsWithScores.map((interview) => (
            <Link
              key={interview.id}
              href={
                interview.status === "completed"
                  ? `/interview/review/${interview.id}`
                  : `/interview/${interview.id}`
              }
            >
              <Card className="glass border-0 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {getCompanyName(interview.companyType)} · {interview.role}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(interview.createdAt).toLocaleDateString("zh-CN")}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {interview.mode === "reversed" ? "面试官视角" : "候选人视角"}
                      </Badge>
                      {interview.stressMode && (
                        <Badge variant="destructive" className="text-xs">
                          压力面
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    {interview.status === "completed" && interview.score != null ? (
                      <>
                        <div className="text-3xl font-extrabold gradient-text">{interview.score}</div>
                        <div className="text-sm text-muted-foreground">总分</div>
                      </>
                    ) : interview.status === "in_progress" ? (
                      <Badge>进行中</Badge>
                    ) : (
                      <div className="text-sm text-muted-foreground">{interview.status}</div>
                    )}
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
