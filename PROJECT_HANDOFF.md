# Interview.ai / 面试别慌 项目交接文档

> 用途：给新的 Codex 对话或团队成员快速接手当前项目。  
> 当前更新时间：2026-05-27  
> 当前本地分支：`master`  
> 当前同步状态：已从组长主仓库拉取最新代码，最新提交为 `49f5504 fix: catch SQLite FK errors to prevent interview interruption`。

## 1. 当前结论

我们的小组项目已经通过初赛评审，进入决赛。项目目前不是最初的脚手架状态，而是已经经历了多轮功能开发、UI 优化、AI 逻辑调试、COZE 部署适配后的可演示版本。

当前项目核心定位：

**面向大学生和求职者的 AI 面试教练与职业规划平台。**

它不是单纯的聊天机器人，而是围绕“求职准备”做了几个闭环：

1. 用户可以进行大厂风格模拟面试。
2. 面试过程中 AI 会根据公司、岗位、面试模块、简历和个人信息进行追问。
3. 面试结束后生成复盘报告，包括评分、通过概率、核心短板和提升计划。
4. 用户可以上传简历并选择目标岗位，系统结合个人信息生成职业规划和学习路径。
5. 大学生还可以使用学习路径规划模块，从专业、兴趣、技能出发获得职业推荐、路线图和资源建议。

项目已经成功部署到 COZE 平台过，组长后来针对部署做了较多适配。当前本地代码以 GitHub 主仓库最新 `master` 为准。

## 2. 仓库与本地状态

仓库地址：

```text
https://github.com/Magic486/interview-ai.git
```

当前本地目录：

```text
D:\黑客松（火山杯）\正式开发\interview-ai
```

当前关键 Git 状态：

```text
branch: master
remote: origin https://github.com/Magic486/interview-ai.git
latest commit: 49f5504 fix: catch SQLite FK errors to prevent interview interruption
```

当前本地有两个未跟踪目录，是我们后来整理材料时新增的，尚未提交：

```text
arkclaw-interview-ai-project-skill/
project-diagrams/
```

这两个目录不是业务运行必需代码：

- `arkclaw-interview-ai-project-skill/`：为 ArkClaw 准备的 skill 包，沉淀了项目经验、Prompt、schema 和示例。
- `project-diagrams/`：项目架构图、交互流程图、Agent 架构图的 SVG / draw.io 文件。

后续如果只做代码优化，可以先忽略这两个目录；如果要提交材料，可以再整理它们。

## 3. 技术栈现状

当前项目主要技术栈：

```text
Next.js 16.2.6 App Router + Turbopack
React 19
TypeScript strict mode
Tailwind CSS v4
shadcn/ui v4（Base UI 内核，不是 Radix）
Vercel AI SDK v6
DeepSeek v4 Pro
@ai-sdk/deepseek
@ai-sdk/openai
libSQL / SQLite
Drizzle ORM
pnpm
COZE 部署，端口 5000
```

注意：早期项目使用过 `better-sqlite3`，但为了 COZE 部署环境兼容，后来组长已改为 `@libsql/client + drizzle-orm/libsql`。如果看到旧文档里还写 `better-sqlite3`，以当前代码为准。

## 4. 启动与部署命令

项目现在使用 `pnpm`，不是 `npm`。

本地开发：

```bash
pnpm install
pnpm run dev
```

默认开发端口：

```text
http://localhost:5000
```

生产构建：

```bash
pnpm run build
pnpm run start
```

COZE 配置文件：

```toml
[project]
requires = ["nodejs-24"]

[dev]
build = ["bash", "./scripts/prepare.sh"]
run = ["bash", "./scripts/dev.sh"]

[deploy]
build = ["bash", "./scripts/build.sh"]
run = ["bash", "./scripts/start.sh"]
```

COZE 相关脚本：

```text
scripts/prepare.sh
scripts/dev.sh
scripts/build.sh
scripts/start.sh
```

## 5. 环境变量

项目依赖 AI Key 和模型配置。不要把真实 key 写入文档或仓库。

常用变量：

```env
OPENAI_API_KEY=你的 DeepSeek 或兼容 OpenAI API Key
OPENAI_BASE_URL=https://api.deepseek.com/v1
INTERVIEW_MODEL=deepseek-v4-pro
ANALYSIS_MODEL=deepseek-v4-pro
DATABASE_URL=file:/tmp/interview.db
```

说明：

