import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Target } from "lucide-react";

export default function CareerPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">职业规划</h1>
      <p className="text-muted-foreground mb-8">
        上传简历并选择目标岗位，系统将分析你的技能差距，为你生成个性化学习路径。
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Upload className="h-8 w-8 text-primary mb-2" />
            <CardTitle>上传简历</CardTitle>
            <CardDescription>上传你的简历，AI 将自动解析你的技能和经验</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              上传简历
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Target className="h-8 w-8 text-primary mb-2" />
            <CardTitle>选择目标岗位</CardTitle>
            <CardDescription>选择你想目标岗位，分析技能差距</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/interview/new">
              <Button variant="outline" className="w-full">
                分析差距
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
