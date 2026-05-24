import { NextResponse } from "next/server";
import { getReview } from "@/lib/ai/actions";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await getReview(id);

    if (!report) {
      return NextResponse.json({ error: "复盘报告不存在" }, { status: 404 });
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("获取复盘报告失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取复盘报告失败" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Dynamically import to avoid circular deps
    const { generateReview } = await import("@/lib/ai/actions");
    const report = await generateReview(id);
    return NextResponse.json({ report });
  } catch (error) {
    console.error("生成复盘报告失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成复盘报告失败" },
      { status: 500 }
    );
  }
}