- `OPENAI_BASE_URL` 指向 DeepSeek 时，代码会优先使用 DeepSeek provider。
- `INTERVIEW_MODEL` 用于模拟面试对话。
- `ANALYSIS_MODEL` 用于职业规划、简历分析、复盘报告等分析类任务。
- `DATABASE_URL` 在 COZE 部署时默认走 `/tmp/interview.db`，避免只读文件系统问题。

## 6. 当前项目结构

核心目录：

```text
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts                  # AI 模拟面试对话，AI SDK UI stream
│   │   ├── upload/route.ts                # 简历上传与文本读取
│   │   ├── interview/create/route.ts      # 创建面试 API，包装 Server Action
│   │   ├── interview/review/[id]/route.ts # 生成 / 获取复盘报告 API
│   │   └── career/                        # 职业规划与大学生规划相关 API
│   ├── interview/
│   │   ├── new/page.tsx                   # 创建新面试
│   │   ├── [id]/page.tsx                  # 面试进行页
│   │   └── review/[id]/page.tsx           # 面试复盘页
│   ├── career/                            # 求职规划页面
│   ├── profile/                           # 个人信息页面
│   ├── student/                           # 大学生学习路径规划页面
│   └── (auth)/sign-in/                    # 登录页，COZE 环境下不阻断核心体验
├── lib/
│   ├── ai/
│   │   ├── client.ts                      # DeepSeek / OpenAI 模型客户端
│   │   ├── interview-flow.ts              # Agent 工具：题库检索、评分、阶段控制、压力面
│   │   ├── actions.ts                     # 面试、消息、简历、规划、复盘相关 Server Actions
│   │   ├── prompts/                       # 面试官、面试者、职业规划、复盘 Prompt
│   │   └── schemas.ts                     # Zod schema
│   └── db/
│       ├── index.ts                       # libSQL + Drizzle 懒加载初始化
│       └── schema.ts                      # resumes/interviews/messages/reviews/learning_paths
├── components/
├── config/
│   ├── interview-stages.ts                # 不同公司面试流程配置
│   └── interview-questions.ts             # 面试题库
├── hooks/
└── types/
```

## 7. 产品模块现状

### 7.1 首页

首页是项目总入口，主要导向：

- 开始面试
- 求职规划
- 大学生学习路径规划

我们后来还做过海报、架构图等材料，项目最终中文展示名倾向于：

```text
面试别慌
AI 陪面试，规划求职路
```

代码内项目名仍然是 `Interview.ai`。

### 7.2 模拟面试

模拟面试是项目核心功能，也是决赛最值得继续优化的部分。

当前支持：

- 选择目标公司。
- 选择目标岗位。
- 选择面试部分，而不是自动跑完整流程。
- 候选人视角：AI 面试用户。
- 面试官视角：用户面试 AI。
- 压力面模式。
- 倒计时。
- 代码编辑器。
- 结束面试后进入复盘。
- 返回或退出时有确认逻辑，避免误触。

关键接口：

```text
src/app/api/chat/route.ts
```

当前最新提交对它做了修复：

```text
fix: catch SQLite FK errors to prevent interview interruption
```

也就是说，如果保存消息时遇到 SQLite 外键约束等 DB 错误，不再中断面试对话。

面试 Agent 的关键逻辑：

- 使用 `streamText({ stopWhen: stepCountIs(5) })`。
- 候选人视角启用 `interviewTools`。
- 面试官视角不启用工具，AI 扮演候选人回答。
- 每轮候选人消息会尝试保存到数据库。
- 工具调用包括：
  - `searchInterviewKnowledge`
  - `evaluateAnswer`
  - `advanceStage`
  - `stressMode`

### 7.3 Agent 多步推理

这是组长和我们后来强调的技术亮点。

每轮用户输入后，AI 不只是直接回复，而是可以在一次 `streamText` 中完成多步：

1. 调用 `searchInterviewKnowledge` 检索真实题库。
2. 选择最合适的题目并出题。
3. 用户回答后调用 `evaluateAnswer` 评分。
4. 根据 `suggestedAction` 自主决定下一步：
   - `ask_code`
   - `ask_approach`
   - `dig_deeper`
   - `move_on`
   - `new_topic`
5. 生成最终用户可见回复。

面试 Prompt 明确要求：

- 不能只夸用户然后停止。
- 每次回复必须是“简短评价 + 一个明确问题”。
- 回复结尾必须有问号。
- 压力面不能人身攻击，但要更直接、更追问细节。
- 当前只进行用户选择的面试模块，不自动推进完整流程。

### 7.4 面试复盘

复盘页回答这些问题：

