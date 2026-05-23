"use server";

import { randomUUID } from "crypto";
import { generateObject } from "ai";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { COMPANY_FLOWS } from "@/config/interview-stages";
import {
  resumes,
  interviews,
  messages,
  reviews,
  learningPaths,
} from "@/lib/db/schema";
import { analysisModel } from "@/lib/ai/client";
import { getCareerAdvisorSystemPrompt } from "@/lib/ai/prompts/career-advisor";
import { getReviewerSystemPrompt } from "@/lib/ai/prompts/reviewer";
import {
  parsedResumeSchema,
  skillGapSchema,
  learningPathOutputSchema,
  reviewReportSchema,
} from "@/lib/ai/schemas";
import type {
  InterviewConfig,
  ParsedResume,
  SkillGap,
  LearningPath,
  ReviewReport,
} from "@/types";

// ========== 面试会话 ==========

export async function createInterview(
  config: InterviewConfig,
  userId?: string
): Promise<{ interviewId: string }> {
  const id = randomUUID();
  const flow = COMPANY_FLOWS[config.company] ?? COMPANY_FLOWS.bytedance;
  const stageIndex = Math.min(
    Math.max(config.stageIndex ?? 0, 0),
    flow.stages.length - 1
  );
  const firstStage = flow.stages[stageIndex]?.id ?? "algorithm";

  db.insert(interviews).values({
    id,
    userId: userId || "anonymous",
    role: config.role,
    companyType: config.company,
    mode: config.mode,
    stressMode: config.stressMode,
    status: "in_progress",
    currentStage: firstStage,
    createdAt: new Date(),
    resumeId: config.resumeId || null,
  }).run();

  return { interviewId: id };
}

export async function saveMessage(data: {
  interviewId: string;
  role: "interviewer" | "candidate" | "system";
  content: string;
  stage: string;
  codeSnippet?: string;
  score?: number;
  feedback?: string;
}): Promise<void> {
  db.insert(messages).values({
    id: randomUUID(),
    interviewId: data.interviewId,
    role: data.role,
    content: data.content,
    stage: data.stage,
    codeSnippet: data.codeSnippet || null,
    score: data.score || null,
    feedback: data.feedback || null,
    createdAt: new Date(),
  }).run();
}

export async function getMessages(interviewId: string) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.interviewId, interviewId))
    .orderBy(messages.createdAt)
    .all();
}

export async function updateInterviewStage(
  interviewId: string,
  stage: string,
  status?: string
): Promise<void> {
  const updateData: Record<string, unknown> = { currentStage: stage };
  if (status) {
    updateData.status = status;
  }
  db.update(interviews)
    .set(updateData as never)
    .where(eq(interviews.id, interviewId))
    .run();
}

// ========== 简历解析 (ArkClaw Skill 嵌入点) ==========

export async function analyzeResume(
  resumeText: string,
  userId?: string
): Promise<ParsedResume> {
  const result = await generateObject({
    model: analysisModel,
    system: getCareerAdvisorSystemPrompt(),
    schema: parsedResumeSchema,
    prompt: `请分析以下简历内容，提取技能、工作经历和教育背景：

简历内容：
${resumeText}`,
  });

  const parsed = result.object;

  if (userId) {
    const id = randomUUID();
    db.insert(resumes).values({
      id,
      userId,
      rawText: resumeText,
      parsedSkills: JSON.stringify(parsed.skills),
      parsedExperience: JSON.stringify(parsed.experience),
      education: parsed.education,
      createdAt: new Date(),
    }).run();
  }

  return { ...parsed, rawText: resumeText };
}

// ========== 技能差距分析 (ArkClaw Skill 嵌入点) ==========

export async function analyzeSkillGap(
  currentSkills: string[],
  targetRole: string
): Promise<SkillGap> {
  const skillsText = currentSkills.join("、");

  const result = await generateObject({
    model: analysisModel,
    system: getCareerAdvisorSystemPrompt(),
    schema: skillGapSchema,
    prompt: `请分析以下技能与目标岗位的差距。

当前技能：${skillsText}
目标岗位：${targetRole}

请输出技能差距分析，包括当前已有技能、目标岗位要求技能、缺失技能和匹配率。`,
  });

  return result.object;
}

// ========== 学习路径生成 ==========

