import { createOpenAI } from "@ai-sdk/openai";

const baseURL =
  process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

const isDeepSeek = baseURL.includes("deepseek");

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL,
});

const defaultModel = isDeepSeek ? "deepseek-chat" : "gpt-4o";

// openai.chat() 使用 Chat Completions API (/v1/chat/completions)
// openai() 默认使用 Responses API (/v1/responses)，DeepSeek 不支持
export const interviewModel = openai.chat(
  process.env.INTERVIEW_MODEL || defaultModel
);

export const analysisModel = openai.chat(
  process.env.ANALYSIS_MODEL || defaultModel
);
