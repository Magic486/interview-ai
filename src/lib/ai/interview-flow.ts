import { z } from "zod";
import { tool } from "ai";

export const advanceStageSchema = z.object({
  nextStage: z
    .enum(["algorithm", "project", "cross", "hr", "completed"])
    .describe("下一阶段"),
  summary: z.string().describe("当前阶段的简要总结"),
});

export const evaluateAnswerSchema = z.object({
  score: z.number().min(1).max(10).describe("1-10 分评分"),
  dimension: z
    .enum(["technical", "communication", "logic", "depth", "coding"])
    .describe("评分维度"),
  brief: z.string().describe("简短点评（一句话）"),
});

export const stressModeSchema = z.object({
  enabled: z.boolean().describe("是否开启压力面模式"),
});

export const interviewTools = {
  advanceStage: tool({
    description:
      "当当前阶段面试考察充分、可以结束时，推进到下一阶段。如果已经是最后一阶段，nextStage 设为 'completed'。",
    inputSchema: advanceStageSchema,
    execute: async () => void 0,
  }),
  evaluateAnswer: tool({
    description:
      "在候选人回答完每个问题后，对该回答进行即时评分。每题调用一次。",
    inputSchema: evaluateAnswerSchema,
    execute: async () => void 0,
  }),
  stressMode: tool({
    description: "切换压力面模式，持续追问和质疑候选人的回答。",
    inputSchema: stressModeSchema,
    execute: async () => void 0,
  }),
};