1. 这场面试总体多少分？
2. 如果是正式面试，能不能通过？
3. 如果不能通过，核心问题是什么？
4. 每个问题回答得怎么样？
5. 下一步怎么提升？

复盘报告结构大致包括：

- `overallScore`
- `passDecision`
- `passProbability`
- `hiringVerdict`
- `coreDiagnosis`
- `dimensionScores`
- `perQuestionAnalysis`
- `top3Strengths`
- `top3Weaknesses`
- `improvementPlan`

注意：如果是“我是面试官”模式，复盘逻辑应该评价用户作为面试官的提问质量、追问深度、判断能力和节奏控制，不应评价 AI 候选人能不能通过。

### 7.5 求职规划

求职规划经历了比较多产品逻辑调整。

最初方案：

- 用户在职业规划页面上传简历。
- 填写目标岗位。
- AI 根据简历分析差距。

后来发现问题：

- 简历天然会包装求职者，只看简历会导致分析泛化。
- 用户每次进入职业规划页都填个人信息很麻烦。

最终产品逻辑：

- 个人信息独立成 `/profile` 页面。
- 职业规划页只负责上传简历、选目标岗位、发起分析和展示结果。
- 如果个人信息未完善，点击分析时跳转到个人信息页并提示补全。
- AI 分析时同时结合：
  - 简历
  - 目标岗位
  - 用户个人信息
  - 用户痛点
  - 目标周期
  - 每日可投入时间
  - 现实限制

当前职业规划输出：

- 简历解析
- 技能差距
- 核心诊断
- 盲区
- quick wins
- 个性化学习路径
- 可导出 MD / DOCX
- 可查看最近一次规划

### 7.6 个人信息

这是我们开发中比较关键的一次产品决策。

用户个人信息不是放在职业规划页里每次填写，而是放在右上角入口的独立资料页中。

典型字段：

- 教育阶段
- 专业背景
- 经验水平
- 当前状态
- 目标周期
- 每日可投入时间
- 求职偏好
- 目标城市
- 自认为优势
- 当前最大困惑 / 痛点
- 现实限制

设计意图：

- 用户只需要填写一次。
- 职业规划和模拟面试都能复用。
- 让 AI 更接近真实求职辅导，而不是只看简历说套话。

### 7.7 大学生学习路径规划

这是更偏教育赛道的模块。

流程大致是：

1. 用户填写专业、兴趣、技能、职业期望。
2. AI 生成职业推荐。
3. 选择职业方向。
4. AI 生成学习路线图。
5. AI 推荐学习资源。
6. 用户可查看进度追踪并导出。

这个模块和求职规划的区别：

- 求职规划更偏“已准备找工作/实习”的短中期目标。
- 大学生学习路径更偏“长期职业方向选择和能力建设”。

## 8. 数据库现状

当前数据库使用：

```text
@libsql/client
drizzle-orm/libsql
```

初始化位置：

```text
src/lib/db/index.ts
```

关键设计：

- 使用懒加载 `Proxy` 初始化数据库。
- 默认数据库路径：

```text
file:/tmp/interview.db
```

这样做是为了适配 COZE 或类似云端环境中项目目录可能只读的问题。

当前表：

```text
resumes
interviews
messages
reviews
learning_paths
```

注意点：

- 建表语句在 `initDb()` 中执行。
- 当前代码直接调用 `_client.execute(...)` 建表，但没有显式 `await`。如果后续遇到首次请求时表不存在或竞态问题，可以考虑把 DB 初始化改成可等待的显式初始化流程。
- 最新提交已经让 `/api/chat` 中的消息保存错误不再中断 AI 对话。

## 9. COZE 部署踩坑与当前解决方案

我们之前遇到过一个判断：本地可跑，不代表 COZE 可跑。

主要问题包括：

1. 本地 SQLite 文件路径在云端可能不可写。
2. `better-sqlite3` 是原生模块，部署环境可能不兼容。
3. Server Actions 在代理环境下可能因为 `x-forwarded-host` 不匹配出问题。
4. Clerk 认证如果没有配置完整环境变量，会影响公开展示。
5. AI Key、Base URL 和模型名必须在部署环境配置正确。

当前解决方向：

- 使用 `.coze` 明确 Node 版本和脚本。
- 使用 `scripts/*.sh` 包装构建和启动。
- 使用 `pnpm`。
- 使用端口 `5000`。
- 数据库默认放到 `/tmp/interview.db`。
- 使用 `@libsql/client` 替代 `better-sqlite3`。
- 登录和中间件不阻塞核心公网体验。
- 关键创建面试和复盘能力新增 API route 包装，减少 Server Actions 部署问题。

