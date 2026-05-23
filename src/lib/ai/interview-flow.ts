import { z } from "zod";
import { tool } from "ai";

export const advanceStageSchema = z.object({
  nextStage: z
    .enum(["algorithm", "project", "cross", "hr", "completed"])
    .describe("下一阶段，completed 表示面试结束"),
  summary: z.string().describe("当前阶段的简要总结"),
});

export const evaluateAnswerSchema = z.object({
  score: z.number().min(1).max(10).describe("1-10 分评分"),
  dimension: z
    .enum(["technical", "communication", "logic", "depth", "coding"])
    .describe("评分维度"),
  brief: z.string().describe("简短点评（一句话）"),
  shouldDigDeeper: z.boolean().optional().describe("是否需要继续深入追问该知识点"),
  nextFocus: z.string().optional().describe("如果要深入追问，重点关注什么方面"),
});

export const stressModeSchema = z.object({
  enabled: z.boolean().describe("是否开启压力面模式"),
});

export const interviewTools = {
  advanceStage: tool({
    description:
      "当当前阶段面试考察充分、可以结束时，推进到下一阶段。如果已经是最后一阶段，nextStage 设为 'completed'。调用后会返回新阶段信息，你可以据此调整面试内容。",
    inputSchema: advanceStageSchema,
    execute: async ({ nextStage, summary }) => ({
      advanced: true,
      fromStage: "已推进",
      toStage: nextStage,
      summary,
      note: nextStage === "completed" ? "面试已结束，给出最终评价" : `已进入 ${nextStage} 阶段，按新阶段要求出题`,
    }),
  }),
  evaluateAnswer: tool({
    description:
      "在候选人回答完每个问题后，对该回答进行即时评分。每题必须调用一次。返回值包含评分结果和建议的下一步行动。",
    inputSchema: evaluateAnswerSchema,
    execute: async ({ score, dimension, brief, shouldDigDeeper, nextFocus }) => ({
      score,
      dimension,
      evaluation: brief,
      recommendation: shouldDigDeeper
        ? `需要深入追问${nextFocus || dimension}方面，候选人回答还不够充分`
        : `该维度考核充分，可以进入下一个考察点`,
      nextAction: shouldDigDeeper ? "dig_deeper" : "move_on",
    }),
  }),
  stressMode: tool({
    description:
      "根据候选人表现切换压力面模式。当候选人回答过于轻松或连续答对时，可开启压力面增加难度；当候选人明显紧张或表现不佳时，可关闭压力面。",
    inputSchema: stressModeSchema,
    execute: async ({ enabled }) => ({
      stressMode: enabled,
      instruction: enabled
        ? "压力面已开启：持续追问边界条件、反例和深层原理，不接受表面回答"
        : "压力面已关闭：恢复常规面试节奏，但仍需保持专业性",
    }),
  }),
};