export async function generateLearningPath(
  userId: string,
  targetRole: string,
  skillGap: SkillGap
): Promise<LearningPath> {
  const result = await generateObject({
    model: analysisModel,
    system: getCareerAdvisorSystemPrompt(),
    schema: learningPathOutputSchema,
    prompt: `请根据以下技能差距分析，生成一份分阶段的学习路径。

目标岗位：${targetRole}
当前已有技能：${skillGap.currentSkills.join("、")}
缺失技能：${skillGap.missingSkills.join("、")}
技能匹配率：${skillGap.matchRate}%

请设计3-4个阶段的学习计划，每个阶段2-4周，推荐具体学习资源。`,
  });

  const id = randomUUID();

  db.insert(learningPaths).values({
    id,
    userId,
    targetRole,
    gapAnalysis: JSON.stringify(skillGap),
    steps: JSON.stringify(result.object.steps),
    createdAt: new Date(),
  }).run();

  return {
    id,
    userId,
    targetRole,
    gapAnalysis: skillGap,
    steps: result.object.steps.map((s) => ({
      ...s,
      resources: s.resources,
    })),
    createdAt: new Date(),
  };
}

export async function getLearningPath(pathId: string) {
  const row = db
    .select()
    .from(learningPaths)
    .where(eq(learningPaths.id, pathId))
    .get();

  if (!row) return null;

  return {
    id: row.id,
    userId: row.userId,
    targetRole: row.targetRole,
    gapAnalysis: JSON.parse(row.gapAnalysis) as SkillGap,
    steps: JSON.parse(row.steps || "[]"),
    createdAt: new Date(row.createdAt),
  } as LearningPath;
}

// ========== 复盘报告生成 ==========

export async function generateReview(
  interviewId: string
): Promise<ReviewReport> {
  const messageList = await getMessages(interviewId);

  if (messageList.length === 0) {
    throw new Error("该面试没有对话记录");
  }

  const conversationText = messageList
    .map(
      (m) =>
        `[${m.role === "interviewer" ? "面试官" : "候选人"}]: ${m.content}`
    )
    .join("\n\n");

  const result = await generateObject({
    model: analysisModel,
    system: getReviewerSystemPrompt(),
    schema: reviewReportSchema,
    prompt: `请分析以下面试对话，生成详细的复盘报告：

${conversationText}`,
  });

  const report = result.object;

  const existing = db
    .select()
    .from(reviews)
    .where(eq(reviews.interviewId, interviewId))
    .get();

  if (existing) {
    db.update(reviews)
      .set({
        overallScore: report.overallScore,
        dimensionScores: JSON.stringify(report.dimensionScores),
        perQuestionAnalysis: JSON.stringify(report.perQuestionAnalysis),
        strengths: JSON.stringify(report.top3Strengths),
        weaknesses: JSON.stringify(report.top3Weaknesses),
        improvementPlan: JSON.stringify(report.improvementPlan),
      })
      .where(eq(reviews.id, existing.id))
      .run();
  } else {
    db.insert(reviews).values({
      id: randomUUID(),
      interviewId,
      overallScore: report.overallScore,
      dimensionScores: JSON.stringify(report.dimensionScores),
      perQuestionAnalysis: JSON.stringify(report.perQuestionAnalysis),
      strengths: JSON.stringify(report.top3Strengths),
      weaknesses: JSON.stringify(report.top3Weaknesses),
      improvementPlan: JSON.stringify(report.improvementPlan),
      createdAt: new Date(),
    }).run();
  }

  db.update(interviews)
    .set({ status: "completed" as never })
    .where(eq(interviews.id, interviewId))
    .run();

  return report;
}

export async function getReview(interviewId: string) {
  const row = db
    .select()
    .from(reviews)
    .where(eq(reviews.interviewId, interviewId))
    .get();

  if (!row) return null;

  return {
    overallScore: row.overallScore,
    dimensionScores: JSON.parse(row.dimensionScores),
    perQuestionAnalysis: JSON.parse(row.perQuestionAnalysis || "[]"),
    top3Strengths: JSON.parse(row.strengths || "[]"),
    top3Weaknesses: JSON.parse(row.weaknesses || "[]"),
    improvementPlan: JSON.parse(row.improvementPlan || "[]"),
  } as ReviewReport;
}

export async function getUserInterviews(userId: string) {
  return db
    .select()
    .from(interviews)
    .where(eq(interviews.userId, userId))
    .orderBy(desc(interviews.createdAt))
    .all();
}
