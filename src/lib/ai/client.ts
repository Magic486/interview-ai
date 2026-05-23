import { createOpenAI } from "@ai-sdk/openai";

// 如果要使用 DeepSeek，修改 baseURL 即可，兼容 OpenAI SDK 格式
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
});

// 面试模型：用于对话和面试交互（需要快速响应）
export const interviewModel = openai("gpt-4o");

// 分析模型：用于复盘报告、职业规划等不需要实时响应但需更深度分析的场景
// 可用更便宜或更强的模型，如 gpt-4o 或 deepseek-v3
export const analysisModel = openai(
  process.env.ANALYSIS_MODEL || "gpt-4o"
);
