import { streamText, convertToModelMessages } from "ai";
import { interviewModel } from "@/lib/ai/client";
import { interviewTools } from "@/lib/ai/interview-flow";
import { getInterviewerSystemPrompt } from "@/lib/ai/prompts/interviewer";
import { getIntervieweeSystemPrompt } from "@/lib/ai/prompts/interviewee";
import { COMPANY_FLOWS } from "@/config/interview-stages";
import { saveMessage, updateInterviewStage } from "@/lib/ai/actions";

const INIT_TRIGGER = "__INTERVIEW_START__";

function extractUserText(msg: Record<string, unknown>): string | null {
  if (msg.role !== "user") return null;

  if (typeof msg.content === "string") return msg.content;

  if (Array.isArray(msg.parts)) {
    const textParts = msg.parts.filter(
      (p: Record<string, unknown>) => p.type === "text"
    );
    if (textParts.length > 0) return textParts.map((p) => p.text).join("");
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[chat] Request body keys:", Object.keys(body));
    const { messages: rawMessages, config, mode, interviewId } = body;

    const company = COMPANY_FLOWS[config?.company] ?? COMPANY_FLOWS["bytedance"];
    const currentStageIndex = config?.currentStage ?? 0;
    const stage = company.stages[currentStageIndex];

    // 保存用户发送的消息（跳过初始触发消息）
    if (interviewId && rawMessages?.length > 0) {
      const lastMsg = rawMessages[rawMessages.length - 1];
      const userText = extractUserText(lastMsg);
      if (userText && userText !== INIT_TRIGGER) {
        await saveMessage({
          interviewId,
          role: "candidate",
          content: userText,
          stage: stage.id,
        });
      }
    }

    const systemPrompt =
      mode === "reversed"
        ? getIntervieweeSystemPrompt({
            company: company.name,
            role: config?.role ?? "",
            level: config?.candidateLevel ?? "中级",
          })
        : getInterviewerSystemPrompt({
            company: company.name,
            role: config?.role ?? "",
            stage: {
              name: stage.name,
              focus: stage.focus,
              topics: stage.topics,
              duration: stage.duration,
            },
            stressMode: config?.stressMode ?? false,
            resumeSummary: config?.resumeSummary,
            currentStageIndex,
            totalStages: company.stages.length,
          });

    const modelMessages = await convertToModelMessages(rawMessages);

    console.log("[chat] Starting streamText, modelMessages count:", modelMessages.length);

    const result = streamText({
      model: interviewModel,
      system: systemPrompt,
      messages: modelMessages,
      tools: interviewTools,
      onStepFinish: async (event) => {
        if (!interviewId) return;
        try {
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
        } catch (err) {
          console.error("[chat] onStepFinish error:", err);
        }
      },
      onFinish: async (event) => {
        if (!interviewId) return;
        try {
          const aiResponse = event.text;
          if (aiResponse) {
            await saveMessage({
              interviewId,
              role: "interviewer",
              content: aiResponse,
              stage: stage.id,
            });
          }
        } catch (err) {
          console.error("[chat] onFinish error:", err);
        }
      },
      onError: async (error) => {
        console.error("[chat] streamText onError:", error instanceof Error ? error.message : JSON.stringify(error));
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("[chat] POST error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
