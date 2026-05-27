import type { InterviewQuestion } from "@/config/interview-questions";

interface RemoteQuestionSource {
  url: string;
  normalize: (data: unknown) => InterviewQuestion[];
}

const SOURCES: RemoteQuestionSource[] = [
  {
    url: process.env.INTERVIEW_QUESTIONS_URL ||
      "https://raw.githubusercontent.com/DopplerHQ/awesome-interview-questions/master/README.md",
    normalize: () => [],
  },
];

let remoteQuestions: InterviewQuestion[] | null = null;
let isLoading = false;
let loadFailed = false;
let loadPromise: Promise<void> | null = null;

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeQuestions(raw: string): InterviewQuestion[] {
  const results: InterviewQuestion[] = [];
  const lines = raw.split("\n");
  let currentCategory = "";
  let id = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("## ")) {
      currentCategory = trimmed.replace(/^##\s+/, "").toLowerCase();
      continue;
    }

    const match = trimmed.match(/^[-*]\s+(.+)$/);
    if (!match) continue;

    const title = match[1].replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
    if (title.length < 5 || title.length > 300) continue;

    const stage = currentCategory.includes("algorithm") || currentCategory.includes("数据结构")
      ? "algorithm" as const
      : currentCategory.includes("design") || currentCategory.includes("system")
        ? "project" as const
        : "project" as const;

    const difficulty = title.length > 80 ? "hard" as const
      : title.length > 50 ? "medium" as const
        : "easy" as const;

    id++;
    results.push({
      id: `remote-${id}`,
      stage,
      difficulty,
      title: title.slice(0, 200),
      content: title,
      tags: currentCategory.split(/[/,&\s]+/).filter((t) => t.length > 1),
    });
  }

  return results;
}

export async function getRemoteQuestions(): Promise<InterviewQuestion[]> {
  if (remoteQuestions) return remoteQuestions;
  if (loadFailed) return [];

  if (isLoading && loadPromise) {
    await loadPromise;
    return remoteQuestions ?? [];
  }

  isLoading = true;
  loadPromise = (async () => {
    console.log("[question-fetcher] 开始拉取远程题库...");

    for (const source of SOURCES) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const resp = await fetch(source.url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!resp.ok) {
          console.warn(`[question-fetcher] HTTP ${resp.status}: ${source.url}`);
          continue;
        }

        const raw = await resp.text();
        const questions = source.normalize(raw);

        if (questions.length > 0) {
          remoteQuestions = questions;
          console.log(`[question-fetcher] 远程题库加载成功: ${questions.length} 题`);
          break;
        }
      } catch (err) {
        console.warn(`[question-fetcher] 拉取失败: ${source.url} — ${err instanceof Error ? err.message : err}`);
      }
    }

    if (!remoteQuestions) {
      console.warn("[question-fetcher] 所有远程源均失败，回退内置题库");
      loadFailed = true;
      remoteQuestions = [];
    }

    isLoading = false;
  })();

  await loadPromise;
  return remoteQuestions ?? [];
}
