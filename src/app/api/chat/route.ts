import { streamText } from "ai";
import { interviewModel } from "@/lib/ai/client";
import { interviewTools } from "@/lib/ai/interview-flow";
import { getInterviewerSystemPrompt } from "@/lib/ai/prompts/interviewer";
import { getIntervieweeSystemPrompt } from "@/lib/ai/prompts/interviewee";
import { COMPANY_FLOWS } from "@/config/interview-stages";

export async function POST(req: Request) {
  const { messages, config, mode } = await req.json();

  const company = COMPANY_FLOWS[config.company] ?? COMPANY_FLOWS["bytedance"];
  const currentStageIndex = config.currentStage ?? 0;
  const stage = company.stages[currentStageIndex];

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
  });

  return result.toTextStreamResponse();
}
