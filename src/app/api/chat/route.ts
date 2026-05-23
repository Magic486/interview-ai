import { streamText } from "ai";
import { interviewModel } from "@/lib/ai/client";
import { interviewTools } from "@/lib/ai/interview-flow";
import { getInterviewerSystemPrompt } from "@/lib/ai/prompts/interviewer";
import { getIntervieweeSystemPrompt } from "@/lib/ai/prompts/interviewee";
import { COMPANY_FLOWS } from "@/config/interview-stages";
import { saveMessage, updateInterviewStage } from "@/lib/ai/actions";

const INIT_TRIGGER = "__INTERVIEW_START__";

export async function POST(req: Request) {
  const { messages, config, mode, interviewId } = await req.json();

  const company = COMPANY_FLOWS[config.company] ?? COMPANY_FLOWS["bytedance"];
  const currentStageIndex = config.currentStage ?? 0;
  const stage = company.stages[currentStageIndex];

  // 保存用户发送的消息（跳过初始触发消息）
  if (interviewId) {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === "user") {
      const contentStr =
        typeof lastMsg.content === "string"
          ? lastMsg.content
          : JSON.stringify(lastMsg.content);
      if (contentStr !== INIT_TRIGGER) {
        await saveMessage({
          interviewId,
          role: "candidate",
          content: contentStr,
          stage: stage.id,
        });
      }
    }
  }

  const systemPrompt =
    mode === "reversed"
      ? getIntervieweeSystemPrompt({
          company: company.name,
          role: config.role,
          level: config.candidateLevel ?? "中级",
        })
      : getInterviewerSystemPrompt({
          company: company.name,
          role: config.role,
          stage: {
            name: stage.name,
            focus: stage.focus,
            topics: stage.topics,
            duration: stage.duration,
          },
          stressMode: config.stressMode ?? false,
          resumeSummary: config.resumeSummary,
          currentStageIndex,
          totalStages: company.stages.length,
        });

  const result = streamText({
    model: interviewModel,
    system: systemPrompt,
    messages,
    tools: interviewTools,
    onStepFinish: async (event) => {
      if (!interviewId) return;

      for (const toolCall of event.toolCalls) {
        const tc = toolCall as {
          toolName?: string;
          input?: Record<string, unknown>;
        };
        if (tc.toolName === "advanceStage" && tc.input) {
          const nextStage = tc.input.nextStage as string;
          const isCompleted = nextStage === "completed";
          await updateInterviewStage(
            interviewId,
            isCompleted ? stage.id : nextStage,
            isCompleted ? "completed" : undefined
          );
        }

        if (tc.toolName === "evaluateAnswer" && tc.input) {
          const { score, dimension, brief } = tc.input as {
            score: number;
            dimension: string;
            brief: string;
          };
          await saveMessage({
            interviewId,
            role: "system",
            content: `[${dimension} 评分: ${score}/10] ${brief}`,
            stage: stage.id,
            score,
            feedback: brief,
          });
        }
      }
    },
    onFinish: async (event) => {
      if (!interviewId) return;

      const aiResponse = event.text;
      if (aiResponse) {
        await saveMessage({
          interviewId,
          role: "interviewer",
          content: aiResponse,
          stage: stage.id,
        });
      }
    },
  });

  return result.toTextStreamResponse();
}