## 10. 开发过程中重要决策记录

### 10.1 模型统一 DeepSeek

早期有模型名和 API Key 不匹配问题，例如用 DeepSeek Key 调 `gpt-4o`。

后来统一为：

```text
OPENAI_BASE_URL=https://api.deepseek.com/v1
INTERVIEW_MODEL=deepseek-v4-pro
ANALYSIS_MODEL=deepseek-v4-pro
```

并在 `src/lib/ai/client.ts` 中根据 base URL 判断是否使用 DeepSeek provider。

### 10.2 简历初查

我们发现用户上传无关文件时，系统仍可能一本正经分析。

后来加了简历初查逻辑：

- 文本长度不能太短。
- 需要包含教育、项目、技能、工作、联系方式等简历信号。
- 不像简历时返回错误提示。

### 10.3 职业规划不要只看简历

这是一个非常关键的产品判断。

只看简历的问题：

- 简历只呈现求职者想展示的内容。
- AI 容易泛泛地说“补齐基础、做项目、练面试”。

改进：

- 加入用户个人信息。
- 让 AI 结合真实状态、痛点、目标周期和现实限制。
- 把“核心问题”作为职业规划输出的中心。

### 10.4 最近一次学习路径

学习路径是长期建议，不应该页面一刷新就丢。

但黑客松阶段不必做完整多版本历史。

当前折中：

- 保存最近一次结果。
- 默认不自动展开旧结果。
- 用户可点击查看最近一次规划。
- 重新分析后更新结果。

### 10.5 模拟面试不再自动完整流程

原本可能按算法面、技术一面、交叉面、HR 面自动推进。

后来改成：

- 创建面试时选择一个面试部分。
- 本次只进行这个部分。
- 倒计时也是当前部分倒计时。
- 结束后进入复盘。

原因：

- 更适合 demo。
- 用户可控。
- 不会一场面试拖太长。

### 10.6 AI 面试官不能变成答疑老师

测试时出现过用户问“你给我讲讲前端技术栈”，AI 就开始教学。

这不符合模拟面试。

Prompt 后来强化：

- AI 是面试官，不是答疑老师。
- 偏离面试时简短拉回。
- 必须继续追问。
- 不能只表扬。

### 10.7 压力面

压力面不是辱骂用户，而是提高追问强度。

设计要求：

- 专业、直接、有压迫感。
- 不接受泛泛回答。
- 追问依据、数据、边界、真实执行细节。
- 回答正确时继续加难度。
- 明显紧张或表现不佳时可降低强度。

### 10.8 Markdown 渲染

AI 会输出 Markdown，如加粗、列表、代码块。

面试消息框需要支持 Markdown 渲染，否则显示 `**xxx**` 很丑。

当前项目已引入 `react-markdown`。

### 10.9 返回确认

面试过程中如果用户误点浏览器返回或回首页，容易丢失面试上下文。

后来加入确认逻辑，避免手滑退出。

这块曾经出现过浏览器返回确认后第一次不跳转的问题，后续已做过深度排查和修复。

## 11. 我们额外生成的材料

当前本地未跟踪目录中有一些比赛材料：

### 11.1 ArkClaw skill 包

目录：

```text
arkclaw-interview-ai-project-skill/
```

内容：

- `SKILL.md`
- `skill.json`
- `schemas/input.schema.json`
- `schemas/output.schema.json`
- `prompts/orchestrator.md`
- `prompts/interview-agent.md`
- `prompts/career-planner.md`
- `prompts/review-report.md`
- `examples/demo-input.json`
- `examples/demo-output.json`

用途：

把项目经验沉淀成 ArkClaw 可跑的 skill 包，帮助复刻或继续扩展类似“AI 面试 + 职业规划”应用。

### 11.2 架构图与流程图

目录：

```text
project-diagrams/
```

当前包括：

- `interaction-flow.svg`
- `overall-architecture.svg`
- `overall-architecture.drawio`
- `agent-architecture.svg`
- `agent-architecture.drawio`

说明：

- SVG 可直接浏览器打开截图。
- draw.io 文件可在 diagrams.net 中继续微调。
- 总体架构图和 Agent 架构图已经按“可编辑优先”的思路生成。

## 12. 目前需要注意的代码风险

### 12.1 AGENTS.md 有部分过时

`AGENTS.md` 中仍写着：

