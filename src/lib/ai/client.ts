import { createOpenAI } from "@ai-sdk/openai";

const baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const isDeepSeek = baseURL.includes("deepseek");
const defaultModel = isDeepSeek ? "deepseek-v4-pro" : "gpt-4o";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL,
});

// openai.chat() uses Chat Completions (/v1/chat/completions).
// DeepSeek does not support the Responses API used by openai().
export const interviewModel = openai.chat(
  process.env.INTERVIEW_MODEL || defaultModel
);

export const analysisModel = openai.chat(
  process.env.ANALYSIS_MODEL || defaultModel
);
