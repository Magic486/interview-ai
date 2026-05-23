import {
  convertToModelMessages,
  streamText,
  type TextStreamPart,
  type UIMessage,
} from "ai";
import { interviewModel } from "@/lib/ai/client";
import { interviewTools } from "@/lib/ai/interview-flow";
import { getInterviewerSystemPrompt } from "@/lib/ai/prompts/interviewer";
import { getIntervieweeSystemPrompt } from "@/lib/ai/prompts/interviewee";
import { COMPANY_FLOWS } from "@/config/interview-stages";
import { saveMessage, updateInterviewStage } from "@/lib/ai/actions";

const INIT_TRIGGER = "__INTERVIEW_START__";
const START_PROMPT = "请开始本轮面试，先向候选人提出第一个问题。";
type CandidateLevel = "初级" | "中级" | "高级";

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function toModelInputMessages(messages: UIMessage[]) {
  const isInitialRequest =
    messages.length === 1 && getMessageText(messages[0]) === INIT_TRIGGER;

  return messages.flatMap((message) => {
    const text = getMessageText(message);

    if (text === INIT_TRIGGER && !isInitialRequest) {
      return [];
    }

    const normalized =
      text === INIT_TRIGGER
        ? {
            ...message,
            parts: [{ type: "text" as const, text: START_PROMPT }],
          }
        : message;

    const { id, ...messageWithoutId } = normalized;
    void id;
    return [messageWithoutId];
  });
}

function getFallbackFollowUpQuestion(stage: { id: string; name: string; focus: string }) {
  if (stage.id === "algorithm") {
    return "我们继续深入一下：如果把输入规模放大，或者出现极端边界条件，你会如何分析复杂度并保证实现的稳定性？";
  }

  if (stage.id === "project") {
    return "请你围绕刚才的回答补充一个可验证的落地细节：你会用什么指标或证据证明这个方案确实有效？";
  }

  if (stage.id === "cross") {
    return "我们换一个更综合的场景：如果这个方案上线后出现性能或稳定性问题，你会如何定位、分层排查并推动解决？";
  }

  if (stage.id === "hr") {
    return "我们继续聊职业选择：结合你的经历和目标，你为什么认为这个岗位适合你，你目前最大的短板准备怎么补？";
  }

  return `我们继续围绕${stage.name}考察：请你结合一个具体经历，进一步说明你的思考过程和取舍依据？`;
}

function hasQuestion(text: string) {
  return /[？?]/.test(text);
}

function isIntentionalEnding(text: string) {
  return /结束面试|进入复盘|点击结束|本次面试到这里|可以结束/i.test(text);
}

function ensureFollowUpQuestionTransform(
  enabled: boolean,
  fallbackQuestion: string
) {
  return () => {
    let text = "";
    let lastTextId = "";

    return new TransformStream<
      TextStreamPart<typeof interviewTools>,
      TextStreamPart<typeof interviewTools>
    >({
      transform(part, controller) {
        if (!enabled) {
          controller.enqueue(part);
          return;
        }

        if (part.type === "text-delta") {
          text += part.text;
          lastTextId = part.id;
        }

        if (
          part.type === "text-end" &&
          lastTextId &&
          !hasQuestion(text) &&
          !isIntentionalEnding(text)
        ) {
          controller.enqueue({
            type: "text-delta",
            id: lastTextId,
            text: `\n\n${fallbackQuestion}`,
          });
          text += `\n\n${fallbackQuestion}`;
        }

        controller.enqueue(part);
      },
    });
  };
}

export async function POST(req: Request) {
  try {
    const { messages = [], config, mode, interviewId } = (await req.json()) as {
      messages?: UIMessage[];
      config: {
        company?: string;
        role?: string;
        currentStage?: number;
        candidateLevel?: CandidateLevel;
        stressMode?: boolean;
        resumeSummary?: string;
        candidateProfileSummary?: string;
      };
      mode: "normal" | "reversed";
      interviewId?: string;
    };

    const company = COMPANY_FLOWS[config?.company ?? "bytedance"] ?? COMPANY_FLOWS.bytedance;
    const currentStageIndex = config?.currentStage ?? 0;
    const stage = company.stages[currentStageIndex] ?? company.stages[0];

    if (!stage) {
      return Response.json({ error: "面试阶段配置不存在" }, { status: 400 });
    }

    if (interviewId) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "user") {
        const contentStr = getMessageText(lastMsg);
        if (contentStr && contentStr !== INIT_TRIGGER) {
          await saveMessage({
            interviewId,
            role: mode === "reversed" ? "interviewer" : "candidate",
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
            role: config?.role ?? "",
            level: config?.candidateLevel ?? "中级",
          })
        : getInterviewerSystemPrompt({
            company: company.name,
            style: company.style,
            role: config?.role ?? "",
            stage: {
              name: stage.name,
              focus: stage.focus,
              topics: stage.topics,
              duration: stage.duration,
            },
            stressMode: config?.stressMode ?? false,
            resumeSummary: config?.resumeSummary,
            candidateProfileSummary: config?.candidateProfileSummary,
            currentStageIndex,
            totalStages: company.stages.length,
          });

    const tools = mode === "normal" ? interviewTools : undefined;
    const modelMessages = await convertToModelMessages(toModelInputMessages(messages), {
      tools,
      ignoreIncompleteToolCalls: true,
    });

    const result = streamText({
      model: interviewModel,
      system: systemPrompt,
      messages: modelMessages,
      tools,
      experimental_transform: ensureFollowUpQuestionTransform(
        mode === "normal",
        getFallbackFollowUpQuestion(stage)
      ),
      onError: (event) => {
        console.error("[chat] stream error:", event.error);
      },
      onStepFinish: async (event) => {
        if (!interviewId || mode !== "normal") return;

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
        } catch (error) {
          console.error("[chat] onStepFinish error:", error);
        }
      },
      onFinish: async (event) => {
        if (!interviewId) return;

        try {
          const aiResponse = event.text;
          if (aiResponse) {
            await saveMessage({
              interviewId,
              role: mode === "reversed" ? "candidate" : "interviewer",
              content: aiResponse,
              stage: stage.id,
            });
          }
        } catch (error) {
          console.error("[chat] onFinish error:", error);
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[chat] POST error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "AI 服务连接失败" },
      { status: 500 }
    );
  }
}