```text
数据库: SQLite（better-sqlite3 + Drizzle ORM）
```

但当前实际代码已经是：

```text
@libsql/client + drizzle-orm/libsql
```

如果后续整理文档，建议同步修正。

### 12.2 数据库初始化可能仍有隐患

`src/lib/db/index.ts` 中 `_client.execute(...)` 没有 `await`。

在多数情况下可能没问题，但在冷启动或首次请求时，理论上可能出现建表和查询并发。

如果决赛继续强化稳定性，可以考虑：

- 做显式异步 init。
- 或在启动脚本中跑一次数据库初始化。
- 或封装 DB 操作重试。

### 12.3 AI 输出稳定性仍是核心竞争点

虽然 Prompt 已经强化，但决赛演示时仍要重点测试：

- 面试官是否持续追问。
- 压力面是否真的更强。
- 岗位适配是否明显。
- 复盘报告是否具体。
- 职业规划是否结合个人信息，而不是泛泛建议。

### 12.4 COZE 环境变量

部署时必须确认：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `INTERVIEW_MODEL`
- `ANALYSIS_MODEL`
- `DATABASE_URL`

其中 Key 不要出现在仓库和文档中。

## 13. 决赛优化建议

下面是进入决赛后最值得做的优化方向，按优先级排序。

### P0：稳定性和演示主链路

目标：任何评委点击都不应该卡死。

建议：

1. 全流程重新测试：
   - 首页
   - 创建面试
   - 模拟对话
   - 结束面试
   - 复盘报告
   - 职业规划
   - 大学生学习路径
2. 对所有 AI 接口加更清晰的加载、失败和重试状态。
3. 检查 COZE 上是否还有本地状态、DB、API timeout 问题。
4. 复盘报告生成失败时提供 fallback 文案或重试按钮。

### P1：模拟面试真实感

这是项目最容易打动评委的地方。

可以优化：

- 增加开场问候和候选人确认。
- 不同岗位有更明显差异。
- 不同公司风格更明显。
- 压力面切换有更明确表现。
- 面试题和简历/个人信息结合更自然。
- 面试过程中可以显示“本轮考察点”但不要太打扰。

### P1：复盘报告更像真实面评

可以优化：

- 给出“是否建议通过”的明确结论。
- 每个短板要引用用户原回答证据。
- 给出示范回答。
- 给出 7 天 / 14 天 / 30 天提升计划。
- 可以加雷达图或维度条形图。

### P2：职业规划差异化

职业规划要避免变成“课程推荐器”。

可以强化：

- 个人痛点诊断更犀利。
- 区分“简历问题”和“能力问题”。
- 给出投递策略。
- 给出项目包装建议。
- 对不同岗位给不同路线。
- 为大学生增加“保研/考研/就业/实习”的分支判断。

### P2：材料和展示

决赛不仅是代码，还要讲清楚项目价值。

建议准备：

- 1 张用户交互流程图。
- 1 张总体架构图。
- 1 张 Agent 多步推理架构图。
- 1 个 2-3 分钟 demo 脚本。
- 1 个典型用户故事：
  - 大三学生
  - 简历有项目但讲不深
  - 想找前端实习
  - 通过平台得到面试训练、复盘和学习路径

## 14. 新对话接手建议

如果新开 Codex 对话，建议第一句话可以这样说：

```text
请先阅读 PROJECT_HANDOFF.md，理解 Interview.ai / 面试别慌 当前项目状态。
我们已经进入决赛，当前本地代码已同步到组长 master 最新版本。
接下来请基于现有代码继续做决赛优化，不要重构无关内容。
```

然后根据具体任务继续：

- 如果是修功能，让它先读相关页面和 API。
- 如果是改 UI，让它先看现有设计系统和组件。
- 如果是部署问题，让它先看 `.coze`、`scripts/`、`src/lib/db/index.ts` 和环境变量。
- 如果是 AI 效果问题，让它先看 `src/lib/ai/prompts/`、`src/lib/ai/interview-flow.ts` 和 `src/app/api/chat/route.ts`。

## 15. 当前同步操作记录

本次窗口最后执行的同步操作：

```bash
git pull --ff-only origin master
```

结果：

```text
Updating 4dcd89c..49f5504
Fast-forward
src/app/api/chat/route.ts | 52 +++++++++++++++++++++++++++++------------------
```

当前远端最新提交：

```text
49f5504 fix: catch SQLite FK errors to prevent interview interruption
```

同步完成后，业务代码没有本地未提交修改；只有后续材料目录仍是未跟踪状态。
